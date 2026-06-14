import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const isProduction = env.NODE_ENV === "production";
  const message = err instanceof Error ? err.message : "An unexpected error occurred";

  if (!isProduction) {
    console.error("[Unhandled Error]", err);
  }

  res.status(500).json({
    success: false,
    message: isProduction ? "Internal server error" : message,
  });
};

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: "Route not found" });
}
