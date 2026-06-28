import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isAdminEmail, isGlobalAdminEmail } from "@/lib/access";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "LocksAll Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const validPassword = verifyPassword(password, user.passwordHash);
        if (!validPassword) return null;

        const role = user.role === "GLOBAL_ADMIN" || isGlobalAdminEmail(user.email)
          ? "GLOBAL_ADMIN"
          : user.role === "ADMIN" || isAdminEmail(user.email)
            ? "ADMIN"
            : "USER";

        return { id: user.id, name: user.name, email: user.email, role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role === "GLOBAL_ADMIN" ? "GLOBAL_ADMIN" : token.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    },
  },
};
