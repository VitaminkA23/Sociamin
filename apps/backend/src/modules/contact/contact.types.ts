import { z } from "zod";

// ── Request schema ─────────────────────────────────────────────────────────────

export const submitContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Email must be a valid email address"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be 200 characters or less"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(5000, "Message must be 5000 characters or less"),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;

// ── Response shape ─────────────────────────────────────────────────────────────

export interface ContactMessageResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}