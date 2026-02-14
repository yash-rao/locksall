"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Card = {
  id: string;
  label: string;
  last4: string;
  provider: string;
  status: "ACTIVE" | "BLOCKED";
};

type AuditEvent = {
  id: string;
  ts: string;
  type: string;
  message: string;
};

export default function PrototypePanel() {
  const router = useRouter();
  const { status } = useSession();

  const [cards, setCards] = useState<Card[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const authed = status === "authenticated";

  async function refresh() {
    const res = await fetch("/api/prototype/state");

    if (res.status === 401) {
      // session expired
      setCards([]);
      setAudit([]);
      return;
    }

    if (!res.ok) return;

    const data = await res.json();
    setCards(data?.state?.cards ?? []);
    setAudit(data?.state?.audit ?? []);
  }

  useEffect(() => {
    // ✅ Only run polling when authenticated
    if (!authed) return;

    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function act(path: string) {
    try {
      setLoading(true);
      const res = await fetch(path, { method: "POST" });

      if (res.status === 401) {
        router.push("/login?callbackUrl=/#prototype");
        return;
      }

      await refresh();
    } finally {
      setLoading(false);
    }
  }

  // ✅ SAFE: return null AFTER hooks exist
  if (!authed) return null;

  return (
    <section id="prototype" className="la-section">
      <h2>Prototype Dashboard</h2>
      <p className="la-section-subtitle">
        Authenticated actions only: block/unblock all linked cards with audit logs.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <button
          className="la-footer-button"
          disabled={loading}
          onClick={() => act("/api/prototype/block-all")}
        >
          {loading ? "Working..." : "BLOCK ALL"}
        </button>

        <button
          className="la-footer-button"
          disabled={loading}
          onClick={() => act("/api/prototype/unblock-all")}
        >
          {loading ? "Working..." : "UNBLOCK ALL"}
        </button>

        <button
          className="la-footer-button"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Logout
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="la-feature-card">
          <h3>Linked Cards</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {cards.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{c.label}</div>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    **** {c.last4} · {c.provider}
                  </div>
                </div>
                <span className={c.status === "BLOCKED" ? "pill pill-red" : "pill pill-green"}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="la-feature-card">
          <h3>Audit Timeline</h3>
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 10,
              maxHeight: 420,
              overflow: "auto",
            }}
          >
            {audit.length === 0 ? (
              <div style={{ opacity: 0.75 }}>No events yet.</div>
            ) : (
              audit.map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {new Date(e.ts).toLocaleString()} · {e.type}
                  </div>
                  <div style={{ marginTop: 6 }}>{e.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
