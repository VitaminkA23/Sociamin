import express from 'express';
import { createServer } from 'http';
import { env } from './config/env.js';
import {createSocketServer, registerChatHandlers} from './socket/socket.server.js';
import { setIo } from './socket/io-instance.js';

const app = express();
const httpServer = createServer(app);

// ДИНАМИЧЕСКИЙ CORS: разрешает абсолютно любой домен, отправляющий запрос, и дружит с credentials
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Твои сокеты
const io: any = createSocketServer(httpServer);
setIo(io);
new registerChatHandlers();
// Запуск сервера
httpServer.listen(env.PORT, () => {
  console.log(`[server] HTTP server listening on port ${env.PORT}`);
});

// Функция закрытия
const shutdown = (signal: string) => async () => {
  console.log(`[backend] ${signal} received – shutting down`);
  httpServer.close();
};

process.on("SIGTERM", shutdown("SIGTERM"));
process.on("SIGINT", shutdown("SIGINT"));