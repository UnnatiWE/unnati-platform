import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { districts } from "../data/districts";

export default function Auth({
  mode,
  setMode,
  onClose,
  required = false
}) {
  const signup = mode === "signup";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    district: "",
    ageGroup: "",
    occupation: ""
  });

  const [msg, setMsg] = useState("");

  function update(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    try {
      // ==============================
      // CREATE ACCOUNT
      // ==============================
      if (signup) {
        const result = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

        await setDoc(
          doc(db, "users", result.user.uid),
          {
            name: form.name,
            email: form.email,
            state: "Maharashtra",
            district: form.district,
            ageGroup: form.ageGroup,
            occupation: form.occupation,
            preferredLanguage:
              localStorage.getItem("unnatiLanguage") || "en",
            createdAt: serverTimestamp()
          }
        );
      }

      // ==============================
      // LOGIN
      // ==============================
      else {
        await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
      }

      // App.jsx will detect Firebase login
      onClose();

    } catch (err) {
      let errorMessage =
        err.message || "Authentication failed.";

      errorMessage = errorMessage.replace(
        "Firebase: ",
        ""
      );

      if (
        errorMessage.includes(
          "auth/invalid-credential"
        )
      ) {
        errorMessage =
          "Incorrect email or password.";
      }

      else if (
        errorMessage.includes(
          "auth/user-not-found"
        )
      ) {
        errorMessage =
          "No account exists with this email.";
      }

      else if (
        errorMessage.includes(
          "auth/wrong-password"
        )
      ) {
        errorMessage =
          "Incorrect password.";
      }

      else if (
        errorMessage.includes(
          "auth/email-already-in-use"
        )
      ) {
        errorMessage =
          "An account already exists with this email.";
      }

      else if (
        errorMessage.includes(
          "auth/weak-password"
        )
      ) {
        errorMessage =
          "Password must be at least 6 characters.";
      }

      else if (
        errorMessage.includes(
          "auth/invalid-email"
        )
      ) {
        errorMessage =
          "Please enter a valid email address.";
      }

      setMsg(errorMessage);
    }
  }

  return (
    <div className="modal-backdrop">

      <div className="auth-card">

        {!required && (
          <button
            className="close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        )}

        <img
          src="/unnati-logo.png"
          className="auth-logo"
          alt="UNNATI"
        />

        <h2>
          {signup
            ? "Create your account"
            : "Welcome to UNNATI"}
        </h2>

        {!signup && (
          <p>
            Please login to access the
            UNNATI platform.
          </p>
        )}

        <form onSubmit={submit}>

          {/* NAME - SIGNUP ONLY */}
          {signup && (
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={update}
              required
            />
          )}

          {/* EMAIL */}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={update}
            required
            autoComplete="email"
          />

          {/* PASSWORD */}
          <input
            name="password"
            type="password"
            minLength="6"
            placeholder="Password"
            value={form.password}
            onChange={update}
            required
            autoComplete={
              signup
                ? "new-password"
                : "current-password"
            }
          />

          {/* SIGNUP INFORMATION */}
          {signup && (
            <>
              <input
                value="Maharashtra"
                disabled
              />

              <select
                name="district"
                value={form.district}
                onChange={update}
                required
              >
                <option value="">
                  Select District
                </option>

                {districts.map((district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                ))}
              </select>

              <select
                name="ageGroup"
                value={form.ageGroup}
                onChange={update}
              >
                {[
                  "Under 18",
                  "18–25",
                  "26–40",
                  "41–60",
                  "60+"
                ].map((age) => (
                  <option
                    key={age}
                    value={age}
                  >
                    {age}
                  </option>
                ))}
              </select>

              <select
                name="occupation"
                value={form.occupation}
                onChange={update}
              >
                {[
                  "Homemaker",
                  "Farmer",
                  "Entrepreneur",
                  "Student",
                  "Artisan",
                  "Worker",
                  "Other"
                ].map((occupation) => (
                  <option
                    key={occupation}
                    value={occupation}
                  >
                    {occupation}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            className="btn primary"
            type="submit"
          >
            {signup
              ? "Create Account"
              : "Login"}
          </button>

        </form>

        {/* ERROR */}
        {msg && (
          <p className="error">
            {msg}
          </p>
        )}

        {/* SWITCH LOGIN / SIGNUP */}
        <p>
          {signup
            ? "Already have an account?"
            : "New to Unnati?"}

          {" "}

          <button
            type="button"
            className="text-btn"
            onClick={() =>
              setMode(
                signup
                  ? "login"
                  : "signup"
              )
            }
          >
            {signup
              ? "Login"
              : "Create Account"}
          </button>
        </p>

      </div>

    </div>
  );
}