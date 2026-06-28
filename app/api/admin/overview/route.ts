import { NextResponse } from "next/server";
import { isGlobalAdminEmail } from "@/lib/access";
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

  const normalizedUsers = users.map((user) => ({
    ...user,
    role: user.role === "GLOBAL_ADMIN" || isGlobalAdminEmail(user.email) ? "GLOBAL_ADMIN" : user.role,
    lockedGlobalAdmin: isGlobalAdminEmail(user.email),
  }));

  return NextResponse.json({
    ok: true,
    currentAdmin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isGlobalAdmin: admin.isGlobalAdmin,
    },
    users: normalizedUsers,
    leads,
    auditEvents,
  });
}
