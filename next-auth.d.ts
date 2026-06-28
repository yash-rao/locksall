import type { DefaultSession } from "next-auth";

type LocksAllRole = "USER" | "ADMIN" | "GLOBAL_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: LocksAllRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: LocksAllRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: LocksAllRole;
  }
}
