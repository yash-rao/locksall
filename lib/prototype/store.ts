export type CardStatus = "ACTIVE" | "BLOCKED";

export type Card = {
  id: string;
  label: string;
  last4: string;
  provider: "AMEX_MOCK" | "BOFA_MOCK" | "CAPONE_MOCK";
  status: CardStatus;
};

export type AuditEvent = {
  id: string;
  ts: string;
  type: string;
  source: "WEB";
  message: string;
  meta?: Record<string, any>;
};

const state = {
  cards: [
    { id: "c1", label: "Amex Gold", last4: "4455", provider: "AMEX_MOCK", status: "ACTIVE" },
    { id: "c2", label: "Bank of America Debit", last4: "7788", provider: "BOFA_MOCK", status: "ACTIVE" },
    { id: "c3", label: "Capital One Quicksilver", last4: "9911", provider: "CAPONE_MOCK", status: "ACTIVE" },
  ] as Card[],
  audit: [] as AuditEvent[],
};

function uid(prefix = "e") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function getState() {
  return state;
}

export function addAudit(event: Omit<AuditEvent, "id" | "ts">) {
  const e: AuditEvent = { id: uid("evt"), ts: new Date().toISOString(), ...event };
  state.audit.unshift(e);
  state.audit = state.audit.slice(0, 50);
  return e;
}

export function setCardStatus(cardId: string, status: CardStatus) {
  const c = state.cards.find((x) => x.id === cardId);
  if (c) c.status = status;
  return c;
}
