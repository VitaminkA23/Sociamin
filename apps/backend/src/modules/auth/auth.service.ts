import { prisma } from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { RegisterInput, LoginInput, SafeUser, AuthResponse, ChangePasswordInput } from "./auth.types.js";

function toSafeUser(user: {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { email, phoneNumber, password, displayName } = input;

  // Check uniqueness before hashing to fail fast
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email is already registered");
  }

  if (phoneNumber) {
    const existing = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existing) throw new AppError(409, "Phone number is already registered");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
      displayName: displayName ?? null,
      passwordHash,
    },
  });

  const token = signToken({ sub: user.id });

  return { success: true, token, user: toSafeUser(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { email, phoneNumber, password } = input;

  // Zod refine ensures at least one is defined; non-null assertion is safe here
  const user = await prisma.user.findFirst({
    where: email !== undefined ? { email } : { phoneNumber: phoneNumber! },
  });

  // Use constant-time comparison even when user is not found
  const dummyHash = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
  const isValid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummyHash).then(() => false);

  if (!user || !isValid) {
    throw new AppError(401, "Invalid credentials");
  }

  const token = signToken({ sub: user.id });

  return { success: true, token, user: toSafeUser(user) };
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, phoneNumber: true, displayName: true,
      bio: true, avatarUrl: true, location: true, createdAt: true, updatedAt: true,
    },
  });

  if (!user) throw new AppError(404, "User not found");

  return toSafeUser(user);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new AppError(404, "User not found");

  const isCurrentValid = await verifyPassword(input.oldPassword, user.passwordHash);
  if (!isCurrentValid) throw new AppError(401, "Current password is incorrect");

  const isSameAsOld = await verifyPassword(input.newPassword, user.passwordHash);
  if (isSameAsOld) throw new AppError(400, "New password must differ from your current password");

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}