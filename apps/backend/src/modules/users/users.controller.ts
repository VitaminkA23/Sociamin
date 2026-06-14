import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  searchQuerySchema,
  updateProfileSchema,
  updateSettingsSchema,
  updateAccountSchema,
} from "./users.types.js";
import {
  searchUsers,
  getUserProfile,
  updateUserProfile,
  updateAvatarFromFile,
  getUserSettings,
  updateUserSettings,
  updateUserAccount,
} from "./users.service.js";

function viewerId(req: Request): string {
  return (req as AuthRequest).userId;
}

export async function handleSearchUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const users = await searchUsers(parsed.data.q, viewerId(req));
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function handleGetProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      next(new AppError(400, "User ID is required"));
      return;
    }
    const profile = await getUserProfile(id, viewerId(req));
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const data = await updateUserProfile(viewerId(req), parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleGetSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getUserSettings(viewerId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const data = await updateUserSettings(viewerId(req), parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      next(new AppError(400, "Image file is required"));
      return;
    }
    const data = await updateAvatarFromFile(viewerId(req), file.filename);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const data = await updateUserAccount(viewerId(req), parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
