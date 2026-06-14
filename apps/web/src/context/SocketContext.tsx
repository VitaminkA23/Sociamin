import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import type { ReceiveMessagePayload } from "../types/chat";

// ── Notification payload (mirrors backend NotificationPayload) ────────────────

export type NotificationPayload =
  | {
      type: "FRIEND_REQUEST";
      senderName: string;
      senderId: string;
    }
  | {
      type: "NEW_MESSAGE";
      senderName: string;
      senderId: string;
      text: string;
      chatId: string;
    }
  | {
      type: "POST_LIKE";
      senderName: string;
      senderId: string;
      postId: string;
    }
  | {
      type: "POST_COMMENT";
      senderName: string;
      senderId: string;
      postId: string;
      preview: string;
    };

// ── Socket event maps ─────────────────────────────────────────────────────────

interface ServerToClientEvents {
  receive_message: (payload: ReceiveMessagePayload) => void;
  new_notification: (payload: NotificationPayload) => void;
  message_edited: (payload: { roomId: string; messageId: string; textContent: string }) => void;
  message_deleted: (payload: { roomId: string; messageId: string }) => void;
  messages_read: (payload: { roomId: string }) => void;
  error: (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  send_message: (payload: { roomId: string; textContent: string }) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ── Context ───────────────────────────────────────────────────────────────────

interface SocketContextValue {
  socket: ChatSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

// Direct WebSocket connection to backend (bypasses the Vite /api proxy)
const SOCKET_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:4000";

// ── Provider ──────────────────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Reconnect whenever the JWT token changes (login / logout)
  useEffect(() => {
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s: ChatSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
