"use client";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

type Card = {
  id: string;
  label: string;
  last4: string;
  provider: "AMEX_MOCK" | "BOFA_MOCK" | "CAPONE_MOCK";
  status: "ACTIVE" | "BLOCKED";
};

type AuditEvent = {
  id: string;
  ts: string;
  type: string;
  message: string;
};


export default function PrototypePage() {
  const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
  const res = await fetch("/api/prototype/state");

  // 🔐 If session missing, redirect to login
  if (res.status === 401) {
    router.push("/login?callbackUrl=/prototype");
    return;
  }

  // Any other non-OK
  if (!res.ok) {
    console.error("State fetch failed:", res.status);
    return;
  }

  const data = await res.json();

  // ✅ Defensive fallback
  const cards = data?.state?.cards ?? [];
  const audit = data?.state?.audit ?? [];

  setCards(cards);
  setAudit(audit);
}


  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, []);

  async function act(path: string) {
    try {
      setLoading(true);
      await fetch(path, { method: "POST" });
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="la-page">
      {/* Use your same background + content styles */}
      <div className="la-content" style={{ paddingTop: 24 }}>
        <header className="la-nav">
          <div className="la-logo">
            Locks<span>All</span>
          </div>
          <nav className="la-nav-links">
            <button onClick={() => (window.location.href = "/")}>Home</button>
          </nav>
        </header>

        <section className="la-section" style={{ paddingTop: 20 }}>
          <h2>Prototype: Lock/Unlock All Cards</h2>
          <p className="la-section-subtitle">
            Demo flow: one click blocks/unblocks all linked cards + audit log.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
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
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="la-feature-card">
              <h3>Linked Cards (Mock)</h3>
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
                    <span
                      className={
                        c.status === "BLOCKED"
                          ? "pill pill-red"
                          : "pill pill-green"
                      }
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="la-feature-card">
              <h3>Audit Timeline</h3>
              <div style={{ display: "grid", gap: 10, marginTop: 10, maxHeight: 420, overflow: "auto" }}>
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
      </div>
    </main>
  );
}
