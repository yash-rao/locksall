import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addAudit } from "@/lib/prototype/store";
import { requireUser } from "@/lib/session";

function cleanCardInput(body: Record<string, unknown>) {
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const provider = typeof body.provider === "string" ? body.provider.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const last4 = typeof body.last4 === "string" ? body.last4.trim() : "";

  return { label, provider, type, last4 };
}

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const cards = await prisma.card.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, cards });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { label, provider, type, last4 } = cleanCardInput(body);

  if (!label || !provider || !/^\d{4}$/.test(last4)) {
    return NextResponse.json(
      { ok: false, message: "Add a card name, provider, and exactly 4 digits for last 4." },
      { status: 400 }
    );
  }

  const card = await prisma.card.create({
    data: {
      userId: user.id,
      label,
      provider,
      type: type || null,
      last4,
    },
  });

  await addAudit(user.id, {
    type: "CARD_ADDED",
    source: "WEB",
    message: `${label} ending ${last4} was added.`,
    meta: { cardId: card.id },
  });

  return NextResponse.json({ ok: true, card }, { status: 201 });
}
