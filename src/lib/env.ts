import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SEED_ADMIN_1_USERNAME: z.string().optional(),
  SEED_ADMIN_1_PASSWORD: z.string().optional(),
  SEED_ADMIN_1_FULLNAME: z.string().optional(),
  SEED_ADMIN_2_USERNAME: z.string().optional(),
  SEED_ADMIN_2_PASSWORD: z.string().optional(),
  SEED_ADMIN_2_FULLNAME: z.string().optional(),
  SEED_ADMIN_3_USERNAME: z.string().optional(),
  SEED_ADMIN_3_PASSWORD: z.string().optional(),
  SEED_ADMIN_3_FULLNAME: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

export const env = validateEnv();
