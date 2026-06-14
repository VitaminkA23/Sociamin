import type { Author } from "./post";

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  textContent: string;
  createdAt: string;
  isRead: boolean;
  sender: Author;
}

export interface ChatRoom {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: Author[];
  latestMessage: ChatMessage | null;
  unreadCount: number;
}

// Shape of the socket server's receive_message payload.
// The server sends MessageItem (no chatRoomId / senderId) — we remap in useChats.
export interface ReceiveMessagePayload {
  roomId: string;
  message: {
    id: string;
    textContent: string;
    createdAt: string;
    sender: Author;
  };
}
