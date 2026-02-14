import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";

const filePath = path.join(process.cwd(), "data", "early-access.json");

export async function GET() {
  const session = await getServerSession();

  // 🔐 Only authenticated users can view emails
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: true, emails: [] });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const emails = JSON.parse(raw || "[]");

    return NextResponse.json({ ok: true, emails });
  } catch (err) {
    console.error("Error reading emails:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
