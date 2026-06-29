"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import styles from "./dashboard.module.css";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: "USER" | "ADMIN" | "GLOBAL_ADMIN";
  isAdmin?: boolean;
  isGlobalAdmin?: boolean;
};

type Card = {
  id: string;
  label: string;
  last4: string;
  provider: string;
  type?: string | null;
  status: "ACTIVE" | "BLOCKED";
};

type AuditEvent = {
  id: string;
  ts: string;
  type: string;
  message: string;
};

type DashboardState = {
  cards: Card[];
  audit: AuditEvent[];
};

type ConfirmDialog = {
  title: string;
  body: string;
  actionLabel: string;
  tone: "danger" | "safe";
  onConfirm: () => Promise<void>;
};

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<DashboardState>({ cards: [], audit: [] });
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"block" | "unblock" | null>(null);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [error, setError] = useState("");

  const blockedCount = state.cards.filter((card) => card.status === "BLOCKED").length;
  const activeCount = state.cards.length - blockedCount;
  const profileItems = [user?.name, user?.phone, user?.address, state.cards.length > 0];
  const profileComplete = profileItems.filter(Boolean).length;
  const profilePercent = Math.round((profileComplete / profileItems.length) * 100);

  const posture = useMemo(() => {
    if (state.cards.length === 0) return { label: "Setup needed", tone: "warning", body: "Add at least one masked card to unlock emergency controls." };
    if (blockedCount === state.cards.length) return { label: "Contained", tone: "safe", body: "All saved cards are currently blocked." };
    if (blockedCount > 0) return { label: "Mixed", tone: "warning", body: "Some cards are blocked while others remain active." };
    return { label: "Ready", tone: "active", body: "Cards are active and ready for emergency response." };
  }, [blockedCount, state.cards.length]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const [accountRes, stateRes] = await Promise.all([
      fetch("/api/account"),
      fetch("/api/prototype/state"),
    ]);

    if (accountRes.status === 401 || stateRes.status === 401) {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    const accountData = await accountRes.json().catch(() => ({}));
    const stateData = await stateRes.json().catch(() => ({}));

    if (!accountRes.ok || !stateRes.ok) {
      setError(accountData?.message || stateData?.message || "Unable to load dashboard.");
      setLoading(false);
      return;
    }

    setUser(accountData.user);
    setState(stateData.state || { cards: [], audit: [] });
    setLoading(false);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/dashboard");
    if (status === "authenticated") loadDashboard();
  }, [status]);

  function confirmBulkAction(nextAction: "block" | "unblock") {
    setConfirm({
      title: nextAction === "block" ? "Block all cards?" : "Restore all cards?",
      body: nextAction === "block"
        ? "All saved cards will be marked blocked and the action will be written to the audit timeline."
        : "All saved cards will be restored to active status and the action will be written to the audit timeline.",
      actionLabel: nextAction === "block" ? "Block all cards" : "Restore all cards",
      tone: nextAction === "block" ? "danger" : "safe",
      onConfirm: async () => { await runAction(nextAction); },
    });
  }

  async function runAction(nextAction: "block" | "unblock") {
    setAction(nextAction);
    setError("");

    const res = await fetch(nextAction === "block" ? "/api/prototype/block-all" : "/api/prototype/unblock-all", {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message || "Unable to run action.");
      setAction(null);
      return;
    }

    await loadDashboard();
    setAction(null);
  }

  async function runConfirmedAction() {
    if (!confirm) return;
    await confirm.onConfirm();
    setConfirm(null);
  }

  if (status === "loading" || loading) {
    return <main className="la-page"><div className={styles.loading}>Loading dashboard...</div></main>;
  }

  return (
    <main className="la-page">
      <div className="la-bg" aria-hidden="true"><div className="la-bg-grid" /></div>
      <section className={styles.shell}>
        <header className={styles.header}>
          <Link className="la-logo" href="/">Locks<span>All</span></Link>
          <nav>
            <Link href="/account">Account</Link>
            {user?.isAdmin && <Link href="/admin">Admin</Link>}
            <Link href="/">Home</Link>
            <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
          </nav>
        </header>

        <section className={styles.hero}>
          <div>
            <p className="la-kicker">Secure dashboard</p>
            <h1>Good to see you{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
            <p>{posture.body}</p>
          </div>
          <aside className={`${styles.posture} ${styles[posture.tone]}`}>
            <span>Risk posture</span>
            <strong>{posture.label}</strong>
          </aside>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.metrics} aria-label="Dashboard summary">
          <article><strong>{state.cards.length}</strong><span>Total cards</span></article>
          <article><strong>{activeCount}</strong><span>Active cards</span></article>
          <article><strong>{blockedCount}</strong><span>Blocked cards</span></article>
          <article><strong>{state.audit.length}</strong><span>Recent events</span></article>
          <article><strong>{profilePercent}%</strong><span>Profile complete</span></article>
        </section>

        <section className={styles.actionBand}>
          <div>
            <h2>Emergency controls</h2>
            <p>Use these only when the account or wallet is at risk. Every action is saved in the audit timeline.</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.danger} disabled={action !== null || state.cards.length === 0} onClick={() => confirmBulkAction("block")}>
              {action === "block" ? "Blocking..." : "Block all cards"}
            </button>
            <button className={styles.success} disabled={action !== null || state.cards.length === 0} onClick={() => confirmBulkAction("unblock")}>
              {action === "unblock" ? "Restoring..." : "Restore all cards"}
            </button>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Cards</h2>
              <Link href="/account">Manage cards</Link>
            </div>
            <div className={styles.list}>
              {state.cards.map((card) => (
                <article key={card.id} className={styles.cardRow}>
                  <div className={styles.cardBadge} />
                  <div>
                    <strong>{card.label}</strong>
                    <p>**** {card.last4} · {card.provider}{card.type ? ` · ${card.type}` : ""}</p>
                  </div>
                  <span className={card.status === "BLOCKED" ? "pill pill-red" : "pill pill-green"}>{card.status}</span>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Recent activity</h2>
              <span>{state.audit.length} shown</span>
            </div>
            <div className={styles.list}>
              {state.audit.length === 0 ? (
                <article className={styles.empty}>No audit events yet.</article>
              ) : state.audit.slice(0, 8).map((event) => (
                <article key={event.id} className={styles.auditRow}>
                  <strong>{event.type}</strong>
                  <time>{new Date(event.ts).toLocaleString()}</time>
                  <p>{event.message}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      {confirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className={styles.confirmDialog}>
            <h2 id="confirm-title">{confirm.title}</h2>
            <p>{confirm.body}</p>
            <div className={styles.confirmActions}>
              <button className={styles.secondary} onClick={() => setConfirm(null)}>Cancel</button>
              <button className={confirm.tone === "safe" ? styles.safeAction : styles.dangerAction} onClick={runConfirmedAction}>{confirm.actionLabel}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
