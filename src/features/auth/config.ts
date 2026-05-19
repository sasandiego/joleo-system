import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfigEdge } from "./config.edge";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfigEdge,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        if (!username || !password) return null;

        const user = await db.user.findUnique({
          where: { username, isActive: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user as { username: string }).username;
        token.fullName = (user as { fullName: string }).fullName;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.fullName = token.fullName as string;
      session.user.role = token.role as string;
      return session;
    },
    authorized: authConfigEdge.callbacks!.authorized!,
  },
  session: { strategy: "jwt" },
});
