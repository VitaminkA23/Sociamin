import pkg from '@prisma/client';
import { env } from "./env.js";

const { PrismaClient } = pkg;

const globalForPrisma = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}