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
  role: "USER" | "ADMIN" | "GLOBAL_ADMIN";
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

type CardDraft = {
  label: string;
  provider: string;
  type: string;
  last4: string;
};

type ConfirmDialog = {
  title: string;
  body: string;
  actionLabel: string;
  tone?: "danger" | "safe";
  onConfirm: () => Promise<void> | void;
};

const emptyCard: CardDraft = { label: "", provider: "", type: "", last4: "" };
const emptyPassword = { currentPassword: "", newPassword: "", confirmPassword: "" };

function cardToDraft(card: Card): CardDraft {
  return {
    label: card.label,
    provider: card.provider,
    type: card.type || "",
    last4: card.last4,
  };
}

export default function AccountPage() {
  const router = useRouter();
  const { status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [newCard, setNewCard] = useState<CardDraft>(emptyCard);
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CardDraft>(emptyCard);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
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

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.message || "Unable to update password.");
      return;
    }

    setPasswordForm(emptyPassword);
    setMessage("Password updated.");
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

  async function updateCard(card: Card, changes: Partial<CardDraft & Pick<Card, "status">>) {
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
      return false;
    }

    setCards((current) => current.map((item) => item.id === data.card.id ? data.card : item));
    setMessage("Card updated.");
    return true;
  }

  function startEditing(card: Card) {
    setEditingCardId(card.id);
    setEditingCard(cardToDraft(card));
    setMessage("");
    setError("");
  }

  async function saveCardEdit(card: Card) {
    const saved = await updateCard(card, editingCard);
    if (saved) {
      setEditingCardId(null);
      setEditingCard(emptyCard);
    }
  }

  function confirmCardStatus(card: Card) {
    const nextStatus = card.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    setConfirm({
      title: nextStatus === "BLOCKED" ? "Block this card?" : "Restore this card?",
      body: `${card.label} ending ${card.last4} will be marked ${nextStatus.toLowerCase()}. This will be written to the audit history.`,
      actionLabel: nextStatus === "BLOCKED" ? "Block card" : "Restore card",
      tone: nextStatus === "BLOCKED" ? "danger" : "safe",
      onConfirm: async () => { await updateCard(card, { status: nextStatus }); },
    });
  }

  function confirmRemoveCard(card: Card) {
    setConfirm({
      title: "Remove this card?",
      body: `${card.label} ending ${card.last4} will be removed from your LocksAll profile. This cannot be undone.`,
      actionLabel: "Remove card",
      tone: "danger",
      onConfirm: async () => { await removeCard(card.id); },
    });
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

  async function runConfirmedAction() {
    if (!confirm) return;
    await confirm.onConfirm();
    setConfirm(null);
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
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/">Home</Link>
            {user?.isAdmin && <Link href="/admin">Admin</Link>}
            <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>
          </nav>
        </header>

        <div className={styles.hero}>
          <p className="la-kicker">Account dashboard</p>
          <h1>Manage your secure card profile.</h1>
          <p>Update your personal information, password, and the masked cards that LocksAll can protect during an emergency.</p>
        </div>

        {(message || error) && <div className={error ? styles.error : styles.message}>{error || message}</div>}

        <div className={styles.grid}>
          <form className={styles.panel} onSubmit={saveProfile}>
            <div className={styles.panelHead}><h2>Personal information</h2><span>{user?.email}</span></div>
            <label>Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
            <label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            <label>Address<textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></label>
            <button className={styles.primary}>Save profile</button>
          </form>

          <form className={styles.panel} onSubmit={savePassword}>
            <div className={styles.panelHead}><h2>Account security</h2><span>Change password</span></div>
            <label>Current password<input required type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} autoComplete="current-password" /></label>
            <label>New password<input required minLength={8} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} autoComplete="new-password" /></label>
            <label>Confirm new password<input required minLength={8} type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} autoComplete="new-password" /></label>
            <button className={styles.primary}>Update password</button>
          </form>

          <form className={styles.panel} onSubmit={addCard}>
            <div className={styles.panelHead}><h2>Add masked card</h2><span>No full card numbers</span></div>
            <label>Card name<input required placeholder="Chase Freedom" value={newCard.label} onChange={(e) => setNewCard({ ...newCard, label: e.target.value })} /></label>
            <label>Provider<input required placeholder="Chase" value={newCard.provider} onChange={(e) => setNewCard({ ...newCard, provider: e.target.value })} /></label>
            <label>Type<input placeholder="Visa, Mastercard, Amex" value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })} /></label>
            <label>Last 4<input required inputMode="numeric" maxLength={4} placeholder="1234" value={newCard.last4} onChange={(e) => setNewCard({ ...newCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></label>
            <button className={styles.primary}>Add card</button>
          </form>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Your cards</h2><span>{cards.length} saved</span></div>
          <div className={styles.cards}>
            {cards.map((card) => {
              const editing = editingCardId === card.id;
              return (
                <article key={card.id} className={`${styles.cardRow} ${editing ? styles.cardRowEditing : ""}`}>
                  <div className={styles.cardBadge} />
                  {editing ? (
                    <div className={styles.editGrid}>
                      <label>Card name<input value={editingCard.label} onChange={(e) => setEditingCard({ ...editingCard, label: e.target.value })} /></label>
                      <label>Provider<input value={editingCard.provider} onChange={(e) => setEditingCard({ ...editingCard, provider: e.target.value })} /></label>
                      <label>Type<input value={editingCard.type} onChange={(e) => setEditingCard({ ...editingCard, type: e.target.value })} /></label>
                      <label>Last 4<input inputMode="numeric" maxLength={4} value={editingCard.last4} onChange={(e) => setEditingCard({ ...editingCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></label>
                    </div>
                  ) : (
                    <div>
                      <strong>{card.label}</strong>
                      <p>**** {card.last4} · {card.provider}{card.type ? ` · ${card.type}` : ""}</p>
                    </div>
                  )}
                  <span className={card.status === "BLOCKED" ? "pill pill-red" : "pill pill-green"}>{card.status}</span>
                  <div className={styles.cardActions}>
                    {editing ? (
                      <>
                        <button onClick={() => saveCardEdit(card)}>Save</button>
                        <button onClick={() => setEditingCardId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(card)}>Edit</button>
                        <button onClick={() => confirmCardStatus(card)}>{card.status === "BLOCKED" ? "Restore" : "Block"}</button>
                        <button onClick={() => confirmRemoveCard(card)}>Remove</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
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
