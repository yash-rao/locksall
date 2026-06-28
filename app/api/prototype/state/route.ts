import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getState } from "@/lib/prototype/store";

function getSessionUserId(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const state = await getState(userId);

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
