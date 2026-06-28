"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import styles from "../account/account.module.css";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  cards: Array<{ id: string; label: string; provider: string; type: string | null; last4: string; status: string }>;
  _count: { cards: number; auditEvents: number };
};

type Lead = { id: string; email: string; createdAt: string };
type Audit = { id: string; type: string; message: string; createdAt: string; user: { email: string; name: string | null } };

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [auditEvents, setAuditEvents] = useState<Audit[]>([]);
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

  useEffect(() => {
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

      setUsers(data.users || []);
      setLeads(data.leads || []);
      setAuditEvents(data.auditEvents || []);
      setLoading(false);
    }

    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin");
    if (status === "authenticated") loadAdmin();
  }, [status, router]);

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
            <Link href="/account">Account</Link>
            <Link href="/">Home</Link>
          </nav>
        </header>

        <div className={styles.hero}>
          <p className="la-kicker">Admin console</p>
          <h1>Website-wide visibility for LocksAll.</h1>
          <p>View users, masked card records, early-access leads, and recent audit activity from inside the website.</p>
        </div>

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
                <div className={styles.panelHead}><h2>Users</h2><span>{users.length} shown</span></div>
                <div className={styles.cards}>
                  {users.map((user) => (
                    <article key={user.id} className={styles.cardRow}>
                      <div className={styles.cardBadge} />
                      <div>
                        <strong>{user.name || "Unnamed user"}</strong>
                        <p>{user.email} · {user.role} · {user._count.cards} cards · {user._count.auditEvents} events</p>
                        {(user.phone || user.address) && <p>{user.phone || "No phone"} · {user.address || "No address"}</p>}
                      </div>
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
    </main>
  );
}
