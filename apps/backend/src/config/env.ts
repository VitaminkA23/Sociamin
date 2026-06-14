import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  // Comma-separated list of allowed frontend origins, e.g. https://vitamina.vercel.app
  FRONTEND_URL: z.string().min(1).default("http://localhost:3000"),
  // Override the uploads directory (useful for Render persistent disk)
  UPLOADS_DIR: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;