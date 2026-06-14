import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import type { MessageItem } from "../modules/chat/chat.types.js";

// Discriminated union — no optional fields, so exactOptionalPropertyTypes is satisfied
export type NotificationPayload =
  | {
      type: "FRIEND_REQUEST";
      senderName: string;
      senderId: string;
    }
  | {
      type: "NEW_MESSAGE";
      senderName: string;
      senderId: string;
      text: string;
      chatId: string;
    }
  | {
      type: "POST_LIKE";
      senderName: string;
      senderId: string;
      postId: string;
    }
  | {
      type: "POST_COMMENT";
      senderName: string;
      senderId: string;
      postId: string;
      preview: string;
    };

interface ServerToClientEvents {
  receive_message: (payload: { roomId: string; message: MessageItem }) => void;
  new_notification: (payload: NotificationPayload) => void;
  message_edited: (payload: { roomId: string; messageId: string; textContent: string }) => void;
  message_deleted: (payload: { roomId: string; messageId: string }) => void;
  messages_read: (payload: { roomId: string }) => void;
  error: (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  send_message: (payload: { roomId: string; textContent: string }) => void;
}

interface SocketData {
  userId: string;
}

export type ChatServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function createSocketServer(httpServer: HttpServer): ChatServer {
  const socketOrigins = env.FRONTEND_URL.split(",").map((o) => o.trim());
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: socketOrigins.length === 1 ? (socketOrigins[0] ?? "*") : socketOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth["token"];

    if (typeof token !== "string" || !token) {
      next(new Error("Authentication token required"));
      return;
    }

    let payload: ReturnType<typeof verifyToken>;
    try {
      payload = verifyToken(token);
    } catch {
      next(new Error("Invalid or expired token"));
      return;
    }

    prisma.user
      .findUnique({ where: { id: payload.sub }, select: { id: true } })
      .then((user) => {
        if (!user) {
          next(new Error("User not found"));
          return;
        }
        socket.data.userId = user.id;
        next();
      })
      .catch(() => {
        next(new Error("Authentication error"));
      });
  });

  return io;
}