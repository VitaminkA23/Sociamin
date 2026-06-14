import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
}

export function signToken(payload: JwtPayload): string {
  // env.JWT_EXPIRES_IN is always a string (Zod enforces default "7d").
  // Cast to StringValue avoids the `exactOptionalPropertyTypes` mismatch with
  // SignOptions["expiresIn"] which resolves to `number | StringValue | undefined`.
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d" | "w" | "y"}` | `${number}` });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== "object" || !decoded || !("sub" in decoded)) {
    throw new Error("Invalid token payload");
  }
  return decoded as JwtPayload;
}