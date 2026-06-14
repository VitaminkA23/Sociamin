import type { Author } from "../types/post";
import type { ChatRoom, ChatMessage } from "../types/chat";

// ── Participants ──────────────────────────────────────────────────────────────

export const CHAT_CURRENT_USER: Author = {
  id: "user-current",
  email: "alex@vitamina.app",
  phoneNumber: null,
};

const CHAT_USERS: Author[] = [
  { id: "user-2", email: "sofia.h@vitamina.app",   phoneNumber: null },
  { id: "user-3", email: "marcus.j@vitamina.app",  phoneNumber: null },
  { id: "user-4", email: null,                      phoneNumber: "+1 555 012 3456" },
  { id: "user-5", email: "priya.k@vitamina.app",   phoneNumber: null },
];

export const ONLINE_USER_IDS = new Set(["user-2", "user-5"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

let mockMsgCounter = 200;
function mid(): string { return `msg-mock-${++mockMsgCounter}`; }
function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function msg(
  chatRoomId: string,
  sender: Author,
  text: string,
  minutesAgo: number
): ChatMessage {
  return {
    id: mid(),
    chatRoomId,
    senderId: sender.id,
    textContent: text,
    createdAt: minsAgo(minutesAgo),
    isRead: true,
    sender,
  };
}

// ── Seed messages ─────────────────────────────────────────────────────────────

const sofia = CHAT_USERS[0] as Author;
const marcus = CHAT_USERS[1] as Author;
const phoneUser = CHAT_USERS[2] as Author;
const priya = CHAT_USERS[3] as Author;
const me = CHAT_CURRENT_USER;

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "room-1": [
    msg("room-1", sofia, "Hey! Did you see the new post about morning habits?", 85),
    msg("room-1", me,    "Yes! Small habits really do compound 🌱", 82),
    msg("room-1", sofia, "Right? I started 10-minute walks and feel way better already.", 80),
    msg("room-1", me,    "Same. Consistency beats intensity every time.", 78),
    msg("room-1", sofia, "Also, are you joining the weekend run?", 60),
    msg("room-1", me,    "100% in. What time are we meeting?", 55),
    msg("room-1", sofia, "7am at Riverside Park. Don't be late this time 😄", 50),
    msg("room-1", me,    "I was only 3 minutes late!", 48),
    msg("room-1", sofia, "12 minutes, I was counting 😂", 45),
    msg("room-1", sofia, "Btw the chickpea bowl recipe Priya posted looks amazing.", 12),
  ],
  "room-2": [
    msg("room-2", me,    "Marcus! Great run post. When did you start training?", 300),
    msg("room-2", marcus, "About 8 weeks ago. Honestly the community here kept me going.", 298),
    msg("room-2", me,    "That's the best part of this app. Real accountability.", 295),
    msg("room-2", marcus, "Exactly. How's your training looking?", 290),
    msg("room-2", me,    "Building base miles right now. Maybe a 10K next.", 288),
    msg("room-2", marcus, "Let's do it together! I'm targeting one in October.", 120),
  ],
  "room-3": [
    msg("room-3", phoneUser, "Hey, this is the number from the group chat!", 1440),
    msg("room-3", me,        "Oh hey! Good to connect here too.", 1430),
    msg("room-3", phoneUser, "Love the VitaminA community. So much good energy.", 1425),
    msg("room-3", me,        "Totally agree. See you in the comments 👋", 1420),
  ],
  "room-4": [
    msg("room-4", priya, "Hi! Sharing the chickpea bowl recipe here 👇", 200),
    msg("room-4", priya, "1 can chickpeas, 1 sweet potato, olive oil, smoked paprika, cumin, 425°F for 25 min.", 198),
    msg("room-4", me,    "This sounds incredible. Saving this immediately!", 195),
    msg("room-4", priya, "It's so good! Let me know when you make it 🍲", 190),
    msg("room-4", me,    "Making it this weekend for sure.", 188),
    msg("room-4", priya, "Yay! I can also send you the tahini dressing recipe.", 30),
    msg("room-4", me,    "Please do! I need that in my life.", 25),
    msg("room-4", priya, "Sending now — 3 tbsp tahini, lemon juice, garlic, water to thin. So simple!", 5),
  ],
};

// ── Rooms ─────────────────────────────────────────────────────────────────────

export const MOCK_ROOMS: ChatRoom[] = [
  {
    id: "room-1",
    createdAt: minsAgo(600),
    updatedAt: minsAgo(12),
    participants: [me, sofia],
    latestMessage: MOCK_MESSAGES["room-1"]?.at(-1) ?? null,
    unreadCount: 1,
  },
  {
    id: "room-4",
    createdAt: minsAgo(250),
    updatedAt: minsAgo(5),
    participants: [me, priya],
    latestMessage: MOCK_MESSAGES["room-4"]?.at(-1) ?? null,
    unreadCount: 2,
  },
  {
    id: "room-2",
    createdAt: minsAgo(400),
    updatedAt: minsAgo(120),
    participants: [me, marcus],
    latestMessage: MOCK_MESSAGES["room-2"]?.at(-1) ?? null,
    unreadCount: 0,
  },
  {
    id: "room-3",
    createdAt: minsAgo(1500),
    updatedAt: minsAgo(1420),
    participants: [me, phoneUser],
    latestMessage: MOCK_MESSAGES["room-3"]?.at(-1) ?? null,
    unreadCount: 0,
  },
];

// ── Helpers exported for components ──────────────────────────────────────────

export function getOtherParticipant(room: ChatRoom, currentUserId: string): Author {
  const found = room.participants.find((p) => p.id !== currentUserId);
  if (found) return found;
  return room.participants[0] ?? CHAT_CURRENT_USER;
}

export async function fetchMockChats(): Promise<{
  rooms: ChatRoom[];
  messagesByRoom: Record<string, ChatMessage[]>;
}> {
  await new Promise<void>((r) => setTimeout(r, 400));
  return {
    rooms: MOCK_ROOMS.map((r) => ({ ...r })),
    messagesByRoom: Object.fromEntries(
      Object.entries(MOCK_MESSAGES).map(([k, v]) => [k, [...v]])
    ),
  };
}
