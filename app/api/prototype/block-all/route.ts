import { NextResponse } from "next/server";
import { addAudit, getState, setCardStatus } from "@/lib/prototype/store";
import { blockCard } from "@/lib/prototype/banks";

export async function POST() {
  const started = Date.now();
  addAudit({ type: "BLOCK_ALL_REQUESTED", source: "WEB", message: "User requested BLOCK ALL." });

  const { cards } = getState();
  const results = await Promise.all(cards.map((c) => blockCard(c)));

  let anyFail = false;

  for (const r of results) {
    if (r.ok) {
      setCardStatus(r.cardId, "BLOCKED");
      addAudit({ type: "CARD_BLOCKED", source: "WEB", message: `Blocked ${r.cardId} (${r.provider})`, meta: r });
    } else {
      anyFail = true;
      addAudit({ type: "REQUEST_FAILED", source: "WEB", message: `Failed blocking ${r.cardId} (${r.provider})`, meta: r });
    }
  }

  addAudit({
    type: "REQUEST_COMPLETED",
    source: "WEB",
    message: `BLOCK ALL completed in ${Date.now() - started}ms`,
    meta: { results },
  });

  return NextResponse.json({ ok: !anyFail, results });
}
