import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
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
});

export { handler as GET, handler as POST };
