import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Clock,
  CheckCircle,
  Users,
  MapPin,
  Check,
  Save,
  Lock,
  Camera,
} from "lucide-react";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Avatar } from "../../components/Avatar/Avatar";
import { PostCard } from "../../components/PostCard/PostCard";
import { getDisplayName, getAvatarColor, getInitials } from "../../utils/format";
import type {
  ApiUser,
  ViewerFriendshipStatus,
  FeedPost,
  ApiComment,
  LikeResult,
  PagedResponse,
  AvatarUpdateResponse,
  UpdatedPost,
} from "../../types/api";
import type { Post, Comment } from "../../types/post";
import styles from "./ProfilePage.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Large avatar ──────────────────────────────────────────────────────────────

function ProfileAvatar({
  user,
  size = 90,
}: {
  user: { id: string; email: string | null; phoneNumber: string | null; avatarUrl?: string | null; displayName?: string | null };
  size?: number;
}) {
  const bg = getAvatarColor(user.id);
  if (user.avatarUrl) {
    return (
      <div className={styles.avatarCircle} style={{ width: size, height: size }}>
        <img src={user.avatarUrl} alt={getDisplayName(user)} className={styles.avatarImg} />
      </div>
    );
  }
  return (
    <div
      className={styles.avatarCircle}
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.36) }}
    >
      {getInitials(user)}
    </div>
  );
}

// ── Friend action button ──────────────────────────────────────────────────────

interface FriendButtonProps {
  status: ViewerFriendshipStatus;
  onAdd: () => Promise<void>;
  onAccept: () => Promise<void>;
}

