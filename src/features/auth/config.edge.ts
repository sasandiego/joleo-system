import type { NextAuthConfig } from "next-auth";

export const authConfigEdge = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isAuthApi = pathname.startsWith("/api/auth");
      const isLoginPage = pathname === "/login";

      if (isAuthApi) return true;

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
