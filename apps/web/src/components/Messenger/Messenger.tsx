import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChats } from "../../hooks/useChats";
import { useAuth } from "../../context/AuthContext";
import { useSetActiveRoom } from "../Notifications/NotificationProvider";
import { ChatList } from "./ChatList";
import { ChatWindow, ChatWindowEmpty } from "./ChatWindow";
import { NewChatModal } from "./NewChatModal";
import styles from "./Messenger.module.css";

export function Messenger() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { rooms, messagesByRoom, isLoading, joinRoom, sendMessage, createRoom, editMessage, deleteMessage } = useChats();
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const setActiveRoom = useSetActiveRoom();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedRoom = selectedRoomId
    ? (rooms.find((r) => r.id === selectedRoomId) ?? null)
    : null;

  const activeMessages = selectedRoomId ? (messagesByRoom[selectedRoomId] ?? []) : [];

  // Keep NotificationProvider in sync so it can suppress toasts for the open room
  useEffect(() => {
    setActiveRoom(selectedRoomId);
    return () => { setActiveRoom(null); };
  }, [selectedRoomId, setActiveRoom]);

  const handleSelectRoom = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId);
      joinRoom(roomId);
    },
    [joinRoom],
  );

  // Handle ?room=<id> set by message-notification toasts
  useEffect(() => {
    const pendingRoom = searchParams.get("room");
    if (!pendingRoom || isLoading || rooms.length === 0) return;
    const found = rooms.some((r) => r.id === pendingRoom);
    if (!found) return; // not a participant — ignore silently
    handleSelectRoom(pendingRoom);
    setSearchParams({}, { replace: true });
  }, [searchParams, isLoading, rooms, handleSelectRoom, setSearchParams]);

  function handleSend(text: string) {
    if (!selectedRoomId) return;
    sendMessage(selectedRoomId, text);
  }

  function handleBack() {
    setSelectedRoomId(null);
  }

  async function handleNewChatUser(targetUserId: string) {
    setPendingUserId(targetUserId);
    try {
      const room = await createRoom(targetUserId);
      setIsNewChatOpen(false);
      setSelectedRoomId(room.id);
      joinRoom(room.id);
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <>
    <div className={styles.messenger}>
      {/* ── Left: conversation list ── */}
      <div
        className={`${styles.leftPanel} ${selectedRoomId ? styles.hiddenMobile : ""}`}
        aria-label="Conversations"
      >
        <ChatList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
          onNewChat={() => setIsNewChatOpen(true)}
          isLoading={isLoading}
          currentUserId={currentUserId}
        />
      </div>

      {/* ── Right: active chat window ── */}
      <div
        className={`${styles.rightPanel} ${!selectedRoomId ? styles.hiddenMobile : ""}`}
        aria-label="Chat"
      >
        {selectedRoom ? (
          <ChatWindow
            room={selectedRoom}
            messages={activeMessages}
            onSendMessage={handleSend}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onBack={handleBack}
            currentUserId={currentUserId}
          />
        ) : (
          <ChatWindowEmpty />
        )}
      </div>
    </div>

    {/* ── New chat modal ── */}
    {isNewChatOpen && (
      <NewChatModal
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={(userId) => void handleNewChatUser(userId)}
        pendingUserId={pendingUserId}
      />
    )}
    </>
  );
}
