import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { serverConfig } from "@/app/config";

export const runtime = "nodejs";

type EarlyAccessEntry = {
  email: string;
  createdAt: string;
  userAgent: string | null;
  ipAddress: string | null;
};

const {
  storagePath,
  emailPattern,
  duplicateMessage,
  invalidMessage,
  invalidPayloadMessage,
} = serverConfig.earlyAccess;

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(task: () => Promise<void>) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function readEntries(): Promise<EarlyAccessEntry[]> {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeEntries(entries: EarlyAccessEntry[]) {
  const directory = path.dirname(storagePath);
  const tempPath = path.join(
    directory,
    `.early-access-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`
  );

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(entries, null, 2));
  await fs.rename(tempPath, storagePath);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, message: invalidPayloadMessage },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { ok: false, message: invalidMessage },
        { status: 400 }
      );
    }

    await enqueueWrite(async () => {
      const entries = await readEntries();
      const existing = entries.find(
        (entry) => entry.email === normalizedEmail
      );

      if (existing) {
        throw new Error("DUPLICATE_EMAIL");
      }

      const forwardedFor = request.headers.get("x-forwarded-for");
      const ipAddress = forwardedFor
        ? forwardedFor.split(",")[0]?.trim() || null
        : request.headers.get("x-real-ip");
      const userAgent = request.headers.get("user-agent");

      entries.push({
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        ipAddress,
        userAgent,
      });

      await writeEntries(entries);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error)?.message === "DUPLICATE_EMAIL") {
      return NextResponse.json(
        { ok: false, message: duplicateMessage },
        { status: 409 }
      );
    }
    console.error("Error in /api/early-access:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 }
    );
  }
}
