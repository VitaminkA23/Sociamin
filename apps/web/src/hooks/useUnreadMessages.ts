import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { ChatsResponse } from "../types/api";

// Tracks total unread message count across all rooms for the nav badge.
// Loads initial value from the chats API and increments via socket events.
export function useUnreadMessages(currentPath: string): number {
  const { socket } = useSocket();
  const { isLoggedIn } = useAuth();
  const [count, setCount] = useState(0);
  const pathRef = useRef(currentPath);

  useEffect(() => {
    pathRef.current = currentPath;
  }, [currentPath]);

  // Reset badge when the user navigates into the messenger
  useEffect(() => {
    if (currentPath.startsWith("/messenger")) {
      setCount(0);
    }
  }, [currentPath]);

  // Load initial count from rooms API on login
  useEffect(() => {
    if (!isLoggedIn) { setCount(0); return; }
    let cancelled = false;
    api
      .get<ChatsResponse>("/chats")
      .then((res) => {
        if (cancelled) return;
        const total = res.data.reduce((acc, r) => acc + (r.unreadCount ?? 0), 0);
        setCount(total);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  // Increment on incoming messages when not in messenger
  useEffect(() => {
    if (!socket) return;
    function onReceiveMessage() {
      if (!pathRef.current.startsWith("/messenger")) {
        setCount((prev) => prev + 1);
      }
    }
    socket.on("receive_message", onReceiveMessage);
    return () => { socket.off("receive_message", onReceiveMessage); };
  }, [socket]);

  return count;
}
