import "dotenv/config";
import { createServer } from "http";
import { env } from "./config/env.js";
import app from "./app.js";
import { prisma } from "./config/prisma.js";
import { createSocketServer } from "./socket/socket.server.js";
import { setIo } from "./socket/io-instance.js";
import { registerChatHandlers } from "./modules/chat/chat.socket.js";

async function start() {
  // Verify DB connection before accepting traffic
  await prisma.$connect();
  console.log("[db] Connected to PostgreSQL");

  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);
  setIo(io);
  registerChatHandlers(io);

  httpServer.listen(env.PORT, () => {
    console.log(`[backend] Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[backend] ${signal} received — shutting down`);
    httpServer.close(async () => {
      await io.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("[backend] Failed to start:", err);
  process.exit(1);
});