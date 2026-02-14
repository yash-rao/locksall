import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getState } from "../../../../lib/prototype/store";

export async function GET() {
  // 🔐 Authentication check
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const state = getState();

    return NextResponse.json({
      ok: true,
      state,
    });
  } catch (error) {
    console.error("STATE route error:", error);

    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
