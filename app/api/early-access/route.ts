import { NextResponse } from "next/server";
import { hasDatabaseUrl, isBuildPlaceholderDatabase, prisma } from "@/lib/db";
import { sendEarlyAccessAcknowledgement } from "@/lib/mailer";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();

    if (!emailRegex.test(normalized)) {
      return NextResponse.json(
        { ok: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!hasDatabaseUrl() || isBuildPlaceholderDatabase()) {
      return NextResponse.json(
        { ok: false, message: "Database is not configured. Add DATABASE_URL in Vercel and redeploy." },
        { status: 503 }
      );
    }

    await prisma.earlyAccessLead.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });

    const emailResult = await sendEarlyAccessAcknowledgement({ to: normalized });

    return NextResponse.json({
      ok: true,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? "Thanks. You are on the early-access list. We sent a confirmation email."
        : "Thanks. You are on the early-access list. Confirmation email is not configured yet.",
    });
  } catch (error) {
    console.error("Error in /api/early-access:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to save early-access request right now." },
      { status: 500 }
    );
  }
}
