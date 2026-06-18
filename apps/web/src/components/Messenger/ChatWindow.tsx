import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { Avatar } from "../Avatar/Avatar";
import { getDisplayName, formatRelativeTime } from "../../utils/format";
import { getOtherParticipant } from "../../utils/chat";
import { ChatInput } from "./ChatInput";
import type { ChatMessage, ChatRoom } from "../../types/chat";
import styles from "./ChatWindow.module.css";

// ── Message bubble ─────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit: (messageId: string, newText: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

function MessageBubble({ message, isOwn, showAvatar, onEdit, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.textContent);
  const [isBusy, setIsBusy] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const canModify = isOwn && !message.isRead;

  // Close action menu when clicking outside
  useEffect(() => {
    if (!actionsOpen) return;
    function onDown(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [actionsOpen]);

  // Keep editText in sync if the message is updated externally via socket
  useEffect(() => {
    setEditText(message.textContent);
  }, [message.textContent]);

  async function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.textContent) { setIsEditing(false); return; }
    setIsBusy(true);
    try {
      await onEdit(message.id, trimmed);
      setIsEditing(false);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    setIsBusy(true);
    try {
      await onDelete(message.id);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className={`${styles.bubbleRow} ${isOwn ? styles.bubbleRowOwn : ""}`}>
      <div className={styles.bubbleAvatarSlot}>
        {!isOwn && showAvatar && (
          <Avatar author={message.sender} size={28} />
        )}
      </div>

      <div className={styles.bubbleGroup}>
        <div className={styles.bubbleWrap}>
          {isEditing ? (
            <div>
              <textarea
                className={styles.editInput}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSaveEdit(); }
                  if (e.key === "Escape") setIsEditing(false);
                }}
                autoFocus
                rows={2}
              />
              <div className={styles.editActions}>
                <button className={styles.editCancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                <button className={styles.editSaveBtn} onClick={() => void handleSaveEdit()} disabled={isBusy}>
                  {isBusy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther} ${canModify ? styles.bubbleClickable : ""}`}
                aria-label={isOwn ? "Your message" : `Message from ${getDisplayName(message.sender)}`}
                onClick={canModify ? () => setActionsOpen((v) => !v) : undefined}
              >
                {message.textContent}
              </div>
              {canModify && actionsOpen && (
                <div ref={actionsRef} className={styles.msgActions}>
                  <button
                    className={styles.msgActionBtn}
                    onClick={() => { setActionsOpen(false); setIsEditing(true); }}
                    disabled={isBusy}
                    title="Edit message"
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.msgActionBtn} ${styles.msgActionBtnDelete}`}
                    onClick={() => { setActionsOpen(false); void handleDelete(); }}
                    disabled={isBusy}
                    title="Delete message"
                  >
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <span className={`${styles.bubbleTime} ${isOwn ? styles.bubbleTimeOwn : ""}`}>
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Empty / no room selected state ────────────────────────────────────────

export function ChatWindowEmpty() {
  return (
    <div className={styles.empty}>
      <MessageCircle size={52} className={styles.emptyIcon} strokeWidth={1.2} />
      <p className={styles.emptyTitle}>Your messages</p>
      <p className={styles.emptySub}>Select a conversation to start chatting.</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface ChatWindowProps {
  room: ChatRoom;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onEditMessage: (messageId: string, textContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onBack: () => void;
  currentUserId: string;
}

export function ChatWindow({
  room,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onBack,
  currentUserId,
}: ChatWindowProps) {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const other = getOtherParticipant(room, currentUserId);

  const prevRoomIdRef = useRef<string | null>(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    const isRoomSwitch = prevRoomIdRef.current !== room.id;
    const delta = messages.length - prevMsgCountRef.current;
    prevRoomIdRef.current = room.id;
    prevMsgCountRef.current = messages.length;

    const behavior = !isRoomSwitch && delta === 1 ? "smooth" : "auto";
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [messages, room.id]);

  return (
    <div className={styles.window}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <button
          className={styles.headerProfile}
          onClick={() => navigate(`/profile/${other.id}`)}
          aria-label={`View ${getDisplayName(other)}'s profile`}
        >
          <Avatar author={other} size={42} />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{getDisplayName(other)}</span>
            <span className={styles.headerStatus}>Offline</span>
          </div>
        </button>
      </header>

      {/* ── Messages ── */}
      <div
        className={styles.messages}
        role="log"
        aria-label="Message history"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className={styles.noMessages}>
            <p>No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUserId;
            const nextMsg = messages[i + 1];
            const showAvatar = !isOwn && nextMsg?.senderId !== msg.senderId;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showAvatar={showAvatar ?? true}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <ChatInput onSend={onSendMessage} />
    </div>
  );
}
