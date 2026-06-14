// Frontend mirror types matching backend JSON responses (Dates arrive as ISO strings).

export interface User {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: true;
  token: string;
  user: User;
}

export interface MeResponse {
  success: true;
  user: User;
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; email: string | null; phoneNumber: string | null; displayName: string | null; avatarUrl: string | null };
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
}

export interface UpdatedPost {
  id: string;
  content: string;
  updatedAt: string;
}

export interface CreatedPost {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface ApiComment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; email: string | null; phoneNumber: string | null; displayName: string | null; avatarUrl: string | null };
}

export interface LikeResult {
  liked: boolean;
  likesCount: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface PagedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// ── Chats ─────────────────────────────────────────────────────────────────────

export interface ApiChatRoom {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{ id: string; email: string | null; phoneNumber: string | null; displayName: string | null; avatarUrl: string | null }>;
  latestMessage: {
    id: string;
    textContent: string;
    createdAt: string;
    isRead: boolean;
    sender: { id: string; email: string | null; phoneNumber: string | null; displayName: string | null; avatarUrl: string | null };
  } | null;
}

export interface ApiMessage {
  id: string;
  textContent: string;
  createdAt: string;
  isRead: boolean;
  sender: { id: string; email: string | null; phoneNumber: string | null; displayName: string | null; avatarUrl: string | null };
}

export interface ChatsResponse {
  success: true;
  data: ApiChatRoom[];
}

export interface CreateChatResponse {
  success: true;
  data: ApiChatRoom;
}

// GET /api/chats/:roomId/messages spreads { messages, meta } into the response body
export interface MessagesResponse {
  success: true;
  messages: ApiMessage[];
  meta: PaginationMeta;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface UsersSearchResponse {
  success: true;
  data: ApiUser[];
}

// ── Profile ───────────────────────────────────────────────────────────────────

export type ViewerFriendshipStatus =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "ACCEPTED";

export interface UserProfile {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  createdAt: string;
  friends: ApiUser[];
  friendshipStatus: ViewerFriendshipStatus;
  isPrivate: boolean;
}

export interface UserProfileResponse {
  success: true;
  data: UserProfile;
}

export interface UpdateProfileResponse {
  success: true;
  data: { displayName: string | null; bio: string | null; avatarUrl: string | null; location: string | null };
}

export interface AvatarUpdateResponse {
  success: true;
  data: { avatarUrl: string };
}

export interface FriendshipActionResponse {
  success: true;
  data: { id: string; status: string };
}

// ── Settings ───────────────────────────────────────────────────────────────────

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications:  boolean;
  isPrivateProfile:   boolean;
}

export interface UserSettingsResponse {
  success: true;
  data: UserSettings;
}

export interface UpdateAccountResponse {
  success: true;
  data: { email: string | null; phoneNumber: string | null };
}

export interface ChangePasswordResponse {
  success: true;
  message: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  senderId: string;
  senderName: string;
  entityId: string;
  createdAt: string;
}

export interface NotificationsResponse {
  success: true;
  data: ApiNotification[];
}
