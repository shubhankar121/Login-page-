// src/components/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
// import "./assets/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    try {
      setLoading(true);

      // IMPORTANT: withCredentials true lets browser accept httpOnly cookie from server
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password, remember },
        { withCredentials: true }
      );

      // server returns small user info in body — optional to use
      // redirect to protected page
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.response?.data || err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ maxWidth: 420, width: "94%" }}>
        <div className="card-body p-4">
          <h3 className="card-title mb-1">Welcome back</h3>
          <p className="text-muted small mb-3">Sign in to continue to your account.</p>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input
                type="email"
                className="form-control form-control-lg rounded-3"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Password</label>
              <input
                type="password"
                className="form-control form-control-lg rounded-3"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input
                  id="remember"
                  className="form-check-input"
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(r => !r)}
                  disabled={loading}
                />
                <label className="form-check-label small" htmlFor="remember">Remember me</label>
              </div>

              <Link to="/forgot-password" className="small">Forgot password?</Link>
            </div>

            <div className="d-grid">
              <button className="btn btn-primary btn-lg rounded-3" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : "Sign in"}
              </button>
            </div>
          </form>

          <hr className="my-4" />
          <div className="text-center small">
            Don't have an account? <Link to="/register">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
