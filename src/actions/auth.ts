"use server";

import { signIn, signOut } from "@/features/auth/config";
import { AuthError } from "next-auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid username or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
