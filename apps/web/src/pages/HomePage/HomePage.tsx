import { CreatePost } from "../../components/CreatePost/CreatePost";
import { PostCard } from "../../components/PostCard/PostCard";
import { RightPanel } from "../../components/RightPanel/RightPanel";
import { useFeed } from "../../hooks/useFeed";
import styles from "./HomePage.module.css";

export function HomePage() {
  const {
    posts, isLoading, isPosting,
    handleCreatePost, handleUpdatePost, handleDeletePost,
    handleToggleLike, handleAddComment,
  } = useFeed();

  return (
    <>
      <main className={styles.feed} aria-label="Feed">
        <CreatePost onPost={handleCreatePost} isPosting={isPosting} />

        {isLoading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No posts yet</p>
            <p className={styles.emptySub}>Be the first to share something!</p>
          </div>
        ) : (
          <ul className={styles.postList} aria-label="Posts">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <RightPanel />
    </>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <ul className={styles.postList} aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i}>
          <div className={styles.skeleton}>
            <div className={styles.skeletonHeader}>
              <div className={styles.skeletonCircle} />
              <div className={styles.skeletonLines}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLineSm}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineXs}`} />
              </div>
            </div>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineLg}`} />
            {i === 0 && <div className={styles.skeletonImg} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
