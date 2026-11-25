
import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase";

// API URL: removes any extra trailing slash
const API_BASE = (
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const MAHARASHTRA_DISTRICTS = [
  "Ahilyanagar",
  "Akola",
  "Amravati",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Chhatrapati Sambhajinagar",
  "Dharashiv",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal",
];

const AGE_GROUPS = [
  { value: "18-25", label: "18–25 years" },
  { value: "26-35", label: "26–35 years" },
  { value: "36-45", label: "36–45 years" },
  { value: "46-60", label: "46–60 years" },
  { value: "60+", label: "Above 60 years" },
];

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong. Please try again."
    );
  }

  return data;
}

function normalizePhoneInput(value) {
  return value.trim().replace(/[\s()-]/g, "");
}

export default function Auth({ onLogin, required = true }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [occupation, setOccupation] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const cleanPhone = normalizePhoneInput(phone);

  function resetForm(nextMode) {
    setMode(nextMode);
    setName("");
    setPhone("");
    setDistrict("");
    setAgeGroup("");
    setOccupation("");
    setCode("");
    setOtpSent(false);
    setError("");
    setMessage("");
  }

  async function sendOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!cleanPhone) {
      setError("Please enter your mobile number.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!district) {
        setError("Please select your district.");
        return;
      }

      if (!ageGroup) {
        setError("Please select your age group.");
        return;
      }
    }

    setLoading(true);

    try {
      await apiPost("/api/otp/send", {
        phone: cleanPhone,
        purpose: mode,
      });

      setOtpSent(true);
      setMessage("OTP sent. Please check your phone.");
    } catch (err) {
      setError(err.message || "Unable to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{4,10}$/.test(code.trim())) {
      setError("Please enter the OTP received on your phone.");
      return;
    }

    if (mode === "signup" && (!district || !ageGroup || !name.trim())) {
      setError("Please complete your name, district, and age group.");
      return;
    }

    setLoading(true);

    try {
      const result =
        mode === "signup"
          ? await apiPost("/api/auth/signup", {
              phone: cleanPhone,
              code: code.trim(),
              name: name.trim(),
              district,
              ageGroup,
              occupation: occupation.trim(),
            })
          : await apiPost("/api/auth/login", {
              phone: cleanPhone,
              code: code.trim(),
            });

      await signInWithCustomToken(auth, result.token);

      if (onLogin) {
        onLogin(result.user || null);
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div
        className="auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unnati-auth-title"
      >
        <img
          className="auth-logo"
          src="/unnati-logo.png"
          alt="UNNATI"
        />

        <h2 id="unnati-auth-title">
          {mode === "signup"
            ? "Create your UNNATI account"
            : "Welcome to UNNATI"}
        </h2>

        <p>
          {mode === "signup"
            ? "Register using your mobile number."
            : "Sign in securely using SMS OTP."}
        </p>

        <form onSubmit={otpSent ? verifyOtp : sendOtp}>
          {mode === "signup" && (
            <>
              <label htmlFor="auth-name">Full name *</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={loading || otpSent}
              />

              <label htmlFor="auth-district">District *</label>
              <select
                id="auth-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                disabled={loading || otpSent}
              >
                <option value="">Select your district</option>
                {MAHARASHTRA_DISTRICTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <label htmlFor="auth-age">Age group *</label>
              <select
                id="auth-age"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                required
                disabled={loading || otpSent}
              >
                <option value="">Select your age group</option>
                {AGE_GROUPS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label htmlFor="auth-occupation">
                Occupation (optional)
              </label>
              <input
                id="auth-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Enter your occupation"
                disabled={loading || otpSent}
              />
            </>
          )}

          <label htmlFor="auth-phone">Mobile number *</label>
          <input
            id="auth-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            required
            disabled={loading || otpSent}
          />

          {otpSent && (
            <>
              <label htmlFor="auth-otp">SMS verification code *</label>
              <input
                id="auth-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter OTP"
                required
                disabled={loading}
              />
            </>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {message && <p role="status">{message}</p>}

          <button
            className="btn primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : otpSent
                ? mode === "signup"
                  ? "Verify OTP & Register"
                  : "Verify OTP & Login"
                : "Send OTP"}
          </button>

          {otpSent && (
            <button
              className="text-btn"
              type="button"
              disabled={loading}
              onClick={sendOtp}
            >
              Resend OTP
            </button>
          )}
        </form>

        <p>
          {mode === "login"
            ? "New to UNNATI? "
            : "Already registered? "}
          <button
            className="text-btn"
            type="button"
            disabled={loading}
            onClick={() =>
              resetForm(mode === "login" ? "signup" : "login")
            }
          >
            {mode === "login" ? "Create account" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
