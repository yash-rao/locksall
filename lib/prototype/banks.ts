import type { Card } from "./store";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function blockCard(card: Card) {
  const latencyMs = Math.floor(250 + Math.random() * 900);
  await sleep(latencyMs);

  const fail = Math.random() < 0.1; // 10% failure simulation
  return {
    ok: !fail,
    provider: card.provider,
    cardId: card.id,
    latencyMs,
    message: !fail ? "Blocked successfully" : "Provider timeout (simulated)",
  };
}

export async function unblockCard(card: Card) {
  const latencyMs = Math.floor(250 + Math.random() * 900);
  await sleep(latencyMs);

  const fail = Math.random() < 0.1;
  return {
    ok: !fail,
    provider: card.provider,
    cardId: card.id,
    latencyMs,
    message: !fail ? "Unblocked successfully" : "Provider timeout (simulated)",
  };
}
