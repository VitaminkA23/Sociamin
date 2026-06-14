import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Post, Comment } from "../types/post";
import type {
  FeedPost,
  ApiComment,
  CreatedPost,
  LikeResult,
  PagedResponse,
  UpdatedPost,
} from "../types/api";

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  isPosting: boolean;
  error: string | null;
}

interface FeedActions {
  handleCreatePost: (content: string, imageFile: File | null) => Promise<void>;
  handleUpdatePost: (postId: string, content: string) => Promise<void>;
  handleDeletePost: (postId: string) => Promise<void>;
  handleToggleLike: (postId: string) => Promise<void>;
  handleAddComment: (postId: string, content: string) => Promise<Comment | null>;
}

function toPost(fp: FeedPost): Post {
  return {
    id: fp.id,
    content: fp.content,
    imageUrl: fp.imageUrl,
    createdAt: fp.createdAt,
    author: fp.author,
    likesCount: fp.likesCount,
    commentsCount: fp.commentsCount,
    isLikedByMe: fp.isLikedByMe,
    comments: [],
  };
}

function toComment(ac: ApiComment): Comment {
  return {
    id: ac.id,
    content: ac.content,
    createdAt: ac.createdAt,
    author: ac.author,
  };
}

export function useFeed(): FeedState & FeedActions {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<PagedResponse<FeedPost>>("/posts");
      setPosts(res.data.map(toPost));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreatePost = useCallback(
    async (content: string, imageFile: File | null) => {
      if (!user) return;
      setIsPosting(true);
      try {
        const fd = new FormData();
        fd.append("content", content);
        if (imageFile) fd.append("image", imageFile);

        const res = await api.post<{ success: true; data: CreatedPost }>("/posts", fd);
        const newPost: Post = {
          id: res.data.id,
          content: res.data.content,
          imageUrl: res.data.imageUrl,
          createdAt: res.data.createdAt,
          author: { id: user.id, email: user.email, phoneNumber: user.phoneNumber },
          likesCount: 0,
          commentsCount: 0,
          isLikedByMe: false,
          comments: [],
        };
        setPosts((prev) => [newPost, ...prev]);
      } finally {
        setIsPosting(false);
      }
    },
    [user],
  );

  const handleUpdatePost = useCallback(async (postId: string, content: string) => {
    const res = await api.put<{ success: true; data: UpdatedPost }>(`/posts/${postId}`, { content });
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: res.data.content } : p)),
    );
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    await api.delete<{ success: true }>(`/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handleToggleLike = useCallback(async (postId: string) => {
    // Optimistic update — flip state immediately
    let wasLiked = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        wasLiked = p.isLikedByMe;
        return {
          ...p,
          isLikedByMe: !wasLiked,
          likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }),
    );

    try {
      const res = await api.post<{ success: true; data: LikeResult }>(`/posts/${postId}/like`);
      // Reconcile with server's authoritative count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLikedByMe: res.data.liked, likesCount: res.data.likesCount }
            : p,
        ),
      );
    } catch {
      // Revert the optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLikedByMe: wasLiked,
                likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1,
              }
            : p,
        ),
      );
    }
  }, []);

  const handleAddComment = useCallback(
    async (postId: string, content: string): Promise<Comment | null> => {
      try {
        const res = await api.post<{ success: true; data: ApiComment }>(
          `/posts/${postId}/comments`,
          { content },
        );
        const comment = toComment(res.data);
        // Update parent commentsCount; PostCard owns its local comment list
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          ),
        );
        return comment;
      } catch {
        return null;
      }
    },
    [],
  );

  return { posts, isLoading, isPosting, error, handleCreatePost, handleUpdatePost, handleDeletePost, handleToggleLike, handleAddComment };
}
