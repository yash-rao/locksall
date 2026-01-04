import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    // TODO: Save to a real database, Google Sheet, or send email, etc.
    // For now we just log it on the server:
    console.log("New early-access signup:", email);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/early-access:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
