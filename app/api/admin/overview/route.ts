import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ ok: false, message: "Admin access required" }, { status: 403 });
  }

  const [users, leads, auditEvents] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        cards: {
          orderBy: { createdAt: "asc" },
          select: { id: true, label: true, provider: true, type: true, last4: true, status: true, createdAt: true },
        },
        _count: { select: { cards: true, auditEvents: true } },
      },
    }),
    prisma.earlyAccessLead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ ok: true, users, leads, auditEvents });
}
