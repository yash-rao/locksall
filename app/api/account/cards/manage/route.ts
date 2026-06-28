import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addAudit } from "@/lib/prototype/store";
import { requireUser } from "@/lib/session";

function cleanId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = cleanId(body.id);
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const provider = typeof body.provider === "string" ? body.provider.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const last4 = typeof body.last4 === "string" ? body.last4.trim() : "";
  const status = body.status === "ACTIVE" || body.status === "BLOCKED" ? body.status : undefined;

  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing card id." }, { status: 400 });
  }

  const existing = await prisma.card.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Card not found." }, { status: 404 });
  }

  if ((label !== "" || provider !== "" || last4 !== "") && (!label || !provider || !/^\d{4}$/.test(last4))) {
    return NextResponse.json(
      { ok: false, message: "Card updates need a name, provider, and exactly 4 digits for last 4." },
      { status: 400 }
    );
  }

  const card = await prisma.card.update({
    where: { id },
    data: {
      ...(label ? { label } : {}),
      ...(provider ? { provider } : {}),
      ...(last4 ? { last4 } : {}),
      ...(type !== "" ? { type: type || null } : {}),
      ...(status ? { status } : {}),
    },
  });

  await addAudit(user.id, {
    type: status ? `CARD_${status}` : "CARD_UPDATED",
    source: "WEB",
    message: status
      ? `${card.label} ending ${card.last4} was set to ${status.toLowerCase()}.`
      : `${card.label} ending ${card.last4} was updated.`,
    meta: { cardId: card.id },
  });

  return NextResponse.json({ ok: true, card });
}

export async function DELETE(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = cleanId(body.id);

  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing card id." }, { status: 400 });
  }

  const existing = await prisma.card.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Card not found." }, { status: 404 });
  }

  await prisma.card.delete({ where: { id } });
  await addAudit(user.id, {
    type: "CARD_REMOVED",
    source: "WEB",
    message: `${existing.label} ending ${existing.last4} was removed.`,
    meta: { cardId: existing.id },
  });

  return NextResponse.json({ ok: true });
}
