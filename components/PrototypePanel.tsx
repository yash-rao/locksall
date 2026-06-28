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

      <style jsx global>{`
        .la-console-label {
          display: block;
          margin-bottom: 0.35rem;
          color: #bd9252;
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .la-prototype-header strong {
          display: block;
          color: #fff7ea;
          font-size: clamp(1.8rem, 3.2vw, 3rem);
          line-height: 1;
        }

        .la-console-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .la-console-stats div {
          border: 1px solid rgba(248, 241, 230, 0.1);
          border-radius: 8px;
          background: rgba(5, 5, 5, 0.32);
          padding: 0.85rem;
        }

        .la-console-stats span,
        .la-column-heading span {
          display: block;
          color: #a89f91;
          font-size: 0.78rem;
          font-weight: 750;
        }

        .la-console-stats strong {
          display: block;
          margin-top: 0.35rem;
          color: #fff7ea;
          font-size: 1.65rem;
          line-height: 1;
        }

        .la-column-heading {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: baseline;
          border-bottom: 1px solid rgba(248, 241, 230, 0.09);
          padding-bottom: 0.8rem;
        }

        .la-column-heading h3 {
          margin: 0;
          color: #fff7ea;
        }

        .la-card-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
        }

        .la-card-mark {
          width: 42px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(189, 146, 82, 0.38);
          background: linear-gradient(135deg, rgba(189, 146, 82, 0.24), rgba(248, 241, 230, 0.06));
          box-shadow: inset 0 -10px 18px rgba(5, 5, 5, 0.28);
        }

        .la-audit-row div {
          color: #f8f1e6;
          line-height: 1.45;
        }

        @media (max-width: 980px) {
          .la-console-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .la-console-stats,
          .la-card-row {
            grid-template-columns: 1fr;
          }

          .la-column-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
