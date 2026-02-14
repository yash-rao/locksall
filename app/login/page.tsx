"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/prototype";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.ok) router.push(callbackUrl);
    else setErr("Invalid credentials");
  }

  return (
    <main className="la-page">
      <div className="la-content" style={{ paddingTop: 48, maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Sign in</h1>
        <p style={{ opacity: 0.75, marginTop: 0 }}>
          Login to access the LocksAll prototype.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 18 }}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
            }}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
            }}
          />

          <button className="la-footer-button" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {err && <p style={{ color: "rgba(239,68,68,0.95)" }}>{err}</p>}
        </form>
      </div>
    </main>
  );
}
