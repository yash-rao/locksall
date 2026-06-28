"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../login/LoginClient.module.css";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setResetUrl(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Unable to start password reset.");

      setMessage(data?.message || "If an account exists for that email, a reset link has been sent.");
      setResetUrl(data?.resetUrl || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`la-page ${styles.authPage}`}>
      <div className="la-bg" aria-hidden="true">
        <div className="la-bg-grid" />
      </div>

      <section className={styles.authShell}>
        <div className={styles.authStory}>
          <Link className="la-logo" href="/">Locks<span>All</span></Link>
          <p className="la-kicker">Password recovery</p>
          <h1>Reset access securely.</h1>
          <p className={styles.authCopy}>
            Enter the email on your LocksAll account. We will send a time-limited link to reset your password.
          </p>
        </div>

        <form className={styles.authCard} onSubmit={onSubmit}>
          <div>
            <h2>Forgot password</h2>
            <p className="la-prototype-muted">Reset links expire after 30 minutes.</p>
          </div>

          <label className={styles.authField}>
            <span>Email</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <button className={styles.authSubmit} disabled={loading} type="submit">
            {loading ? "Sending reset link..." : "Send reset link"}
          </button>

          {message && <p className={styles.authMessage}>{message}</p>}
          {resetUrl && (
            <p className={styles.authMessage}>
              Test reset link: <Link href={resetUrl}>Open reset page</Link>
            </p>
          )}
          {error && <p className={styles.authError}>{error}</p>}

          <p className="la-prototype-muted">
            Remembered it? <Link href="/login">Back to sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
