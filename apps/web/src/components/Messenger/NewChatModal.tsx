import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { api } from "../../lib/api";
import { Avatar } from "../Avatar/Avatar";
import { getDisplayName } from "../../utils/format";
import type { ApiUser, UsersSearchResponse } from "../../types/api";
import styles from "./NewChatModal.module.css";

interface NewChatModalProps {
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  pendingUserId: string | null;
}

function ResultSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonLines}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineLg}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineSm}`} />
          </div>
        </div>
      ))}
    </>
  );
}

export function NewChatModal({ onClose, onSelectUser, pendingUserId }: NewChatModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced search (300 ms, min 2 chars)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      api
        .get<UsersSearchResponse>(`/users/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => {
          setResults(res.data);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const showSkeleton = isSearching;
  const showEmpty = !isSearching && query.trim().length >= 2 && results.length === 0;
  const showHint = query.trim().length < 2;
  const showResults = !isSearching && results.length > 0;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New conversation"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <h2 className={styles.title}>New Message</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        {/* ── Search input ── */}
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="Search by email or phone number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
            autoComplete="off"
          />
        </div>

        {/* ── Results ── */}
        <div className={styles.results} role="list" aria-label="Search results" aria-live="polite">
          {showHint && (
            <p className={styles.hint}>Type at least 2 characters to search for people</p>
          )}

          {showSkeleton && <ResultSkeleton />}

          {showEmpty && (
            <p className={styles.empty}>
              No users found for &ldquo;{query.trim()}&rdquo;
            </p>
          )}

          {showResults &&
            results.map((user) => (
              <button
                key={user.id}
                className={styles.resultItem}
                onClick={() => onSelectUser(user.id)}
                disabled={pendingUserId !== null}
                aria-busy={pendingUserId === user.id}
                role="listitem"
              >
                <Avatar author={user} size={38} />
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{getDisplayName(user)}</span>
                  {user.email && (
                    <span className={styles.resultSub}>{user.email}</span>
                  )}
                  {!user.email && user.phoneNumber && (
                    <span className={styles.resultSub}>{user.phoneNumber}</span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
