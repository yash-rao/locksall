import type { CardStatus as PrismaCardStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type CardStatus = PrismaCardStatus;

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
  meta?: Prisma.JsonValue;
};

const defaultCards = [
  { label: "Amex Gold", last4: "4455", provider: "AMEX_MOCK" },
  { label: "Bank of America Debit", last4: "7788", provider: "BOFA_MOCK" },
  { label: "Capital One Quicksilver", last4: "9911", provider: "CAPONE_MOCK" },
] as const;

function toCard(card: {
  id: string;
  label: string;
  last4: string;
  provider: string;
  status: CardStatus;
}): Card {
  return {
    id: card.id,
    label: card.label,
    last4: card.last4,
    provider: card.provider as Card["provider"],
    status: card.status,
  };
}

async function ensureDefaultCards(userId: string) {
  const count = await prisma.card.count({ where: { userId } });
  if (count > 0) return;

  await prisma.card.createMany({
    data: defaultCards.map((card) => ({
      userId,
      label: card.label,
      last4: card.last4,
      provider: card.provider,
    })),
    skipDuplicates: true,
  });
}

export async function getState(userId: string) {
  await ensureDefaultCards(userId);

  const [cards, audit] = await Promise.all([
    prisma.card.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.auditEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return {
    cards: cards.map(toCard),
    audit: audit.map((event) => ({
      id: event.id,
      ts: event.createdAt.toISOString(),
      type: event.type,
      source: "WEB" as const,
      message: event.message,
      meta: event.meta ?? undefined,
    })),
  };
}

export async function addAudit(
  userId: string,
  event: Omit<AuditEvent, "id" | "ts">
) {
  const auditEvent = await prisma.auditEvent.create({
    data: {
      userId,
      type: event.type,
      source: event.source,
      message: event.message,
      meta: event.meta === undefined ? undefined : (event.meta as Prisma.InputJsonValue),
    },
  });

  return {
    id: auditEvent.id,
    ts: auditEvent.createdAt.toISOString(),
    type: auditEvent.type,
    source: "WEB" as const,
    message: auditEvent.message,
    meta: auditEvent.meta ?? undefined,
  };
}

export async function setCardStatus(userId: string, cardId: string, status: CardStatus) {
  await prisma.card.updateMany({
    where: { id: cardId, userId },
    data: { status },
  });

  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  return card ? toCard(card) : null;
}
