import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import { AppError } from "./error.middleware.js";
import { env } from "../config/env.js";

const UPLOAD_DIR = env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const _upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
}).single("image");

export function uploadImage(req: Request, res: Response, next: NextFunction): void {
  _upload(req, res, (err) => {
    if (!err) { next(); return; }
    if (err instanceof multer.MulterError) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or less" : err.message;
      next(new AppError(400, msg));
    } else {
      next(new AppError(400, (err as Error).message));
    }
  });
}
