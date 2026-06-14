import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { ChatMessage, ChatRoom, ReceiveMessagePayload } from "../types/chat";
import type { ChatsResponse, MessagesResponse, CreateChatResponse, ApiChatRoom, ApiMessage } from "../types/api";

interface UseChatsReturn {
  rooms: ChatRoom[];
  messagesByRoom: Record<string, ChatMessage[]>;
  isLoading: boolean;
  joinRoom: (roomId: string) => void;
  sendMessage: (roomId: string, textContent: string) => void;
  createRoom: (targetUserId: string) => Promise<ChatRoom>;
  editMessage: (messageId: string, textContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

function toRoom(r: ApiChatRoom): ChatRoom {
  return {
    id: r.id,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    participants: r.participants,
    latestMessage: r.latestMessage
      ? {
          id: r.latestMessage.id,
          chatRoomId: r.id,
          senderId: r.latestMessage.sender.id,
          textContent: r.latestMessage.textContent,
          createdAt: r.latestMessage.createdAt,
          isRead: r.latestMessage.isRead,
          sender: r.latestMessage.sender,
        }
      : null,
    unreadCount: 0,
  };
}

function toMessage(m: ApiMessage, chatRoomId: string): ChatMessage {
  return {
    id: m.id,
    chatRoomId,
    senderId: m.sender.id,
    textContent: m.textContent,
    createdAt: m.createdAt,
    isRead: m.isRead,
    sender: m.sender,
  };
}

export function useChats(): UseChatsReturn {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const loadedRoomsRef = useRef<Set<string>>(new Set());
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // ── Load room list on mount ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api
      .get<ChatsResponse>("/chats")
      .then((res) => {
        if (cancelled) return;
        setRooms(res.data.map(toRoom));
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Real-time: incoming messages ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function onReceiveMessage({ roomId, message }: ReceiveMessagePayload) {
      const chatMsg: ChatMessage = {
        id: message.id,
        chatRoomId: roomId,
        senderId: message.sender.id,
        textContent: message.textContent,
        createdAt: message.createdAt,
        isRead: false,
        sender: message.sender,
      };

      setMessagesByRoom((prev) => {
        const existing = prev[roomId] ?? [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return { ...prev, [roomId]: [...existing, chatMsg] };
      });

      setRooms((prev) =>
        prev
          .map((r) =>
            r.id === roomId
              ? { ...r, latestMessage: chatMsg, updatedAt: chatMsg.createdAt }
              : r,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      );
    }

    socket.on("receive_message", onReceiveMessage);
    return () => {
      socket.off("receive_message", onReceiveMessage);
    };
  }, [socket]);

  // ── Real-time: message edited ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function onMessageEdited({ roomId, messageId, textContent }: { roomId: string; messageId: string; textContent: string }) {
      setMessagesByRoom((prev) => {
        const msgs = prev[roomId];
        if (!msgs) return prev;
        return {
          ...prev,
          [roomId]: msgs.map((m) => (m.id === messageId ? { ...m, textContent } : m)),
        };
      });
    }

    socket.on("message_edited", onMessageEdited);
    return () => { socket.off("message_edited", onMessageEdited); };
  }, [socket]);

  // ── Real-time: message deleted ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function onMessageDeleted({ roomId, messageId }: { roomId: string; messageId: string }) {
      setMessagesByRoom((prev) => {
        const msgs = prev[roomId];
        if (!msgs) return prev;
        return { ...prev, [roomId]: msgs.filter((m) => m.id !== messageId) };
      });
    }

    socket.on("message_deleted", onMessageDeleted);
    return () => { socket.off("message_deleted", onMessageDeleted); };
  }, [socket]);

  // ── Real-time: messages marked read (sender sees their messages become read) ──
  useEffect(() => {
    if (!socket || !user) return;
    const currentUserId = user.id;

    function onMessagesRead({ roomId }: { roomId: string }) {
      setMessagesByRoom((prev) => {
        const msgs = prev[roomId];
        if (!msgs) return prev;
        return {
          ...prev,
          [roomId]: msgs.map((m) =>
            m.senderId === currentUserId ? { ...m, isRead: true } : m,
          ),
        };
      });
    }

    socket.on("messages_read", onMessagesRead);
    return () => { socket.off("messages_read", onMessagesRead); };
  }, [socket, user]);

  // ── Reconnect: re-join rooms after a network drop ─────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const s = socket;

    function onConnect() {
      joinedRoomsRef.current.forEach((roomId) => {
        s.emit("join_room", roomId);
      });
    }

    s.on("connect", onConnect);
    return () => { s.off("connect", onConnect); };
  }, [socket]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const joinRoom = useCallback(
    (roomId: string) => {
      joinedRoomsRef.current.add(roomId);
      socket?.emit("join_room", roomId);

      // Mark messages in this room as read whenever the user views it
      void api.patch<{ success: true }>(`/chats/${roomId}/read`).catch(() => undefined);

      if (loadedRoomsRef.current.has(roomId)) return;
      loadedRoomsRef.current.add(roomId);

      void api
        .get<MessagesResponse>(`/chats/${roomId}/messages`)
        .then((res) => {
          setMessagesByRoom((prev) => ({
            ...prev,
            [roomId]: res.messages.map((m) => toMessage(m, roomId)),
          }));
        })
        .catch(() => {
          loadedRoomsRef.current.delete(roomId);
        });
    },
    [socket],
  );

  const createRoom = useCallback(async (targetUserId: string): Promise<ChatRoom> => {
    const res = await api.post<CreateChatResponse>("/chats", { targetUserId });
    const room = toRoom(res.data);
    setRooms((prev) => {
      if (prev.some((r) => r.id === room.id)) return prev;
      return [room, ...prev];
    });
    return room;
  }, []);

  const sendMessage = useCallback(
    (roomId: string, textContent: string) => {
      if (socket?.connected) {
        socket.emit("send_message", { roomId, textContent });
        return;
      }

      const optimisticMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        chatRoomId: roomId,
        senderId: user?.id ?? "",
        textContent,
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: {
          id: user?.id ?? "",
          email: user?.email ?? null,
          phoneNumber: user?.phoneNumber ?? null,
          displayName: null,
          avatarUrl: null,
        },
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), optimisticMsg],
      }));

      setRooms((prev) =>
        prev
          .map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  latestMessage: optimisticMsg,
                  updatedAt: optimisticMsg.createdAt,
                  unreadCount: 0,
                }
              : r,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      );
    },
    [socket, user],
  );

  const editMessage = useCallback(async (messageId: string, textContent: string): Promise<void> => {
    await api.put<{ success: true }>(`/messages/${messageId}`, { textContent });
    // UI update comes via `message_edited` socket event broadcast to the room
  }, []);

  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    await api.delete<{ success: true }>(`/messages/${messageId}`);
    // UI update comes via `message_deleted` socket event broadcast to the room
  }, []);

  return { rooms, messagesByRoom, isLoading, joinRoom, sendMessage, createRoom, editMessage, deleteMessage };
}
