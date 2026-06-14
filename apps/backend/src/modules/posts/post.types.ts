import { z } from "zod";

// ── Request schemas ────────────────────────────────────────────────────────────

export const updatePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content cannot be empty")
    .max(2000, "Content must be 2000 characters or less"),
});

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  authorId: z.string().uuid().optional(),
});

export const addCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be 1000 characters or less"),
});

export const commentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export interface CreatePostInput {
  content: string;
  imageUrl?: string;
}

export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type CommentQuery = z.infer<typeof commentQuerySchema>;

// ── Response shapes ────────────────────────────────────────────────────────────

export interface SafeAuthor {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UpdatedPost {
  id: string;
  content: string;
  updatedAt: Date;
}

export interface FeedPost {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: SafeAuthor;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
}

export interface PostCreatedResponse {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: Date;
  author: SafeAuthor;
}

export interface LikeToggleResult {
  liked: boolean;
  likesCount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}