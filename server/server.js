
import "dotenv/config";
import express from "express";
import cors from "cors";
import twilio from "twilio";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import admin from "firebase-admin";

const requiredEnv = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const firebaseAuth = admin.auth();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const app = express();
const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20kb" }));

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

function normalizePhone(value) {
  if (typeof value !== "string") {
    throw new Error("Enter a valid mobile number.");
  }

  const input = value.trim().replace(/[\s()-]/g, "");

  // Accept international E.164 or a 10-digit Indian mobile number.
  let phone;

  if (/^\+[1-9]\d{7,14}$/.test(input)) {
    phone = input;
  } else if (/^[6-9]\d{9}$/.test(input)) {
    phone = `+91${input}`;
  } else if (/^91[6-9]\d{9}$/.test(input)) {
    phone = `+${input}`;
  } else {
    throw new Error(
      "Enter a valid mobile number, for example +919876543210."
    );
  }

  return phone;
}

function phoneKey(phone) {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

function phoneMapping(phone) {
  return db.collection("phoneAuth").doc(phoneKey(phone));
}

async function findUserByPhone(phone) {
  const mapping = await phoneMapping(phone).get();

  if (mapping.exists && mapping.data()?.uid) {
    try {
      const user = await firebaseAuth.getUser(mapping.data().uid);

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

async function sendVerification(phone) {
  const result = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({
      to: phone,
      channel: "sms",
    });

  return result.status;
}

async function verifyCode(phone, code) {
  const result = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({
      to: phone,
      code,
    });

  return result.status === "approved";
}

function safeError(error) {
  console.error(error);
  return "Request failed. Check your details and try again.";
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "unnati-auth" });
});

// Send OTP for registration or login.
app.post("/api/otp/send", otpLimiter, async (req, res) => {
  try {
    const { purpose } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!["signup", "login"].includes(purpose)) {
      return res.status(400).json({ error: "Invalid OTP purpose." });
    }

    const existingUser = await findUserByPhone(phone);

    if (purpose === "signup" && existingUser) {
      return res.status(409).json({
        error: "This mobile number is already registered. Please log in.",
      });
    }

    if (purpose === "login" && !existingUser) {
      return res.status(404).json({
        error: "No account found for this number. Please register first.",
      });
    }

    await sendVerification(phone);

    return res.json({ ok: true, message: "OTP sent successfully." });
  } catch (error) {
    const message = error.message || "";
    const status = message.startsWith("Enter a valid") ? 400 : 500;

    return res.status(status).json({
      error:
        status === 400
          ? message
          : safeError(error),
    });
  }
});

// Verify OTP first, then create a phone-only Firebase user.
app.post("/api/auth/signup", authLimiter, async (req, res) => {
  let createdUid = null;
  let phone = null;

  try {
    phone = normalizePhone(req.body.phone);

    const { code, name, district, ageGroup = "", occupation = "" } = req.body;

    if (
      typeof code !== "string" ||
      !/^\d{4,10}$/.test(code) ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof district !== "string" ||
      !district.trim()
    ) {
      return res.status(400).json({
        error: "Phone, valid OTP, name and district are required.",
      });
    }

    // OTP approval is required before account creation.
    const approved = await verifyCode(phone, code);

    if (!approved) {
      return res.status(400).json({ error: "Incorrect or expired OTP." });
    }

    // Recheck after verification to prevent duplicate phone registration.
    const existingUser = await findUserByPhone(phone);

    if (existingUser) {
      return res.status(409).json({
        error: "This mobile number is already registered. Please log in.",
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
      ageGroup: String(ageGroup || ""),
      occupation: String(occupation || ""),
      preferredLanguage: "en",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();

    batch.set(db.collection("users").doc(userRecord.uid), profile);

    batch.set(phoneMapping(phone), {
      uid: userRecord.uid,
      phoneNumber: phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    const token = await firebaseAuth.createCustomToken(userRecord.uid);

    return res.status(201).json({
      token,
      user: {
        uid: userRecord.uid,
        displayName: userRecord.displayName,
        phoneNumber: userRecord.phoneNumber,
      },
    });
  } catch (error) {
    // Roll back a newly created Auth user if profile setup failed.
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

// Verify a fresh OTP before signing in an existing phone account.
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { code } = req.body;

    if (typeof code !== "string" || !/^\d{4,10}$/.test(code)) {
      return res.status(400).json({ error: "Enter a valid OTP." });
    }

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.status(404).json({
        error: "No account found for this number. Please register first.",
      });
    }

    const approved = await verifyCode(phone, code);

    if (!approved) {
      return res.status(400).json({ error: "Incorrect or expired OTP." });
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

app.listen(PORT, () => {
  console.log(`UNNATI authentication backend listening on port ${PORT}`);
});
