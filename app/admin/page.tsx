"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import styles from "../account/account.module.css";

type Role = "USER" | "ADMIN" | "GLOBAL_ADMIN";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: Role;
  lockedGlobalAdmin?: boolean;
  createdAt: string;
  cards: Array<{ id: string; label: string; provider: string; type: string | null; last4: string; status: string }>;
  _count: { cards: number; auditEvents: number };
};

type Lead = { id: string; email: string; createdAt: string };
type Audit = { id: string; type: string; message: string; createdAt: string; user: { email: string; name: string | null } };
type CurrentAdmin = { id: string; email: string; role: Role; isGlobalAdmin: boolean };
type ConfirmDialog = {
  title: string;
  body: string;
  actionLabel: string;
  tone?: "danger" | "safe";
  onConfirm: () => Promise<void> | void;
};

function roleLabel(role: Role) {
  return role.replace("_", " ").toLowerCase();
}

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [auditEvents, setAuditEvents] = useState<Audit[]>([]);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const metrics = useMemo(() => {
    const totalCards = users.reduce((sum, user) => sum + user.cards.length, 0);
    const blockedCards = users.reduce((sum, user) => sum + user.cards.filter((card) => card.status === "BLOCKED").length, 0);

    return [
      { label: "Users", value: users.length },
      { label: "Masked cards", value: totalCards },
      { label: "Blocked cards", value: blockedCards },
      { label: "Early leads", value: leads.length },
      { label: "Audit events", value: auditEvents.length },
    ];
  }, [users, leads.length, auditEvents.length]);

  async function loadAdmin() {
    const res = await fetch("/api/admin/overview");

    if (res.status === 401) {
      router.push("/login?callbackUrl=/admin");
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.message || "Admin access required.");
      setLoading(false);
      return;
    }

    setCurrentAdmin(data.currentAdmin || null);
    setUsers(data.users || []);
    setLeads(data.leads || []);
    setAuditEvents(data.auditEvents || []);
    setLoading(false);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin");
    if (status === "authenticated") loadAdmin();
  }, [status, router]);

  function confirmRoleChange(user: AdminUser, role: Role) {
    setConfirm({
      title: role === "USER" ? "Remove admin access?" : `Make ${user.email} ${roleLabel(role)}?`,
      body: role === "GLOBAL_ADMIN"
        ? "Global admins can promote, demote, and remove admin access for other users. Only give this to a highly trusted account."
        : role === "ADMIN"
          ? "Admins can view website-wide user, card, lead, and audit information."
          : "This user will lose admin console permissions after the role is changed.",
      actionLabel: role === "USER" ? "Remove admin" : `Make ${roleLabel(role)}`,
      tone: role === "USER" ? "danger" : "safe",
      onConfirm: async () => { await changeRole(user, role); },
    });
  }

  async function changeRole(user: AdminUser, role: Role) {
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/users/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.message || "Unable to update role.");
      return;
    }

    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...data.user } : item));
    setMessage(`${user.email} is now ${roleLabel(role)}.`);
  }

  async function runConfirmedAction() {
    if (!confirm) return;
    await confirm.onConfirm();
    setConfirm(null);
  }

  if (status === "loading" || loading) {
    return <main className="la-page"><div className={styles.loading}>Loading admin console...</div></main>;
  }

  return (
    <main className="la-page">
      <div className="la-bg" aria-hidden="true"><div className="la-bg-grid" /></div>
      <section className={styles.shell}>
        <header className={styles.header}>
          <Link className="la-logo" href="/">Locks<span>All</span></Link>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/account">Account</Link>
            <Link href="/">Home</Link>
          </nav>
        </header>

        <div className={styles.hero}>
          <p className="la-kicker">Admin console</p>
          <h1>Website-wide visibility for LocksAll.</h1>
          <p>View users, masked card records, early-access leads, audit activity, and manage admin access.</p>
        </div>

        {message && <div className={styles.message}>{message}</div>}
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <>
            <section className={styles.metrics} aria-label="Admin summary">
              {metrics.map((item) => (
                <article key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </section>

            <div className={styles.grid}>
              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2>Users</h2>
                  <span>{currentAdmin?.isGlobalAdmin ? "Global admin controls enabled" : "View only"}</span>
                </div>
                <div className={styles.cards}>
                  {users.map((user) => (
                    <article key={user.id} className={styles.cardRow}>
                      <div className={styles.cardBadge} />
                      <div>
                        <strong>{user.name || "Unnamed user"}</strong>
                        <p>{user.email} · {user.role.replace("_", " ")} · {user._count.cards} cards · {user._count.auditEvents} events</p>
                        {(user.phone || user.address) && <p>{user.phone || "No phone"} · {user.address || "No address"}</p>}
                      </div>
                      {currentAdmin?.isGlobalAdmin && (
                        <div className={styles.cardActions}>
                          {user.role !== "ADMIN" && <button onClick={() => confirmRoleChange(user, "ADMIN")}>Make admin</button>}
                          {user.role !== "GLOBAL_ADMIN" && <button onClick={() => confirmRoleChange(user, "GLOBAL_ADMIN")}>Make global</button>}
                          {user.role !== "USER" && !user.lockedGlobalAdmin && <button onClick={() => confirmRoleChange(user, "USER")}>Remove admin</button>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHead}><h2>Early access leads</h2><span>{leads.length} shown</span></div>
                <div className={styles.cards}>
                  {leads.map((lead) => (
                    <article key={lead.id} className={styles.cardRow}>
                      <div>
                        <strong>{lead.email}</strong>
                        <p>{new Date(lead.createdAt).toLocaleString()}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Masked cards by user</h2><span>No full card numbers stored</span></div>
              <div className={styles.cards}>
                {users.flatMap((user) => user.cards.map((card) => (
                  <article key={card.id} className={styles.cardRow}>
                    <div className={styles.cardBadge} />
                    <div>
                      <strong>{card.label}</strong>
                      <p>{user.email} · **** {card.last4} · {card.provider}{card.type ? ` · ${card.type}` : ""}</p>
                    </div>
                    <span className={card.status === "BLOCKED" ? "pill pill-red" : "pill pill-green"}>{card.status}</span>
                  </article>
                )))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Recent audit events</h2><span>{auditEvents.length} shown</span></div>
              <div className={styles.cards}>
                {auditEvents.map((event) => (
                  <article key={event.id} className={styles.cardRow}>
                    <div>
                      <strong>{event.type}</strong>
                      <p>{event.user.email} · {new Date(event.createdAt).toLocaleString()}</p>
                      <p>{event.message}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
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
