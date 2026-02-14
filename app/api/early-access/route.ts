import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "early-access.json");

function readEmails(): string[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeEmails(emails: string[]) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(emails, null, 2), "utf8");
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

    const normalized = email.trim().toLowerCase();

    // basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return NextResponse.json(
        { ok: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    const emails = readEmails();

    // avoid duplicates
    if (!emails.includes(normalized)) {
      emails.push(normalized);
      writeEmails(emails);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/early-access:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
