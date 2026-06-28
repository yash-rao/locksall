"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./LoginClient.module.css";

type AuthMode = "signin" | "signup";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/#prototype";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
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

  function resetStatus(nextMode: AuthMode) {
    setMode(nextMode);
    setErr(null);
    setMessage(null);
  }

  async function completeSignin() {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
      return true;
    }

    setErr("Email or password is incorrect.");
    return false;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Unable to create account.");
        }

        setMessage("Account created. Taking you to the prototype...");
      }

      await completeSignin();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
      setErr(errorMessage);
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
          <button className="la-logo" onClick={() => router.push("/")}>Locks<span>All</span></button>
          <p className="la-kicker">Secure account access</p>
          <h1>{mode === "signin" ? "Welcome back." : "Create your command center."}</h1>
          <p className={styles.authCopy}>
            Sign in to open the emergency card-control prototype, review linked-card status,
            and keep a timestamped audit trail of every action.
          </p>
          <div className={styles.authProof}>
            <span>Database accounts</span>
            <span>Hashed passwords</span>
            <span>Protected prototype routes</span>
          </div>
        </div>

        <form className={styles.authCard} onSubmit={onSubmit}>
          <div className={styles.authSwitch} role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={mode === "signin" ? styles.active : ""}
              onClick={() => resetStatus("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? styles.active : ""}
              onClick={() => resetStatus("signup")}
            >
              Sign up
            </button>
          </div>

          <div>
            <h2>{mode === "signin" ? "Sign in" : "Start with LocksAll"}</h2>
            <p className="la-prototype-muted">
              {mode === "signin"
                ? "Use your LocksAll account credentials."
                : "Create an account, then you will be signed in automatically."}
            </p>
          </div>

          {mode === "signup" && (
            <label className={styles.authField}>
              <span>Name</span>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          <label className={styles.authField}>
            <span>Email</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className={styles.authField}>
            <span>Password</span>
            <div className={styles.passwordControl}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {mode === "signup" && (
            <div className={styles.passwordMeter} aria-label="Password strength">
              <div>
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} className={index < passwordScore ? styles.active : ""} />
                ))}
              </div>
              <p>{passwordLabel}. Use 8+ characters with a number for a stronger account.</p>
            </div>
          )}

          <button className={styles.authSubmit} disabled={loading} type="submit">
            {loading
              ? mode === "signin" ? "Signing in..." : "Creating account..."
              : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {message && <p className={styles.authMessage}>{message}</p>}
          {err && <p className={styles.authError}>{err}</p>}
        </form>
      </section>
    </main>
  );
}
