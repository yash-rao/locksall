import { NextResponse } from "next/server";
import { hasDatabaseUrl, isBuildPlaceholderDatabase, prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { createResetToken, getResetTokenExpiry, hashResetToken } from "@/lib/tokens";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAppUrl(request: Request) {
  const configuredUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
    }

    if (!hasDatabaseUrl() || isBuildPlaceholderDatabase()) {
      return NextResponse.json(
        { ok: false, message: "Database is not configured. Add DATABASE_URL in Vercel and redeploy." },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists for that email, a reset link has been sent.",
      });
    }

    const token = createResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = getResetTokenExpiry();

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${getAppUrl(request)}/reset-password?token=${encodeURIComponent(token)}`;
    const emailResult = await sendPasswordResetEmail({ to: user.email, resetUrl });

    return NextResponse.json({
      ok: true,
      message: emailResult.sent
        ? "If an account exists for that email, a reset link has been sent."
        : "Reset link generated. Configure SMTP env vars in Vercel to send email automatically.",
      resetUrl: emailResult.sent ? undefined : resetUrl,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD route error:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to start password reset right now." },
      { status: 500 }
    );
  }
}
