import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type EarlyAccessEntry = {
  email: string;
  createdAt: string;
  userAgent: string | null;
  ipAddress: string | null;
};

const storagePath =
  process.env.EARLY_ACCESS_STORAGE_PATH ??
  path.join(process.cwd(), "data", "early-access.json");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readEntries(): Promise<EarlyAccessEntry[]> {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeEntries(entries: EarlyAccessEntry[]) {
  await fs.mkdir(path.dirname(storagePath), { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(entries, null, 2));
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { ok: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const entries = await readEntries();
    const existing = entries.find((entry) => entry.email === normalizedEmail);

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "That email is already on the list." },
        { status: 409 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for");
    const userAgent = request.headers.get("user-agent");

    entries.push({
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      ipAddress,
      userAgent,
    });

    await writeEntries(entries);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/early-access:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
