import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addAudit } from "@/lib/prototype/store";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || null,
      phone: phone || null,
      address: address || null,
    },
    select: { id: true, name: true, email: true, phone: true, address: true, role: true },
  });

  await addAudit(user.id, {
    type: "PROFILE_UPDATED",
    source: "WEB",
    message: "Profile information updated.",
  });

  return NextResponse.json({ ok: true, user: { ...updated, isAdmin: user.isAdmin } });
}
