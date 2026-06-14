import { useState, useRef, useCallback } from "react";
import { Image, X, Send } from "lucide-react";
import { Avatar } from "../Avatar/Avatar";
import { useAuth } from "../../context/AuthContext";
import styles from "./CreatePost.module.css";

interface CreatePostProps {
  onPost: (content: string, imageFile: File | null) => Promise<void>;
  isPosting: boolean;
}

export function CreatePost({ onPost, isPosting }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !imageFile) return;
    await onPost(trimmed, imageFile);
    setContent("");
    removePhoto();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const canPost = (content.trim().length > 0 || imageFile !== null) && !isPosting;

  if (!user) return null;

  return (
    <div className={styles.card}>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.top}>
          <Avatar author={user} size={44} />
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => { setContent(e.target.value); autoResize(); }}
            rows={1}
            disabled={isPosting}
            aria-label="Post content"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {previewUrl && (
          <div className={styles.preview}>
            <img
              src={previewUrl}
              alt="Post image preview"
              className={styles.previewImg}
            />
            <button
              type="button"
              className={styles.removePhoto}
              onClick={removePhoto}
              aria-label="Remove photo"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.photoBtn} ${imageFile ? styles.photoBtnActive : ""}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isPosting}
          >
            <Image size={18} strokeWidth={1.8} />
            <span>Add Photo</span>
          </button>

          <button
            type="submit"
            className={styles.postBtn}
            disabled={!canPost}
            aria-busy={isPosting}
          >
            {isPosting ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <Send size={15} strokeWidth={2} />
            )}
            <span>{isPosting ? "Posting…" : "Post"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
