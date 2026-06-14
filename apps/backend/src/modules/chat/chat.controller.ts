import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../middleware/error.middleware.js";
import { getIo } from "../../socket/io-instance.js";
import { messagesQuerySchema, createChatSchema, editMessageSchema } from "./chat.types.js";
import {
  getUserChatRooms,
  getRoomMessages,
  createOrGetDMRoom,
  editMessage,
  deleteMessage,
  markRoomMessagesRead,
} from "./chat.service.js";

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

function zodError(err: ZodError): AppError {
  return new AppError(400, err.errors.map((e) => e.message).join(", "));
}

export async function handleCreateChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createChatSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const currentUserId = userId(req);
    if (parsed.data.targetUserId === currentUserId) {
      next(new AppError(400, "Cannot start a conversation with yourself"));
      return;
    }
    const room = await createOrGetDMRoom(currentUserId, parsed.data.targetUserId);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

export async function handleGetChats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rooms = await getUserChatRooms(userId(req));
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      next(new AppError(400, "Room ID is required"));
      return;
    }
    const query = messagesQuerySchema.parse(req.query);
    const result = await getRoomMessages(roomId, userId(req), query.page, query.limit);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err instanceof ZodError ? zodError(err) : err);
  }
}

export async function handleMarkRoomRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      next(new AppError(400, "Room ID is required"));
      return;
    }
    await markRoomMessagesRead(roomId, userId(req));
    // Notify the room so senders see their messages switch to read
    getIo().to(roomId).emit("messages_read", { roomId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleEditMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: messageId } = req.params;
    if (!messageId) {
      next(new AppError(400, "Message ID is required"));
      return;
    }
    const parsed = editMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const { message, chatRoomId } = await editMessage(messageId, userId(req), parsed.data.textContent);
    getIo().to(chatRoomId).emit("message_edited", {
      roomId: chatRoomId,
      messageId: message.id,
      textContent: message.textContent,
    });
    res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: messageId } = req.params;
    if (!messageId) {
      next(new AppError(400, "Message ID is required"));
      return;
    }
    const { chatRoomId } = await deleteMessage(messageId, userId(req));
    getIo().to(chatRoomId).emit("message_deleted", { roomId: chatRoomId, messageId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
