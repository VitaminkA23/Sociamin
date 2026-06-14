import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import type {
  CreatePostInput,
  FeedPost,
  CommentItem,
  LikeToggleResult,
  PaginationMeta,
  PostCreatedResponse,
  UpdatedPost,
} from "./post.types.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages };
}

// The author select shape used consistently across queries
const authorSelect = {
  id: true,
  email: true,
  phoneNumber: true,
  displayName: true,
  avatarUrl: true,
} as const;

// ── Services ───────────────────────────────────────────────────────────────────

export async function createPost(
  authorId: string,
  input: CreatePostInput
): Promise<PostCreatedResponse> {
  return prisma.post.create({
    data: {
      content: input.content,
      // exactOptionalPropertyTypes: coerce undefined → null so Prisma stays happy
      imageUrl: input.imageUrl ?? null,
      authorId,
    },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      createdAt: true,
    },
  });
}

export async function getFeed(
  currentUserId: string,
  page: number,
  limit: number,
  authorId?: string
): Promise<{ posts: FeedPost[]; meta: PaginationMeta }> {
  const skip = (page - 1) * limit;

  const includeArgs = {
    author: { select: authorSelect },
    _count: { select: { likes: true, comments: true } },
    likes: {
      where: { userId: currentUserId },
      select: { id: true },
    },
  } as const;

  // Two explicit branches keep Prisma's strict generic types happy
  const [total, rawPosts] = authorId !== undefined
    ? await prisma.$transaction([
        prisma.post.count({ where: { authorId } }),
        prisma.post.findMany({
          where: { authorId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: includeArgs,
        }),
      ])
    : await prisma.$transaction([
        prisma.post.count(),
        prisma.post.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: includeArgs,
        }),
      ]);

  const posts: FeedPost[] = rawPosts.map((raw) => ({
    id: raw.id,
    content: raw.content,
    imageUrl: raw.imageUrl,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    author: raw.author,
    likesCount: raw._count.likes,
    commentsCount: raw._count.comments,
    isLikedByMe: raw.likes.length > 0,
  }));

  return { posts, meta: buildMeta(total, page, limit) };
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<LikeToggleResult> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) throw new AppError(404, "Post not found");

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { postId, userId } });
  }

  const likesCount = await prisma.like.count({ where: { postId } });

  return { liked: !existing, likesCount };
}

export async function addComment(
  postId: string,
  userId: string,
  content: string
): Promise<CommentItem> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) throw new AppError(404, "Post not found");

  const comment = await prisma.comment.create({
    data: { postId, userId, content },
    include: { user: { select: authorSelect } },
  });

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: comment.user,
  };
}

export async function getComments(
  postId: string,
  page: number,
  limit: number
): Promise<{ comments: CommentItem[]; meta: PaginationMeta }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) throw new AppError(404, "Post not found");

  const skip = (page - 1) * limit;

  const [total, rawComments] = await prisma.$transaction([
    prisma.comment.count({ where: { postId } }),
    prisma.comment.findMany({
      where: { postId },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      include: { user: { select: authorSelect } },
    }),
  ]);

  const comments: CommentItem[] = rawComments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: c.user,
  }));

  return { comments, meta: buildMeta(total, page, limit) };
}

export async function getPostAuthorId(postId: string): Promise<string | null> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  return post?.authorId ?? null;
}

export async function updatePost(
  postId: string,
  requesterId: string,
  content: string
): Promise<UpdatedPost> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new AppError(404, "Post not found");
  if (post.authorId !== requesterId) throw new AppError(403, "Not authorized to edit this post");

  return prisma.post.update({
    where: { id: postId },
    data: { content },
    select: { id: true, content: true, updatedAt: true },
  });
}

export async function deletePost(postId: string, requesterId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new AppError(404, "Post not found");
  if (post.authorId !== requesterId) throw new AppError(403, "Not authorized to delete this post");

  await prisma.post.delete({ where: { id: postId } });
}