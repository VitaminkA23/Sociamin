import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { Avatar } from "../Avatar/Avatar";
import { useAuth } from "../../context/AuthContext";
import { api, toImageUrl } from "../../lib/api";
import { getDisplayName, formatRelativeTime } from "../../utils/format";
import type { Post, Comment } from "../../types/post";
import type { ApiComment, PagedResponse } from "../../types/api";
import styles from "./PostCard.module.css";

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => Promise<Comment | null>;
  onUpdatePost?: (postId: string, content: string) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
}

export function PostCard({ post, onToggleLike, onAddComment, onUpdatePost, onDeletePost }: PostCardProps) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const commentInputRef = useRef<HTMLInputElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsFetchedRef = useRef(false);

  const isOwn = user?.id === post.author.id;
  const canEdit = isOwn && !!onUpdatePost;
  const canDelete = isOwn && !!onDeletePost;

  useEffect(() => {
    if (commentsOpen) {
      setTimeout(() => commentInputRef.current?.focus(), 50);
    }
  }, [commentsOpen]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        const ta = editTextareaRef.current;
        if (ta) {
          ta.focus();
          ta.selectionStart = ta.value.length;
        }
      }, 30);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!commentsOpen || commentsFetchedRef.current || post.commentsCount === 0) return;
    commentsFetchedRef.current = true;
    setCommentsLoading(true);
    api
      .get<PagedResponse<ApiComment>>(`/posts/${post.id}/comments`)
      .then((res) => {
        setLocalComments(
          res.data.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            author: c.author,
          })),
        );
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => { setCommentsLoading(false); });
  }, [commentsOpen, post.commentsCount, post.id]);

  async function handleLike() {
    if (isLiking) return;
    setIsLiking(true);
    try { await onToggleLike(post.id); } finally { setIsLiking(false); }
  }

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      const result = await onAddComment(post.id, text);
      if (result) setLocalComments((prev) => [...prev, result]);
      setCommentText("");
    } finally {
      setIsSending(false);
    }
  }

  function startEdit() {
    setEditContent(post.content);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditContent(post.content);
  }

  async function saveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed || !onUpdatePost) return;
    setIsSavingEdit(true);
    try {
      await onUpdatePost(post.id, trimmed);
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!onDeletePost) return;
    setIsDeleting(true);
    try { await onDeletePost(post.id); } finally { setIsDeleting(false); }
  }

  const authorName = getDisplayName(post.author);

  return (
    <article className={styles.card}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <Avatar author={post.author} size={44} />
        <div className={styles.headerInfo}>
          <span className={styles.authorName}>{authorName}</span>
          <time className={styles.timestamp} dateTime={post.createdAt}>
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>

        {/* Owner actions */}
        {(canEdit || canDelete) && !isEditing && (
          <div className={styles.postMenu}>
            {canEdit && (
              <button
                type="button"
                className={styles.menuBtn}
                onClick={startEdit}
                aria-label="Edit post"
                title="Edit"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className={`${styles.menuBtn} ${styles.menuBtnDanger}`}
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                aria-label="Delete post"
                title="Delete"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <div className={styles.content}>
        {isEditing ? (
          <div className={styles.editWrap}>
            <textarea
              ref={editTextareaRef}
              className={styles.editArea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSavingEdit}
              maxLength={2000}
              rows={3}
              aria-label="Edit post content"
            />
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.editCancel}
                onClick={cancelEdit}
                disabled={isSavingEdit}
              >
                <X size={13} strokeWidth={2.5} />
                Cancel
              </button>
              <button
                type="button"
                className={styles.editSave}
                onClick={() => void saveEdit()}
                disabled={isSavingEdit || !editContent.trim()}
              >
                <Check size={13} strokeWidth={2.5} />
                {isSavingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.text}>{post.content}</p>
        )}

        {post.imageUrl && (
          <div className={styles.imageWrap}>
            <img
              src={toImageUrl(post.imageUrl) ?? post.imageUrl}
              alt={`Post by ${authorName}`}
              className={styles.postImage}
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className={styles.stats}>
          {post.likesCount > 0 && (
            <span className={styles.stat}>
              <Heart size={13} className={styles.statHeart} />
              {post.likesCount.toLocaleString()}
            </span>
          )}
          {post.commentsCount > 0 && (
            <button
              className={styles.statBtn}
              onClick={() => setCommentsOpen((o) => !o)}
              type="button"
            >
              {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${post.isLikedByMe ? styles.actionBtnLiked : ""}`}
          onClick={() => void handleLike()}
          disabled={isLiking}
          aria-pressed={post.isLikedByMe}
          aria-label={post.isLikedByMe ? "Unlike" : "Like"}
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            className={`${styles.heartIcon} ${post.isLikedByMe ? styles.heartFilled : ""}`}
          />
          <span>Like</span>
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${commentsOpen ? styles.actionBtnActive : ""}`}
          onClick={() => setCommentsOpen((o) => !o)}
          aria-expanded={commentsOpen}
          aria-label="Toggle comments"
        >
          <MessageCircle size={18} strokeWidth={1.8} />
          <span>Comment</span>
        </button>

        <button type="button" className={styles.actionBtn} aria-label="Share">
          <Share2 size={18} strokeWidth={1.8} />
          <span>Share</span>
        </button>
      </div>

      {/* ── Comment section ── */}
      {commentsOpen && (
        <div className={styles.commentSection}>
          {commentsLoading ? (
            <p className={styles.noComments}>Loading comments…</p>
          ) : localComments.length > 0 ? (
            <ul className={styles.commentList} aria-label="Comments">
              {localComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </ul>
          ) : (
            <p className={styles.noComments}>No comments yet. Be the first!</p>
          )}

          {user && (
            <form className={styles.commentForm} onSubmit={(e) => void handleSendComment(e)}>
              <Avatar author={user} size={32} />
              <div className={styles.commentInputWrap}>
                <input
                  ref={commentInputRef}
                  type="text"
                  className={styles.commentInput}
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSending}
                  aria-label="Write a comment"
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!commentText.trim() || isSending}
                  aria-label="Send comment"
                >
                  <Send size={14} strokeWidth={2} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

// ── Sub-component: single comment ────────────────────────────────────────────

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <li className={styles.comment}>
      <Avatar author={comment.author} size={32} />
      <div className={styles.commentBubble}>
        <span className={styles.commentAuthor}>{getDisplayName(comment.author)}</span>
        <p className={styles.commentText}>{comment.content}</p>
        <time className={styles.commentTime} dateTime={comment.createdAt}>
          {formatRelativeTime(comment.createdAt)}
        </time>
      </div>
    </li>
  );
}
