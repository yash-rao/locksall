import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unblockCard } from "@/lib/prototype/banks";
import { addAudit, getState, setCardStatus } from "@/lib/prototype/store";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const started = Date.now();

    addAudit({
      type: "UNBLOCK_ALL_REQUESTED",
      source: "WEB",
      message: "User requested UNBLOCK ALL.",
    });

    const { cards } = getState();
    const results = await Promise.all(cards.map((card) => unblockCard(card)));

    let anyFail = false;

    for (const result of results) {
      if (result.ok) {
        setCardStatus(result.cardId, "ACTIVE");
        addAudit({
          type: "CARD_UNBLOCKED",
          source: "WEB",
          message: `Unblocked ${result.cardId} (${result.provider})`,
          meta: result,
        });
      } else {
        anyFail = true;
        addAudit({
          type: "REQUEST_FAILED",
          source: "WEB",
          message: `Failed unblocking ${result.cardId} (${result.provider})`,
          meta: result,
        });
      }
    }

    addAudit({
      type: "REQUEST_COMPLETED",
      source: "WEB",
      message: `UNBLOCK ALL completed in ${Date.now() - started}ms`,
      meta: { results },
    });

    return NextResponse.json({ ok: !anyFail, results });
  } catch (error) {
    console.error("UNBLOCK ALL error:", error);
    addAudit({
      type: "REQUEST_FAILED",
      source: "WEB",
      message: "Unexpected server error during UNBLOCK ALL",
    });
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
