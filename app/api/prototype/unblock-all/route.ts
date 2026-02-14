import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { addAudit, getState, setCardStatus } from "../../../../lib/prototype/store";
import { unblockCard } from "../../../../lib/prototype/banks";

export async function POST() {
  const session = await getServerSession();
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
    const results = await Promise.all(cards.map((c) => unblockCard(c)));

    let anyFail = false;

    for (const r of results) {
      if (r.ok) {
        setCardStatus(r.cardId, "ACTIVE");
        addAudit({
          type: "CARD_UNBLOCKED",
          source: "WEB",
          message: `Unblocked ${r.cardId} (${r.provider})`,
          meta: r,
        });
      } else {
        anyFail = true;
        addAudit({
          type: "REQUEST_FAILED",
          source: "WEB",
          message: `Failed unblocking ${r.cardId} (${r.provider})`,
          meta: r,
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
  } catch (err) {
    console.error("UNBLOCK ALL error:", err);
    addAudit({
      type: "REQUEST_FAILED",
      source: "WEB",
      message: "Unexpected server error during UNBLOCK ALL",
    });
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
