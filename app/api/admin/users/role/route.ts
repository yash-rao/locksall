import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { isGlobalAdminEmail } from "@/lib/access";
import { prisma } from "@/lib/db";
import { addAudit } from "@/lib/prototype/store";
import { requireGlobalAdmin } from "@/lib/session";

const allowedRoles = new Set<UserRole>(["USER", "ADMIN", "GLOBAL_ADMIN"]);

export async function PATCH(request: Request) {
  const actor = await requireGlobalAdmin();

  if (!actor) {
    return NextResponse.json({ ok: false, message: "Global admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() as UserRole : "USER";

  if (!userId || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: "Choose a valid user and role." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
  }

  if (isGlobalAdminEmail(target.email) && role !== "GLOBAL_ADMIN") {
    return NextResponse.json(
      { ok: false, message: "The configured global admin email cannot be demoted." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
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
  });

  await addAudit(actor.id, {
    type: "USER_ROLE_UPDATED",
    source: "WEB",
    message: `${actor.email} set ${target.email} to ${role}.`,
    meta: { targetUserId: target.id, targetEmail: target.email, role },
  });

  return NextResponse.json({ ok: true, user: updated });
}