function FriendButton({ status, onAdd, onAccept }: FriendButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handle(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  if (status === "ACCEPTED") {
    return (
      <span className={styles.btnFriends}>
        <CheckCircle size={15} strokeWidth={2.2} />
        Friends
      </span>
    );
  }
  if (status === "PENDING_SENT") {
    return (
      <span className={styles.btnPending}>
        <Clock size={15} strokeWidth={2} />
        Request Pending
      </span>
    );
  }
  if (status === "PENDING_RECEIVED") {
    return (
      <button className={styles.btnAccept} onClick={() => void handle(onAccept)} disabled={busy}>
        <Check size={15} strokeWidth={2.5} />
        {busy ? "Accepting…" : "Accept Request"}
      </button>
    );
  }
  return (
    <button className={styles.btnAdd} onClick={() => void handle(onAdd)} disabled={busy}>
      <UserPlus size={15} strokeWidth={2.2} />
      {busy ? "Sending…" : "Add Friend"}
    </button>
  );
}

// ── Edit profile form (own profile only) ─────────────────────────────────────

interface EditProfileFormProps {
  initial: { displayName: string | null; bio: string | null; location: string | null; avatarUrl: string | null };
  onSave: (data: { displayName: string | null; bio: string | null; location: string | null; avatarUrl: string | null }) => Promise<void>;
  isSaving: boolean;
}

function EditProfileForm({ initial, onSave, isSaving }: EditProfileFormProps) {
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [bio, setBio]                 = useState(initial.bio ?? "");
  const [location, setLocation]       = useState(initial.location ?? "");
  const [avatarUrl, setAvatarUrl]     = useState(initial.avatarUrl ?? "");
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    setDisplayName(initial.displayName ?? "");
    setBio(initial.bio ?? "");
    setLocation(initial.location ?? "");
    setAvatarUrl(initial.avatarUrl ?? "");
  }, [initial.displayName, initial.bio, initial.location, initial.avatarUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      displayName: displayName.trim() || null,
      bio:         bio.trim()         || null,
      location:    location.trim()    || null,
      avatarUrl:   avatarUrl.trim()   || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const bioLen = bio.length;

  return (
    <form className={styles.card} onSubmit={(e) => void handleSubmit(e)}>
      <h2 className={styles.cardTitle}>Edit Profile</h2>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          className={styles.input}
          type="text"
          placeholder="How you'd like to be called"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          className={styles.textarea}
          placeholder="Tell people a little about yourself…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
        />
        <span className={`${styles.charCount} ${bioLen > 260 ? styles.charCountWarn : ""}`}>
          {bioLen} / 300
        </span>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="location">Location</label>
        <input
          id="location"
          className={styles.input}
          type="text"
          placeholder="City, Country"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="avatarUrl">Avatar URL</label>
        <input
          id="avatarUrl"
          className={styles.input}
          type="url"
          placeholder="https://example.com/photo.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>

      <div className={styles.saveRow}>
        {saved && <span className={styles.savedBadge}>Saved ✓</span>}
        <button className={styles.btnSave} type="submit" disabled={isSaving}>
          <Save size={14} strokeWidth={2.2} />
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ── Friends grid ──────────────────────────────────────────────────────────────

function FriendsList({
  friends,
  onViewProfile,
}: {
  friends: ApiUser[];
  onViewProfile: (id: string) => void;
}) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>
        Friends{friends.length > 0 ? ` · ${friends.length}` : ""}
      </h2>

      {friends.length === 0 ? (
        <p className={styles.emptyFriends}>No friends yet.</p>
      ) : (
        <ul className={styles.friendsGrid}>
          {friends.map((friend) => (
            <li key={friend.id}>
              <button
                className={styles.friendItem}
                onClick={() => onViewProfile(friend.id)}
              >
                <Avatar author={friend} size={38} />
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{getDisplayName(friend)}</span>
                  <span className={styles.friendSub}>
                    {friend.email ?? friend.phoneNumber ?? ""}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Profile posts ─────────────────────────────────────────────────────────────

function ProfilePosts({ userId, label }: { userId: string; label: string }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOwn = user?.id === userId;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<PagedResponse<FeedPost>>(`/posts?authorId=${encodeURIComponent(userId)}`)
      .then((res) => { if (!cancelled) setPosts(res.data.map(toPost)); })
      .catch(() => { if (!cancelled) setPosts([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const handleToggleLike = useCallback(async (postId: string) => {
    let wasLiked = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        wasLiked = p.isLikedByMe;
        return { ...p, isLikedByMe: !wasLiked, likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1 };
      }),
    );
    try {
      const res = await api.post<{ success: true; data: LikeResult }>(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLikedByMe: res.data.liked, likesCount: res.data.likesCount } : p,
        ),
      );
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLikedByMe: wasLiked, likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1 }
            : p,
        ),
      );
    }
  }, []);

  const handleAddComment = useCallback(async (postId: string, content: string): Promise<Comment | null> => {
    try {
      const res = await api.post<{ success: true; data: ApiComment }>(`/posts/${postId}/comments`, { content });
      const comment: Comment = { id: res.data.id, content: res.data.content, createdAt: res.data.createdAt, author: res.data.author };
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p)));
      return comment;
    } catch { return null; }
  }, []);

  const handleUpdatePost = useCallback(async (postId: string, content: string) => {
    const res = await api.put<{ success: true; data: UpdatedPost }>(`/posts/${postId}`, { content });
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content: res.data.content } : p)));
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    await api.delete<{ success: true }>(`/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return (
    <div className={styles.postsSection}>
      <h2 className={styles.postsSectionTitle}>{label}</h2>

      {isLoading ? (
        <div className={styles.card} style={{ padding: "24px", color: "var(--color-muted)", fontSize: 13.5 }}>
          Loading posts…
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.card} style={{ textAlign: "center", padding: "32px 24px" }}>
          <p style={{ color: "var(--color-muted)", fontSize: 13.5 }}>No posts yet.</p>
        </div>
      ) : (
        <ul className={styles.postsList}>
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                {...(isOwn ? { onUpdatePost: handleUpdatePost, onDeletePost: handleDeletePost } : {})}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <div className={styles.skeletonCircle} />
      <div className={styles.skeletonLines}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLg}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonMd}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonSm}`} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  const {
    profile,
    isLoading,
    isOwnProfile,
    isSaving,
    friendshipStatus,
    updateProfile,
    sendFriendRequest,
    acceptFriendRequest,
  } = useProfile(userId);

  // Avatar file upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.put<AvatarUpdateResponse>("/users/profile/avatar", fd);
      await updateProfile({ avatarUrl: res.data.avatarUrl });
      updateUser({ avatarUrl: res.data.avatarUrl });
    } catch { /* non-fatal */ } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>User not found.</p>
        </div>
      </div>
    );
  }

  if (profile.isPrivate) {
    return (
      <div className={styles.page}>
        <div className={styles.headerCard}>
          <div className={styles.avatarWrap}>
            <ProfileAvatar user={profile} size={90} />
          </div>
          <div className={styles.info}>
            <h1 className={styles.name}>{getDisplayName(profile)}</h1>
            {(profile.email ?? profile.phoneNumber) && (
              <p className={styles.handle}>{profile.email ?? profile.phoneNumber}</p>
            )}
          </div>
          <div className={styles.actions}>
            <FriendButton status={friendshipStatus} onAdd={sendFriendRequest} onAccept={acceptFriendRequest} />
          </div>
        </div>
        <div className={styles.card} style={{ textAlign: "center", padding: "40px 24px" }}>
          <Lock size={36} strokeWidth={1.5} style={{ color: "var(--color-muted)", marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: "var(--color-brand)", marginBottom: 6 }}>
            This account is private
          </p>
          <p style={{ color: "var(--color-muted)", fontSize: 13.5 }}>
            Follow this user to see their full profile, bio, and connections.
          </p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(profile);
  const handle = profile.email ?? profile.phoneNumber ?? "";

  return (
    <div className={styles.page}>
      {/* ── Profile header card ── */}
      <div className={styles.headerCard}>
        <div className={styles.avatarWrap}>
          {/* Hidden file input for avatar upload */}
          {isOwnProfile && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => void handleAvatarFile(e)}
            />
          )}

          <div className={styles.avatarEditWrap}>
            <ProfileAvatar user={profile} size={90} />
            {isOwnProfile && (
              <button
                className={styles.avatarEditBtn}
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                aria-label={isUploadingAvatar ? "Uploading…" : "Change avatar"}
                title={isUploadingAvatar ? "Uploading…" : "Change photo"}
              >
                <Camera size={14} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.info}>
          <h1 className={styles.name}>{displayName}</h1>
          {handle && <p className={styles.handle}>{handle}</p>}

          {profile.location && (
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <MapPin size={13} strokeWidth={2} />
                {profile.location}
              </span>
            </div>
          )}

          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        </div>

        <div className={styles.actions}>
          <span className={styles.statPill}>
            <Users size={12} style={{ display: "inline", marginRight: 4 }} />
            {profile.friends.length} {profile.friends.length === 1 ? "friend" : "friends"}
          </span>

          {isOwnProfile ? (
            <span className={styles.statPill}>Your Profile</span>
          ) : (
            <FriendButton status={friendshipStatus} onAdd={sendFriendRequest} onAccept={acceptFriendRequest} />
          )}
        </div>
      </div>

      {/* ── Content: edit form + friends grid ── */}
      <div className={isOwnProfile ? styles.content : styles.contentFull}>
        {isOwnProfile && (
          <EditProfileForm
            initial={{
              displayName: profile.displayName,
              bio: profile.bio,
              location: profile.location,
              avatarUrl: profile.avatarUrl,
            }}
            onSave={updateProfile}
            isSaving={isSaving}
          />
        )}

        <FriendsList
          friends={profile.friends}
          onViewProfile={(id) => {
            if (id === currentUser?.id) navigate("/profile");
            else navigate(`/profile/${id}`);
          }}
        />
      </div>

      {/* ── Posts section ── */}
      <ProfilePosts userId={profile.id} label={isOwnProfile ? "My Posts" : "Posts"} />
    </div>
  );
}
