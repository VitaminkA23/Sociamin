import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { registerSchema, loginSchema, changePasswordSchema } from "./auth.types.js";
import { registerUser, loginUser, getUserById, changePassword } from "./auth.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../middleware/error.middleware.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      next(new AppError(400, err.errors.map((e) => e.message).join(", ")));
    } else {
      next(err);
    }
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      next(new AppError(400, err.errors.map((e) => e.message).join(", ")));
    } else {
      next(err);
    }
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req as AuthRequest;
    const user = await getUserById(userId);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function handleChangePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req as AuthRequest;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    await changePassword(userId, parsed.data);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}