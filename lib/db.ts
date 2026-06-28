import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL ||= "postgresql://user:password@localhost:5432/locksall_build_placeholder";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
