"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
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
  const [loadingAction, setLoadingAction] = useState<"block" | "unblock" | null>(null);

  const authed = status === "authenticated";
  const blockedCount = cards.filter((card) => card.status === "BLOCKED").length;
  const activeCount = cards.length - blockedCount;
  const posture = blockedCount === cards.length && cards.length > 0 ? "Contained" : blockedCount > 0 ? "Mixed" : "Exposed";
  const riskLabel = posture === "Contained" ? "Low residual risk" : posture === "Mixed" ? "Review required" : "Ready for action";

  async function refresh() {
    const res = await fetch("/api/prototype/state");

    if (res.status === 401) {
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
    if (!authed) return;

    refresh();
    const id = setInterval(refresh, 1800);
    return () => clearInterval(id);
  }, [authed]);

  async function act(action: "block" | "unblock") {
    const path = action === "block" ? "/api/prototype/block-all" : "/api/prototype/unblock-all";

    try {
      setLoadingAction(action);
      const res = await fetch(path, { method: "POST" });

      if (res.status === 401) {
        router.push("/login?callbackUrl=/#prototype");
        return;
      }

      await refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  if (!authed) return null;

  return (
    <section id="prototype" className="la-section">
      <div className="la-section-heading">
        <p className="la-kicker">Authenticated command center</p>
        <h2>Control card exposure from one secure screen.</h2>
        <p className="la-section-subtitle">
          Block or unblock linked cards, monitor simulated issuer responses, and keep a timestamped record
          for recovery, support, and finance review.
        </p>
      </div>

      <div className="la-prototype-panel">
        <div className="la-prototype-header">
          <div>
            <span className="la-console-label">Incident posture</span>
            <strong>{posture}</strong>
            <p className="la-prototype-muted">
              {riskLabel}. Status refreshes automatically while signed in.
            </p>
          </div>
          <div className="la-prototype-actions">
            <button
              className="la-danger-button"
              disabled={loadingAction !== null}
              onClick={() => act("block")}
            >
              {loadingAction === "block" ? "Blocking..." : "Block all cards"}
            </button>
            <button
              className="la-success-button"
              disabled={loadingAction !== null}
              onClick={() => act("unblock")}
            >
              {loadingAction === "unblock" ? "Restoring..." : "Restore access"}
            </button>
            <button className="la-footer-button" onClick={() => signOut({ callbackUrl: "/" })}>
              Logout
            </button>
          </div>
        </div>

        <div className="la-console-stats" aria-label="Prototype status summary">
          <div>
            <span>Total cards</span>
            <strong>{cards.length}</strong>
          </div>
          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
          <div>
            <span>Blocked</span>
            <strong>{blockedCount}</strong>
          </div>
          <div>
            <span>Audit events</span>
            <strong>{audit.length}</strong>
          </div>
        </div>

        <div className="la-prototype-grid">
          <div className="la-prototype-column">
            <div className="la-column-heading">
              <h3>Linked cards</h3>
              <span>Masked references only</span>
            </div>
            <div className="la-prototype-list">
              {cards.map((card) => (
                <div key={card.id} className="la-card-row">
                  <div className="la-card-mark" aria-hidden="true" />
                  <div>
                    <div className="la-card-name">{card.label}</div>
                    <div className="la-prototype-muted">
                      **** {card.last4} · {card.provider.replace("_MOCK", "")}
                    </div>
                  </div>
                  <span className={card.status === "BLOCKED" ? "pill pill-red" : "pill pill-green"}>
                    {card.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="la-prototype-column">
            <div className="la-column-heading">
              <h3>Audit timeline</h3>
              <span>Action history</span>
            </div>
            <div className="la-prototype-list la-audit-list">
              {audit.length === 0 ? (
                <div className="la-audit-row la-prototype-muted">No events yet. Run a block or restore action to create the first record.</div>
              ) : (
                audit.map((event) => (
                  <div key={event.id} className="la-audit-row">
                    <time>
                      {new Date(event.ts).toLocaleString()} · {event.type}
                    </time>
                    <div>{event.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
