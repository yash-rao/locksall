import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    await prisma.earlyAccessLead.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/early-access:", error);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
