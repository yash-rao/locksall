import { NextResponse } from "next/server";
import { hasDatabaseUrl, isBuildPlaceholderDatabase, prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { hashResetToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json({ ok: false, message: "Reset token is missing." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, message: "Password must be at least 8 characters." }, { status: 400 });
    }

    if (!hasDatabaseUrl() || isBuildPlaceholderDatabase()) {
      return NextResponse.json(
        { ok: false, message: "Database is not configured. Add DATABASE_URL in Vercel and redeploy." },
        { status: 503 }
      );
    }

    const tokenHash = hashResetToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: "This reset link is invalid or expired." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: hashPassword(password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetRecord.userId,
          usedAt: null,
          id: { not: resetRecord.id },
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("RESET PASSWORD route error:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}
