import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { ChatRoomItem, MessageItem, MessageUpdateResult, PaginationMeta, SafeUser } from "./chat.types.js";

function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages };
}

const safeUserSelect = {
  id: true,
  email: true,
  phoneNumber: true,
  displayName: true,
  avatarUrl: true,
} as const;

const messageSelect = {
  id: true,
  textContent: true,
  createdAt: true,
  isRead: true,
  sender: { select: safeUserSelect },
} as const;

export async function getUserChatRooms(userId: string): Promise<ChatRoomItem[]> {
  const records = await prisma.chatParticipant.findMany({
    where: { userId },
    select: {
      chatRoom: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          participants: {
            select: { user: { select: safeUserSelect } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: messageSelect,
          },
          _count: {
            select: {
              messages: {
                where: { senderId: { not: userId }, isRead: false },
              },
            },
          },
        },
      },
    },
  });

  return records
    .map(({ chatRoom }) => ({
      id: chatRoom.id,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
      participants: chatRoom.participants.map((p) => p.user),
      latestMessage: chatRoom.messages[0] ?? null,
      unreadCount: chatRoom._count.messages,
    }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getRoomMessages(
  roomId: string,
  userId: string,
  page: number,
  limit: number
): Promise<{ messages: MessageItem[]; meta: PaginationMeta }> {
  const membership = await prisma.chatParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId: roomId, userId } },
    select: { id: true },
  });
  if (!membership) throw new AppError(403, "You are not a participant in this chat room");

  const skip = (page - 1) * limit;

  const [total, rawMessages] = await prisma.$transaction([
    prisma.message.count({ where: { chatRoomId: roomId } }),
    prisma.message.findMany({
      where: { chatRoomId: roomId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: messageSelect,
    }),
  ]);

  const messages = [...rawMessages].reverse();

  return { messages, meta: buildMeta(total, page, limit) };
}

export async function createMessage(
  chatRoomId: string,
  senderId: string,
  textContent: string
): Promise<MessageItem> {
  const message = await prisma.message.create({
    data: { chatRoomId, senderId, textContent },
    select: messageSelect,
  });

  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function editMessage(
  messageId: string,
  senderId: string,
  textContent: string
): Promise<MessageUpdateResult> {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, isRead: true, chatRoomId: true },
  });
  if (!msg) throw new AppError(404, "Message not found");
  if (msg.senderId !== senderId) throw new AppError(403, "You can only edit your own messages");
  if (msg.isRead) throw new AppError(409, "Cannot edit a message that has already been read");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { textContent },
    select: { ...messageSelect, chatRoomId: true },
  });

  const { chatRoomId, ...message } = updated;
  return { message, chatRoomId };
}

export async function deleteMessage(
  messageId: string,
  senderId: string
): Promise<{ chatRoomId: string }> {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, isRead: true, chatRoomId: true },
  });
  if (!msg) throw new AppError(404, "Message not found");
  if (msg.senderId !== senderId) throw new AppError(403, "You can only delete your own messages");
  if (msg.isRead) throw new AppError(409, "Cannot delete a message that has already been read");

  await prisma.message.delete({ where: { id: messageId } });
  return { chatRoomId: msg.chatRoomId };
}

export async function markRoomMessagesRead(roomId: string, viewerId: string): Promise<void> {
  await prisma.message.updateMany({
    where: {
      chatRoomId: roomId,
      senderId: { not: viewerId },
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function createOrGetDMRoom(
  currentUserId: string,
  targetUserId: string
): Promise<ChatRoomItem> {
  const candidates = await prisma.chatRoom.findMany({
    where: {
      AND: [
        { participants: { some: { userId: currentUserId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { participants: true } },
      participants: { select: { user: { select: safeUserSelect } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: messageSelect,
      },
    },
  });

  const existing = candidates.find((r) => r._count.participants === 2);
  if (existing) {
    return {
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      participants: existing.participants.map((p) => p.user),
      latestMessage: existing.messages[0] ?? null,
      unreadCount: 0,
    };
  }

  const room = await prisma.chatRoom.create({
    data: {
      participants: {
        create: [{ userId: currentUserId }, { userId: targetUserId }],
      },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      participants: { select: { user: { select: safeUserSelect } } },
    },
  });

  return {
    id: room.id,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    participants: room.participants.map((p) => p.user),
    latestMessage: null,
    unreadCount: 0,
  };
}

export async function isParticipant(chatRoomId: string, userId: string): Promise<boolean> {
  const record = await prisma.chatParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId } },
    select: { id: true },
  });
  return record !== null;
}

export async function getRoomParticipants(chatRoomId: string): Promise<SafeUser[]> {
  const records = await prisma.chatParticipant.findMany({
    where: { chatRoomId },
    select: { user: { select: safeUserSelect } },
  });
  return records.map((r) => r.user);
}
