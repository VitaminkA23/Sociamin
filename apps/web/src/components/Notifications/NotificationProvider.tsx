import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useSettings } from "../../context/SettingsContext";
import { api } from "../../lib/api";
import type { NotificationPayload } from "../../context/SocketContext";
import type { ApiNotification, NotificationsResponse } from "../../types/api";
import styles from "./NotificationProvider.module.css";

// ── Persistent notification item ──────────────────────────────────────────────

export interface AppNotification {
  id: string;
  payload: NotificationPayload;
  timestamp: number;
  read: boolean;
}

// ── Toast data ────────────────────────────────────────────────────────────────

interface ToastItem {
  id: string;
  payload: NotificationPayload;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  setActiveRoom: (roomId: string | null) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  setActiveRoom: () => undefined,
  notifications: [],
  unreadCount: 0,
  markAllRead: () => undefined,
  clearAll: () => undefined,
});

export function useSetActiveRoom(): (roomId: string | null) => void {
  return useContext(NotificationContext).setActiveRoom;
}

export function useNotifications(): Omit<NotificationContextValue, "setActiveRoom"> {
  const { notifications, unreadCount, markAllRead, clearAll } = useContext(NotificationContext);
  return { notifications, unreadCount, markAllRead, clearAll };
}

// ── Convert DB notification to AppNotification ────────────────────────────────

function dbToPayload(n: ApiNotification): NotificationPayload {
  if (n.type === "FRIEND_REQUEST") {
    return { type: "FRIEND_REQUEST", senderName: n.senderName, senderId: n.senderId };
  }
  if (n.type === "POST_LIKE") {
    return { type: "POST_LIKE", senderName: n.senderName, senderId: n.senderId, postId: n.entityId };
  }
  if (n.type === "POST_COMMENT") {
    return { type: "POST_COMMENT", senderName: n.senderName, senderId: n.senderId, postId: n.entityId, preview: n.message };
  }
  return { type: "NEW_MESSAGE", senderName: n.senderName, senderId: n.senderId, chatId: n.entityId, text: n.message };
}

function dbToAppNotification(n: ApiNotification): AppNotification {
  return {
    id: n.id,
    payload: dbToPayload(n),
    timestamp: new Date(n.createdAt).getTime(),
    read: n.isRead,
  };
}

// ── Single toast ──────────────────────────────────────────────────────────────

function Toast({
  item,
  onDismiss,
  onNavigate,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  onNavigate: (chatId: string) => void;
}) {
  const { payload } = item;
  const isMessage = payload.type === "NEW_MESSAGE";

  const icon =
    payload.type === "NEW_MESSAGE" ? "💬"
    : payload.type === "FRIEND_REQUEST" ? "👋"
    : payload.type === "POST_LIKE" ? "❤️"
    : "💬";

  const title =
    payload.type === "NEW_MESSAGE"
      ? `New message from ${payload.senderName}`
      : payload.type === "FRIEND_REQUEST"
      ? `${payload.senderName} sent you a friend request!`
      : payload.type === "POST_LIKE"
      ? `${payload.senderName} liked your post`
      : `${payload.senderName} commented on your post`;

  function handleClick() {
    if (payload.type === "NEW_MESSAGE") {
      onNavigate(payload.chatId);
    }
    onDismiss(item.id);
  }

  return (
    <div
      className={`${styles.toast} ${isMessage ? styles.toastMessage : styles.toastFriend}`}
      onClick={isMessage ? handleClick : undefined}
      role={isMessage ? "button" : "status"}
      tabIndex={isMessage ? 0 : undefined}
      onKeyDown={
        isMessage
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleClick();
            }
          : undefined
      }
      aria-label={title}
    >
      <span className={styles.toastIcon} aria-hidden="true">
        {icon}
      </span>

      <div className={styles.toastBody}>
        <p className={styles.toastTitle}>{title}</p>
        {payload.type === "NEW_MESSAGE" && (
          <p className={styles.toastPreview}>"{payload.text}"</p>
        )}
        {payload.type === "POST_COMMENT" && (
          <p className={styles.toastPreview}>"{payload.preview}"</p>
        )}
      </div>

      <button
        className={styles.toastClose}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(item.id);
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      <div className={styles.toastBar} />
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const activeRoomRef = useRef<string | null>(null);
  const pushEnabledRef = useRef(settings.pushNotifications);

  useEffect(() => {
    pushEnabledRef.current = settings.pushNotifications;
  }, [settings.pushNotifications]);

  // ── Load persisted notifications from DB on mount ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    api
      .get<NotificationsResponse>("/notifications")
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.data.map(dbToAppNotification));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const setActiveRoom = useCallback((roomId: string | null) => {
    activeRoomRef.current = roomId;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void api.patch<{ success: true }>("/notifications/read-all").catch(() => undefined);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    void api.delete<{ success: true }>("/notifications").catch(() => undefined);
  }, []);

  // ── Listen for real-time socket notifications ─────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function onNotification(payload: NotificationPayload) {
      const item: AppNotification = {
        id: `rt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        payload,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));

      if (!pushEnabledRef.current) return;

      if (
        payload.type === "NEW_MESSAGE" &&
        activeRoomRef.current === payload.chatId
      ) {
        return;
      }

      const toast: ToastItem = { id: item.id, payload };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => dismiss(item.id), 4500);
    }

    socket.on("new_notification", onNotification);
    return () => {
      socket.off("new_notification", onNotification);
    };
  }, [socket, dismiss]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleNavigate(chatId: string) {
    void navigate(`/messenger?room=${chatId}`);
  }

  return (
    <NotificationContext.Provider value={{ setActiveRoom, notifications, unreadCount, markAllRead, clearAll }}>
      {children}

      <div
        className={styles.container}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((item) => (
          <Toast
            key={item.id}
            item={item}
            onDismiss={dismiss}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
