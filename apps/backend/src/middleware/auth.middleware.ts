import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

export interface AuthRequest extends Request {
  userId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ success: false, message: "User no longer exists" });
      return;
    }

    (req as AuthRequest).userId = user.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}