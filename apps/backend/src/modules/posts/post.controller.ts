import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../middleware/error.middleware.js";
import { getIo } from "../../socket/io-instance.js";
import { getBasicUser } from "../users/users.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import {
  feedQuerySchema,
  addCommentSchema,
  commentQuerySchema,
  updatePostSchema,
} from "./post.types.js";
import {
  createPost,
  getFeed,
  toggleLike,
  addComment,
  getComments,
  getPostAuthorId,
  updatePost,
  deletePost,
} from "./post.service.js";

// ── Utility ────────────────────────────────────────────────────────────────────

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

function zodError(err: ZodError): AppError {
  return new AppError(400, err.errors.map((e) => e.message).join(", "));
}

function toDisplayName(
  displayName: string | null,
  email: string | null,
  phoneNumber: string | null
): string {
  return displayName ?? email ?? phoneNumber ?? "Someone";
}

// ── Controllers ────────────────────────────────────────────────────────────────

export async function handleCreatePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const file = req.file;

    if (!content && !file) {
      next(new AppError(400, "Post must have content or an image"));
      return;
    }
    if (content.length > 2000) {
      next(new AppError(400, "Content must be 2000 characters or less"));
      return;
    }

    const post = await createPost(userId(req), {
      content,
      ...(file ? { imageUrl: `/uploads/${file.filename}` } : {}),
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function handleGetFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = feedQuerySchema.parse(req.query);
    const { posts, meta } = await getFeed(userId(req), query.page, query.limit, query.authorId);
    res.status(200).json({ success: true, data: posts, meta });
  } catch (err) {
    next(err instanceof ZodError ? zodError(err) : err);
  }
}

export async function handleUpdatePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: postId } = req.params;
    if (!postId) {
      next(new AppError(400, "Post ID is required"));
      return;
    }
    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, parsed.error.errors.map((e) => e.message).join(", ")));
      return;
    }
    const updated = await updatePost(postId, userId(req), parsed.data.content);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeletePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: postId } = req.params;
    if (!postId) {
      next(new AppError(400, "Post ID is required"));
      return;
    }
    await deletePost(postId, userId(req));
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleToggleLike(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: postId } = req.params;
    if (!postId) {
      next(new AppError(400, "Post ID is required"));
      return;
    }
    const actorId = userId(req);
    const result = await toggleLike(postId, actorId);
    res.status(200).json({ success: true, data: { liked: result.liked, likesCount: result.likesCount } });

    if (result.liked) {
      void (async () => {
        try {
          const [authorId, actor] = await Promise.all([
            getPostAuthorId(postId),
            getBasicUser(actorId),
          ]);
          if (authorId && authorId !== actorId && actor) {
            const senderName = toDisplayName(actor.displayName, actor.email, actor.phoneNumber);
            getIo().to(authorId).emit("new_notification", {
              type: "POST_LIKE",
              senderName,
              senderId: actorId,
              postId,
            });
            await createNotification({
              type: "POST_LIKE",
              message: `${senderName} liked your post`,
              userId: authorId,
              senderId: actorId,
              senderName,
              entityId: postId,
            });
          }
        } catch (err) {
          console.warn("[ws] like notification failed:", err);
        }
      })();
    }
  } catch (err) {
    next(err);
  }
}

export async function handleAddComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: postId } = req.params;
    if (!postId) {
      next(new AppError(400, "Post ID is required"));
      return;
    }
    const actorId = userId(req);
    const input = addCommentSchema.parse(req.body);
    const comment = await addComment(postId, actorId, input.content);
    res.status(201).json({ success: true, data: comment });

    void (async () => {
      try {
        const [authorId, actor] = await Promise.all([
          getPostAuthorId(postId),
          getBasicUser(actorId),
        ]);
        if (authorId && authorId !== actorId && actor) {
          const senderName = toDisplayName(actor.displayName, actor.email, actor.phoneNumber);
          const preview =
            input.content.length > 60 ? `${input.content.slice(0, 57)}…` : input.content;
          getIo().to(authorId).emit("new_notification", {
            type: "POST_COMMENT",
            senderName,
            senderId: actorId,
            postId,
            preview,
          });
          await createNotification({
            type: "POST_COMMENT",
            message: preview,
            userId: authorId,
            senderId: actorId,
            senderName,
            entityId: postId,
          });
        }
      } catch (err) {
        console.warn("[ws] comment notification failed:", err);
      }
    })();
  } catch (err) {
    next(err instanceof ZodError ? zodError(err) : err);
  }
}

export async function handleGetComments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: postId } = req.params;
    if (!postId) {
      next(new AppError(400, "Post ID is required"));
      return;
    }
    const query = commentQuerySchema.parse(req.query);
    const { comments, meta } = await getComments(postId, query.page, query.limit);
    res.status(200).json({ success: true, data: comments, meta });
  } catch (err) {
    next(err instanceof ZodError ? zodError(err) : err);
  }
}
