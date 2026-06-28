import { NextResponse } from "next/server";
import { hasDatabaseUrl, isBuildPlaceholderDatabase, prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getDatabaseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (!hasDatabaseUrl() || isBuildPlaceholderDatabase()) {
    return "Database is not configured. Add DATABASE_URL in Vercel and redeploy.";
  }

  if (message.includes("does not exist") || message.includes("table") || message.includes("relation")) {
    return "Database tables are not ready. Run npm run db:push for the connected database.";
  }

  return "Unable to create account right now.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ ok: false, message: "An account already exists for this email." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashPassword(password),
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    console.error("SIGNUP route error:", error);
    return NextResponse.json(
      { ok: false, message: getDatabaseErrorMessage(error) },
      { status: 500 }
    );
  }
}
