// src/components/Signup.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // flexible API base: supports CRA (REACT_APP_API_URL) and Vite (VITE_API_URL)
  const API_BASE =
    // process.env.REACT_APP_API_URL ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://localhost:5000";

  useEffect(() => {
    // cleanup on unmount: abort axios & clear timeout
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          // ignore
          console.log(e);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function validate() {
    if (!name.trim()) return "Name is required.";
    if (!email.trim()) return "Email is required.";
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  function parseError(err) {
    // Try to extract a helpful message from axios error
    const resp = err?.response?.data;
    if (!resp) return err?.message || "Registration failed";

    // Common shapes:
    // { message: "..." }  OR { errors: [...] } OR "some string"
    if (typeof resp === "string") return resp;
    if (resp.message) return resp.message;
    if (Array.isArray(resp)) return resp.join(", ");
    if (resp.errors && Array.isArray(resp.errors)) return resp.errors.join(", ");
    // fallback to JSON string
    try {
      return JSON.stringify(resp);
    } catch {
      return "Registration failed";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // abort previous controller if any
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_e) {console.log(_e); }

    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const url = `${API_BASE.replace(/\/$/, "")}/api/auth/register`;

      const res = await axios.post(
        url,
        { name: name.trim(), email: email.trim(), password },
        { signal: controller.signal, headers: { "Content-Type": "application/json" } }
      );

      setSuccess(res.data?.message || "Registration successful!");
      setError("");

      // clear form
      setName("");
      setEmail("");
      setPassword("");

      // redirect after friendly short pause (safe: saved timer to cleanup)
      timeoutRef.current = setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      if (axios.isCancel(err)) {
        // request was cancelled — don't show an error
        console.warn("Signup request cancelled");
        return;
      }
      const msg = parseError(err);
      setError(msg);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }} className="d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ maxWidth: 420, width: "94%" }}>
        <div className="card-body p-4">
          <h3 className="mb-1">Create account</h3>
          <p className="text-muted small">Simple, fast and secure.</p>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="status">{success} Redirecting...</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="signup-name">Name</label>
              <input
                id="signup-name"
                name="name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                disabled={loading}
                autoComplete="name"
                aria-required="true"
                aria-busy={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={loading}
                autoComplete="email"
                aria-required="true"
                aria-busy={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
                autoComplete="new-password"
                aria-required="true"
                aria-busy={loading}
              />
            </div>

            <div className="d-grid">
              <button className="btn btn-primary" type="submit" disabled={loading} aria-disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating account...
                  </>
                ) : "Create account"}
              </button>
            </div>
          </form>

          <hr />
          <div className="text-center small">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
