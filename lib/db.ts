import { PrismaClient } from "@prisma/client";

const buildPlaceholderUrl = "postgresql://user:password@localhost:5432/locksall_build_placeholder";
const configuredDatabaseUrl = process.env.DATABASE_URL;

process.env.DATABASE_URL ||= buildPlaceholderUrl;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

export function hasDatabaseUrl() {
  return Boolean(configuredDatabaseUrl);
}

export function isBuildPlaceholderDatabase() {
  return process.env.DATABASE_URL === buildPlaceholderUrl;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
