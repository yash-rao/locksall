import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail, isGlobalAdminEmail } from "@/lib/access";
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

  const isGlobalAdmin = user.role === "GLOBAL_ADMIN" || isGlobalAdminEmail(user.email);
  const isAdmin = isGlobalAdmin || user.role === "ADMIN" || isAdminEmail(user.email);

  return {
    ...user,
    role: isGlobalAdmin ? "GLOBAL_ADMIN" as const : isAdmin ? "ADMIN" as const : "USER" as const,
    isAdmin,
    isGlobalAdmin,
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user?.isAdmin) return null;
  return user;
}

export async function requireGlobalAdmin() {
  const user = await requireUser();
  if (!user?.isGlobalAdmin) return null;
  return user;
}
