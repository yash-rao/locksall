import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { addAudit } from "@/lib/prototype/store";
import { requireUser } from "@/lib/session";

export async function PATCH(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ ok: false, message: "Enter your current and new password." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, message: "New password must be at least 8 characters." }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ ok: false, message: "New password must be different from your current password." }, { status: 400 });
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!account || !verifyPassword(currentPassword, account.passwordHash)) {
    return NextResponse.json({ ok: false, message: "Current password is incorrect." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  await addAudit(user.id, {
    type: "PASSWORD_CHANGED",
    source: "WEB",
    message: "Account password was changed.",
  });

  return NextResponse.json({ ok: true, message: "Password updated." });
}
