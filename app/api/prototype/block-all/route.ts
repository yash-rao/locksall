import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { blockCard } from "@/lib/prototype/banks";
import { addAudit, getState, setCardStatus } from "@/lib/prototype/store";

function getSessionUserId(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);

  if (!userId) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const started = Date.now();
    await addAudit(userId, { type: "BLOCK_ALL_REQUESTED", source: "WEB", message: "User requested BLOCK ALL." });

    const { cards } = await getState(userId);
    const results = await Promise.all(cards.map((card) => blockCard(card)));

    let anyFail = false;

    for (const result of results) {
      if (result.ok) {
        await setCardStatus(userId, result.cardId, "BLOCKED");
        await addAudit(userId, {
          type: "CARD_BLOCKED",
          source: "WEB",
          message: `Blocked ${result.cardId} (${result.provider})`,
          meta: result,
        });
      } else {
        anyFail = true;
        await addAudit(userId, {
          type: "REQUEST_FAILED",
          source: "WEB",
          message: `Failed blocking ${result.cardId} (${result.provider})`,
          meta: result,
        });
      }
    }

    await addAudit(userId, {
      type: "REQUEST_COMPLETED",
      source: "WEB",
      message: `BLOCK ALL completed in ${Date.now() - started}ms`,
      meta: { results },
    });

    return NextResponse.json({ ok: !anyFail, results });
  } catch (error) {
    console.error("BLOCK ALL error:", error);
    await addAudit(userId, {
      type: "REQUEST_FAILED",
      source: "WEB",
      message: "Unexpected server error during BLOCK ALL",
    });
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
