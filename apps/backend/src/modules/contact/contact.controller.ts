import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../../middleware/error.middleware.js";
import { submitContactSchema } from "./contact.types.js";
import { submitContact } from "./contact.service.js";

function zodError(err: ZodError): AppError {
  return new AppError(400, err.errors.map((e) => e.message).join(", "));
}

export async function handleSubmitContact(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = submitContactSchema.parse(req.body);
    const entry = await submitContact(input);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err instanceof ZodError ? zodError(err) : err);
  }
}