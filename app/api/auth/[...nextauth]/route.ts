import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  // ✅ Required in production (and recommended everywhere)
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: "Prototype Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        const allowedEmail = process.env.PROTOTYPE_USER_EMAIL?.toLowerCase().trim();
        const allowedPassword = process.env.PROTOTYPE_USER_PASSWORD;

        // If env not configured, deny auth (safe)
        if (!email || !password || !allowedEmail || !allowedPassword) return null;

        if (email === allowedEmail && password === allowedPassword) {
          return { id: "prototype-user-1", name: "Prototype User", email };
        }

        return null;
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/login" },

  // Optional: reduce noisy logs in prod; keep errors visible
  // debug: process.env.NODE_ENV !== "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
