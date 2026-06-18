import { z } from "zod";

// ── Request schemas ────────────────────────────────────────────────────────────

export const messagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const sendMessageSchema = z.object({
  roomId: z.string().uuid("roomId must be a valid UUID"),
  textContent: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message must be 4000 characters or less"),
});

export const createChatSchema = z.object({
  targetUserId: z.string().uuid("targetUserId must be a valid UUID"),
});

export const editMessageSchema = z.object({
  textContent: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message must be 4000 characters or less"),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;

// ── Response shapes ────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface MessageItem {
  id: string;
  textContent: string;
  createdAt: Date;
  isRead: boolean;
  sender: SafeUser;
}

export interface MessageUpdateResult {
  message: MessageItem;
  chatRoomId: string;
}

export interface ChatRoomItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: SafeUser[];
  latestMessage: MessageItem | null;
  unreadCount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}
