"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import styles from "./account.module.css";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: "USER" | "ADMIN";
  isAdmin?: boolean;
};

type Card = {
  id: string;
  label: string;
  provider: string;
  type: string | null;
  last4: string;
  status: "ACTIVE" | "BLOCKED";
};

const emptyCard = { label: "", provider: "", type: "", last4: "" };

export default function AccountPage() {
  const router = useRouter();
  const { status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [newCard, setNewCard] = useState(emptyCard);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAccount() {
    setLoading(true);
    setError("");

    const [accountRes, cardsRes] = await Promise.all([
      fetch("/api/account"),
      fetch("/api/account/cards"),
    ]);

    if (accountRes.status === 401 || cardsRes.status === 401) {
      router.push("/login?callbackUrl=/account");
      return;
    }

    const accountData = await accountRes.json();
    const cardsData = await cardsRes.json();

    if (!accountRes.ok || !cardsRes.ok) {
      setError(accountData?.message || cardsData?.message || "Unable to load account.");
      setLoading(false);
      return;
    }

    setUser(accountData.user);
    setProfile({
      name: accountData.user.name || "",
      phone: accountData.user.phone || "",
      address: accountData.user.address || "",
    });
    setCards(cardsData.cards || []);
    setLoading(false);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/account");
    if (status === "authenticated") loadAccount();
  }, [status]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.message || "Unable to update profile.");
      return;
    }

    setUser(data.user);
    setMessage("Profile updated.");
  }

  async function addCard(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/account/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCard),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.message || "Unable to add card.");
      return;
    }

    setCards((current) => [...current, data.card]);
    setNewCard(emptyCard);
    setMessage("Card added safely with masked details only.");
  }

  async function updateCard(card: Card, changes: Partial<Card>) {
    setMessage("");
    setError("");

    const res = await fetch("/api/account/cards/manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...card, ...changes }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.message || "Unable to update card.");
      return;
    }

    setCards((current) => current.map((item) => item.id === data.card.id ? data.card : item));
    setMessage("Card updated.");
  }

  async function removeCard(id: string) {
    setMessage("");
    setError("");

    const res = await fetch("/api/account/cards/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.message || "Unable to remove card.");
      return;
    }

    setCards((current) => current.filter((card) => card.id !== id));
    setMessage("Card removed.");
  }

  if (status === "loading" || loading) {
    return <main className="la-page"><div className={styles.loading}>Loading secure account...</div></main>;
  }

  return (
    <main className="la-page">
      <div className="la-bg" aria-hidden="true"><div className="la-bg-grid" /></div>
      <section className={styles.shell}>
        <header className={styles.header}>
          <Link className="la-logo" href="/">Locks<span>All</span></Link>
          <nav>
            <Link href="/">Home</Link>
            {user?.isAdmin && <Link href="/admin">Admin</Link>}
            <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
          </nav>
        </header>

        <div className={styles.hero}>
          <p className="la-kicker">Account dashboard</p>
          <h1>Manage your secure card profile.</h1>
          <p>Update your personal information and maintain the masked cards that LocksAll can protect during an emergency.</p>
        </div>

        {(message || error) && (
          <div className={error ? styles.error : styles.message}>{error || message}</div>
        )}

        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={saveProfile}>
            <div className={styles.panelHead}>
              <h2>Personal information</h2>
              <span>{user?.email}</span>
            </div>
            <label>Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
            <label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            <label>Address<textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></label>
            <button className={styles.primary}>Save profile</button>
          </form>

          <form className={styles.panel} onSubmit={addCard}>
            <div className={styles.panelHead}>
              <h2>Add masked card</h2>
              <span>No full card numbers</span>
            </div>
            <label>Card name<input required placeholder="Chase Freedom" value={newCard.label} onChange={(e) => setNewCard({ ...newCard, label: e.target.value })} /></label>
            <label>Provider<input required placeholder="Chase" value={newCard.provider} onChange={(e) => setNewCard({ ...newCard, provider: e.target.value })} /></label>
            <label>Type<input placeholder="Visa, Mastercard, Amex" value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })} /></label>
            <label>Last 4<input required inputMode="numeric" maxLength={4} placeholder="1234" value={newCard.last4} onChange={(e) => setNewCard({ ...newCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></label>
            <button className={styles.primary}>Add card</button>
          </form>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Your cards</h2>
            <span>{cards.length} saved</span>
          </div>
          <div className={styles.cards}>
            {cards.map((card) => (
              <article key={card.id} className={styles.cardRow}>
                <div className={styles.cardBadge} />
                <div>
                  <strong>{card.label}</strong>
                  <p>**** {card.last4} · {card.provider}{card.type ? ` · ${card.type}` : ""}</p>
                </div>
                <span className={card.status === "BLOCKED" ? "pill pill-red" : "pill pill-green"}>{card.status}</span>
                <div className={styles.cardActions}>
                  <button onClick={() => updateCard(card, { status: card.status === "BLOCKED" ? "ACTIVE" : "BLOCKED" })}>
                    {card.status === "BLOCKED" ? "Restore" : "Block"}
                  </button>
                  <button onClick={() => removeCard(card.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
