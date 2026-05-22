import NextAuth from "next-auth";
import { authConfigEdge } from "@/features/auth/config.edge";

export default NextAuth(authConfigEdge).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|joleo-logo.png|fonts/).*)"],
};
