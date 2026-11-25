
import "dotenv/config";
import express from "express";
import cors from "cors";
import twilio from "twilio";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import fs from "node:fs";
import admin from "firebase-admin";

// Required Twilio environment variables
const requiredEnv = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Load Firebase credentials:
// 1. Vercel: FIREBASE_SERVICE_ACCOUNT_JSON
// 2. Local: server/serviceAccountKey.json
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    );
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON."
    );
  }
} else {
  const serviceAccountPath = new URL(
    "./serviceAccountKey.json",
    import.meta.url
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel or place serviceAccountKey.json inside the server folder."
    );
  }

  try {
    serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );
  } catch {
    throw new Error(
      "Firebase serviceAccountKey.json is invalid JSON."
    );
  }
}

// Validate Firebase service-account JSON
if (
  serviceAccount.type !== "service_account" ||
  !serviceAccount.project_id ||
  !serviceAccount.private_key ||
  !serviceAccount.client_email
) {
  throw new Error(
    "Firebase service-account JSON is missing required fields."
  );
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
const firebaseAuth = admin.auth();

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Express application
const app = express();
const PORT = Number(process.env.PORT || 5000);

// Allowed frontend origins
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.disable("x-powered-by");

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20kb" }));

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many OTP requests. Please try again later.",
  },
});

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Please try again later.",
  },
});

// Normalize Indian or international phone numbers
function normalizePhone(value) {
  if (typeof value !== "string") {
    throw new Error("Enter a valid mobile number.");
  }

  const input = value.trim().replace(/[\s()-]/g, "");

  if (/^\+[1-9]\d{7,14}$/.test(input)) {
    return input;
  }

  if (/^[6-9]\d{9}$/.test(input)) {
    return `+91${input}`;
  }

  if (/^91[6-9]\d{9}$/.test(input)) {
    return `+${input}`;
  }

  throw new Error(
    "Enter a valid mobile number, for example +919876543210."
  );
}

// Hash phone number before using it as a Firestore document ID
function phoneKey(phone) {
  return crypto
    .createHash("sha256")
    .update(phone)
    .digest("hex");
}

function phoneMapping(phone) {
  return db.collection("phoneAuth").doc(phoneKey(phone));
}

// Find Firebase user by phone number
async function findUserByPhone(phone) {
  const mapping = await phoneMapping(phone).get();

  if (mapping.exists && mapping.data()?.uid) {
    try {
      const user = await firebaseAuth.getUser(
        mapping.data().uid
      );

      if (user.phoneNumber === phone) {
        return user;
      }

      await mapping.ref.delete();
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }

      await mapping.ref.delete();
    }
  }

  try {
    const user = await firebaseAuth.getUserByPhoneNumber(phone);

    await phoneMapping(phone).set({
      uid: user.uid,
      phoneNumber: phone,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return user;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

// Send OTP using Twilio Verify
async function sendVerification(phone) {
  const result = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({
      to: phone,
      channel: "sms",
    });

  return result.status;
}

// Verify OTP using Twilio Verify
async function verifyCode(phone, code) {
  const result = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({
      to: phone,
      code,
    });

  return result.status === "approved";
}

// Safe error response
function safeError(error) {
  console.error(error);
  return "Request failed. Check your details and try again.";
}

// Health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "unnati-auth",
  });
});

// Send OTP for signup or login
app.post("/api/otp/send", otpLimiter, async (req, res) => {
  try {
    const { purpose } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!["signup", "login"].includes(purpose)) {
      return res.status(400).json({
        error: "Invalid OTP purpose.",
      });
    }

    const existingUser = await findUserByPhone(phone);

    if (purpose === "signup" && existingUser) {
      return res.status(409).json({
        error:
          "This mobile number is already registered. Please log in.",
      });
    }

    if (purpose === "login" && !existingUser) {
      return res.status(404).json({
        error:
          "No account found for this number. Please register first.",
      });
    }

    await sendVerification(phone);

    return res.json({
      ok: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    const message = error.message || "";
    const status = message.startsWith("Enter a valid") ? 400 : 500;

    return res.status(status).json({
      error: status === 400 ? message : safeError(error),
    });
  }
});

// Signup using phone number and OTP
app.post("/api/auth/signup", authLimiter, async (req, res) => {
  let createdUid = null;

  try {
    const phone = normalizePhone(req.body.phone);

    const {
      code,
      name,
      district,
      ageGroup,
      occupation = "",
    } = req.body;

    if (
      typeof code !== "string" ||
      !/^\d{4,10}$/.test(code) ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof district !== "string" ||
      !district.trim() ||
      typeof ageGroup !== "string" ||
      !ageGroup.trim()
    ) {
      return res.status(400).json({
        error:
          "Phone, valid OTP, name, district and age group are required.",
      });
    }

    const approved = await verifyCode(phone, code);

    if (!approved) {
      return res.status(400).json({
        error: "Incorrect or expired OTP.",
      });
    }

    const existingUser = await findUserByPhone(phone);

    if (existingUser) {
      return res.status(409).json({
        error:
          "This mobile number is already registered. Please log in.",
      });
    }

    const userRecord = await firebaseAuth.createUser({
      displayName: name.trim(),
      phoneNumber: phone,
    });

    createdUid = userRecord.uid;

    const profile = {
      uid: userRecord.uid,
      name: name.trim(),
      phoneNumber: phone,
      phoneVerified: true,
      district: district.trim(),
      ageGroup: ageGroup.trim(),
      occupation: String(occupation || ""),
      preferredLanguage: "en",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();

    batch.set(
      db.collection("users").doc(userRecord.uid),
      profile
    );

    batch.set(phoneMapping(phone), {
      uid: userRecord.uid,
      phoneNumber: phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    const token = await firebaseAuth.createCustomToken(
      userRecord.uid
    );

    return res.status(201).json({
      token,
      user: {
        uid: userRecord.uid,
        displayName: userRecord.displayName,
        phoneNumber: userRecord.phoneNumber,
      },
    });
  } catch (error) {
    if (createdUid) {
      try {
        await firebaseAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error("Account rollback failed:", rollbackError);
      }
    }

    const message = error.message || "";
    const status = message.startsWith("Enter a valid") ? 400 : 500;

    return res.status(status).json({
      error: status === 400 ? message : safeError(error),
    });
  }
});

// Login using phone number and OTP
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { code } = req.body;

    if (
      typeof code !== "string" ||
      !/^\d{4,10}$/.test(code)
    ) {
      return res.status(400).json({
        error: "Enter a valid OTP.",
      });
    }

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.status(404).json({
        error:
          "No account found for this number. Please register first.",
      });
    }

    const approved = await verifyCode(phone, code);

    if (!approved) {
      return res.status(400).json({
        error: "Incorrect or expired OTP.",
      });
    }

    const token = await firebaseAuth.createCustomToken(user.uid);

    return res.json({
      token,
      user: {
        uid: user.uid,
        displayName: user.displayName || "",
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    const message = error.message || "";
    const status = message.startsWith("Enter a valid") ? 400 : 500;

    return res.status(status).json({
      error: status === 400 ? message : safeError(error),
    });
  }
});

// Start backend
app.listen(PORT, () => {
  console.log(
    `UNNATI authentication backend listening on port ${PORT}`
  );
});
