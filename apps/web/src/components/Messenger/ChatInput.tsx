import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import styles from "./ChatInput.module.css";

interface ChatInputProps {
  onSend: (text: string) => void;
  isDisabled?: boolean;
}

export function ChatInput({ onSend, isDisabled = false }: ChatInputProps) {
  const [text, setText] = useState("");

  const canSend = text.trim().length > 0 && !isDisabled;

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.bar}>
      <input
        className={styles.input}
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-label="Message input"
        autoComplete="off"
      />
      <button
        className={styles.sendBtn}
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
      >
        <Send size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
