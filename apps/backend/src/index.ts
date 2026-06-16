import 'dotenv/config';
import { createServer } from 'http';
import { env } from './config/env.js';
import app from './app.js';
import { prisma } from './config/prisma.js';
import { createSocketServer } from './socket/socket.server.js';
import { setIo } from './socket/io-instance.js';
import { registerChatHandlers } from './modules/chat/chat.socket.js';

prisma.$connect()
  .then(() => console.log('[db] connected successfully'))
  .catch((err) => console.error('[db] connection failed:', err));

const httpServer = createServer(app);

const io: any = createSocketServer(httpServer);
setIo(io);
registerChatHandlers(io);

httpServer.listen(env.PORT, () => {
  console.log(`[server] HTTP server listening on port ${env.PORT}`);
});

const shutdown = (signal: string) => async () => {
  console.log(`[backend] ${signal} received – shutting down`);
  httpServer.close();
};

process.on("SIGTERM", shutdown("SIGTERM"));
process.on("SIGINT", shutdown("SIGINT"));