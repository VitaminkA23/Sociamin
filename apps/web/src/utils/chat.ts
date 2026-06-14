import type { Author } from "../types/post";
import type { ChatRoom } from "../types/chat";

const UNKNOWN_USER: Author = { id: "", email: null, phoneNumber: null };

export function getOtherParticipant(room: ChatRoom, currentUserId: string): Author {
  return room.participants.find((p) => p.id !== currentUserId)
    ?? room.participants[0]
    ?? UNKNOWN_USER;
}
