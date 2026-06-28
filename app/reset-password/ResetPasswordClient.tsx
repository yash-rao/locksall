"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "../login/LoginClient.module.css";

export default function ResetPasswordClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const passwordLabel = ["Too short", "Getting there", "Good", "Strong", "Excellent"][passwordScore];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Unable to reset password.");

      setMessage(data?.message || "Password updated. You can sign in now.");
      setPassword("");
      setTimeout(() => router.push("/login"), 1200);
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
          <p className="la-kicker">Choose a new password</p>
          <h1>Recover your account.</h1>
          <p className={styles.authCopy}>
            Reset links can be used once and expire after 30 minutes. After updating your password, sign in again.
          </p>
        </div>

        <form className={styles.authCard} onSubmit={onSubmit}>
          <div>
            <h2>Reset password</h2>
            <p className="la-prototype-muted">
              {token ? "Enter a new password for your account." : "This reset link is missing a token."}
            </p>
          </div>

          <label className={styles.authField}>
            <span>New password</span>
            <div className={styles.passwordControl}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Enter new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={!token}
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className={styles.passwordMeter} aria-label="Password strength">
            <div>
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className={index < passwordScore ? styles.active : ""} />
              ))}
            </div>
            <p>{passwordLabel}. Use 8+ characters with a number for a stronger account.</p>
          </div>

          <button className={styles.authSubmit} disabled={loading || !token} type="submit">
            {loading ? "Updating password..." : "Update password"}
          </button>

          {message && <p className={styles.authMessage}>{message}</p>}
          {error && <p className={styles.authError}>{error}</p>}

          <p className="la-prototype-muted">
            Need a new link? <Link href="/forgot-password">Request another reset</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
