import { useState } from "react";
import { Search, MessageCircle, SquarePen } from "lucide-react";
import { Avatar } from "../Avatar/Avatar";
import { getDisplayName, formatRelativeTime } from "../../utils/format";
import { getOtherParticipant } from "../../utils/chat";
import type { ChatRoom } from "../../types/chat";
import styles from "./ChatList.module.css";

// ── Sub-component: single list item ──────────────────────────────────────────

interface ChatListItemProps {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
}

function ChatListItem({ room, isActive, onClick, currentUserId }: ChatListItemProps) {
  const other = getOtherParticipant(room, currentUserId);
  const previewText = room.latestMessage?.textContent ?? "Start a conversation";
  const isOwnLast = room.latestMessage?.senderId === currentUserId;

  return (
    <li>
      <button
        className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
        onClick={onClick}
        aria-current={isActive ? "true" : undefined}
      >
        <Avatar author={other} size={46} />

        <div className={styles.content}>
          <div className={styles.row}>
            <span className={styles.name}>{getDisplayName(other)}</span>
            <span className={styles.time}>{formatRelativeTime(room.updatedAt)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.preview}>
              {isOwnLast && <span className={styles.youPrefix}>You: </span>}
              {previewText}
            </span>
            {room.unreadCount > 0 && (
              <span className={styles.badge} aria-label={`${room.unreadCount} unread`}>
                {room.unreadCount > 9 ? "9+" : room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ChatListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
  currentUserId: string;
}

export function ChatList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onNewChat,
  isLoading,
  currentUserId,
}: ChatListProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rooms.filter((room) => {
        const other = getOtherParticipant(room, currentUserId);
        return getDisplayName(other).toLowerCase().includes(search.toLowerCase());
      })
    : rooms;

  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Messages</h2>
          <button
            className={styles.composeBtn}
            onClick={onNewChat}
            aria-label="New conversation"
            title="New conversation"
          >
            <SquarePen size={17} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.searchBar}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <ChatListSkeleton />
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <MessageCircle size={32} className={styles.emptyIcon} />
          <p>{search ? "No conversations match your search." : "No conversations yet."}</p>
        </div>
      ) : (
        <ul className={styles.list} aria-label="Conversations">
          {filtered.map((room) => (
            <ChatListItem
              key={room.id}
              room={room}
              isActive={room.id === selectedRoomId}
              onClick={() => onSelectRoom(room.id)}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChatListSkeleton() {
  return (
    <ul className={styles.list} aria-busy="true" aria-label="Loading conversations">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonLines}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineMd}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineSm}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}
