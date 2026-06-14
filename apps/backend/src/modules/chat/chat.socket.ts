import type { ChatServer } from "../../socket/socket.server.js";
import { sendMessageSchema } from "./chat.types.js";
import { createMessage, isParticipant, getRoomParticipants } from "./chat.service.js";
import { createNotification } from "../notifications/notifications.service.js";

function toDisplayName(email: string | null, phoneNumber: string | null): string {
  return email ?? phoneNumber ?? "Someone";
}

export function registerChatHandlers(io: ChatServer): void {
  io.on("connection", (socket) => {
    const { userId } = socket.data;

    console.log(`[ws] User ${userId} connected (${socket.id})`);

    // Personal room keyed by userId — used for targeted notification delivery
    void socket.join(userId);

    socket.on("join_room", (roomId) => {
      void isParticipant(roomId, userId)
        .then((allowed) => {
          if (!allowed) {
            socket.emit("error", { message: "You are not a participant in this room" });
            return;
          }
          return socket.join(roomId);
        })
        .catch((err: unknown) => {
          console.error("[ws] join_room error:", err);
          socket.emit("error", { message: "Failed to join room" });
        });
    });

    socket.on("send_message", (payload) => {
      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("error", { message: parsed.error.errors.map((e) => e.message).join(", ") });
        return;
      }

      const { roomId, textContent } = parsed.data;

      void isParticipant(roomId, userId)
        .then((allowed) => {
          if (!allowed) {
            socket.emit("error", { message: "Forbidden: you are not in this room" });
            return Promise.resolve(undefined);
          }
          return createMessage(roomId, userId, textContent);
        })
        .then((message) => {
          if (!message) return;

          // Broadcast the message to everyone in the chat room
          io.to(roomId).emit("receive_message", { roomId, message });

          // Notify other participants via their personal rooms.
          // Each client decides whether to show the toast based on whether
          // the user is currently viewing that specific conversation.
          const senderName = toDisplayName(message.sender.email, message.sender.phoneNumber);
          const preview = textContent.length > 60 ? `${textContent.slice(0, 57)}…` : textContent;

          return getRoomParticipants(roomId).then((participants) => {
            for (const p of participants) {
              if (p.id === userId) continue;
              io.to(p.id).emit("new_notification", {
                type: "NEW_MESSAGE",
                senderName,
                senderId: userId,
                text: preview,
                chatId: roomId,
              });
              void createNotification({
                type: "NEW_MESSAGE",
                message: preview,
                userId: p.id,
                senderId: userId,
                senderName,
                entityId: roomId,
              }).catch((err: unknown) => {
                console.warn("[db] NEW_MESSAGE notification create failed:", err);
              });
            }
          });
        })
        .catch((err: unknown) => {
          console.error("[ws] send_message error:", err);
          socket.emit("error", { message: "Failed to send message" });
        });
    });

    socket.on("disconnect", (reason) => {
      console.log(`[ws] User ${userId} disconnected (${reason})`);
    });
  });
}
