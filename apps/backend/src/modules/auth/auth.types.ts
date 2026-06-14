import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const emailSchema = z.string().email("Invalid email address").toLowerCase();
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number format");

export const registerSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    password: passwordSchema,
  })
  .refine((data) => data.email !== undefined || data.phoneNumber !== undefined, {
    message: "Either email or phone number is required",
  });

export const loginSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email !== undefined || data.phoneNumber !== undefined, {
    message: "Either email or phone number is required",
  });

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export type RegisterInput      = z.infer<typeof registerSchema>;
export type LoginInput         = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface SafeUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: true;
  token: string;
  user: SafeUser;
}