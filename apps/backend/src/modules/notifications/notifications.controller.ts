import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markAllNotificationsRead,
  clearAllNotifications,
} from "./notifications.service.js";

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

export async function handleGetNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getUserNotifications(userId(req));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleMarkAllRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await markAllNotificationsRead(userId(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleClearAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await clearAllNotifications(userId(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
