import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/access";
import { prisma } from "@/lib/db";

type SessionUser = { user?: { id?: string; email?: string | null; role?: string } } | null;

export function getSessionUserId(session: unknown) {
  return (session as SessionUser)?.user?.id;
}

export function getSessionEmail(session: unknown) {
  return (session as SessionUser)?.user?.email ?? null;
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, address: true, role: true },
  });

  if (!user) return null;

  return {
    ...user,
    isAdmin: user.role === "ADMIN" || isAdminEmail(user.email),
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user?.isAdmin) return null;
  return user;
}
