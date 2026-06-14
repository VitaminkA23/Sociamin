import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, MessageCircle, Settings, User, Search, Bell } from "lucide-react";
import { Logo } from "../Logo/Logo";
import { Avatar } from "../Avatar/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../Notifications/NotificationProvider";
import { getDisplayName, formatRelativeTime } from "../../utils/format";
import { api } from "../../lib/api";
import type { ApiUser, UsersSearchResponse } from "../../types/api";
import type { NotificationPayload } from "../../context/SocketContext";
import styles from "./Header.module.css";

// ── Notification helpers ───────────────────────────────────────────────────────

function notifIcon(type: NotificationPayload["type"]): string {
  if (type === "NEW_MESSAGE")    return "💬";
  if (type === "FRIEND_REQUEST") return "👋";
  if (type === "POST_LIKE")      return "❤️";
  return "💬";
}

function notifText(payload: NotificationPayload): string {
  if (payload.type === "NEW_MESSAGE")    return `${payload.senderName} sent you a message`;
  if (payload.type === "FRIEND_REQUEST") return `${payload.senderName} sent you a friend request`;
  if (payload.type === "POST_LIKE")      return `${payload.senderName} liked your post`;
  return `${payload.senderName} commented: "${payload.preview}"`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Settings dropdown ──────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // ── Notification dropdown ──────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    function onDown(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    function onDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function onDown(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searchOpen]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    try {
      const res = await api.get<UsersSearchResponse>(`/users/search?q=${encodeURIComponent(q.trim())}`);
      setSearchResults(res.data);
      setSearchOpen(res.data.length > 0);
    } catch {
      setSearchResults([]);
      setSearchOpen(false);
    }
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(q), 300);
  }

  function handleSelectResult(id: string) {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(`/profile/${id}`);
  }

  function handleLogout() {
    setSettingsOpen(false);
    setMenuOpen(false);
    logout();
  }

  function handleBellClick() {
    setNotifOpen((v) => !v);
    if (!notifOpen) markAllRead();
    setSettingsOpen(false);
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>

          {/* ── Logo ── */}
          <Link to="/feed" className={styles.logo} aria-label="VitaminA — go to feed">
            <Logo size={50} />
            <span className={styles.logoName}>VitaminA</span>
          </Link>

          {/* ── Search (desktop) ── */}
          {isLoggedIn && (
            <div className={styles.searchWrap} ref={searchWrapRef}>
              <div className={styles.searchBox}>
                <Search size={14} className={styles.searchIcon} aria-hidden="true" />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search people…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                  aria-label="Search users"
                  autoComplete="off"
                />
              </div>
              {searchOpen && (
                <ul className={styles.searchDropdown} role="listbox" aria-label="Search results">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        className={styles.searchResultItem}
                        onClick={() => handleSelectResult(u.id)}
                        role="option"
                      >
                        <Avatar author={u} size={28} />
                        <div className={styles.searchResultInfo}>
                          <span className={styles.searchResultName}>{getDisplayName(u)}</span>
                          {(u.email ?? u.phoneNumber) && (
                            <span className={styles.searchResultSub}>
                              {u.email ?? u.phoneNumber}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Right: user controls ── */}
          <div className={styles.userSection}>
            {isLoggedIn && user ? (
              <>
                <Avatar author={user} size={32} />
                <span className={styles.userName}>{getDisplayName(user)}</span>

                {/* Messenger icon button */}
                <button
                  className={styles.iconBtn}
                  onClick={() => navigate("/messenger")}
                  aria-label="Open Messenger"
                  title="Messenger"
                >
                  <MessageCircle size={19} strokeWidth={1.8} />
                </button>

                {/* Notification bell */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    className={`${styles.iconBtn} ${notifOpen ? styles.iconBtnActive : ""}`}
                    onClick={handleBellClick}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                    title="Notifications"
                  >
                    <Bell size={19} strokeWidth={1.8} />
                    {unreadCount > 0 && (
                      <span className={styles.notifBadge} aria-hidden="true">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className={styles.notifDropdown} role="dialog" aria-label="Notifications">
                      <div className={styles.notifHeader}>
                        <span className={styles.notifTitle}>Notifications</span>
                        {notifications.length > 0 && (
                          <button className={styles.notifClear} onClick={clearAll}>
                            Clear all
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className={styles.notifEmpty}>No notifications yet</p>
                      ) : (
                        <ul className={styles.notifList}>
                          {notifications.map((n) => (
                            <li
                              key={n.id}
                              className={`${styles.notifItem} ${n.read ? styles.notifItemRead : ""}`}
                            >
                              <span className={styles.notifIcon} aria-hidden="true">
                                {notifIcon(n.payload.type)}
                              </span>
                              <div className={styles.notifBody}>
                                <p className={styles.notifText}>{notifText(n.payload)}</p>
                                <time className={styles.notifMeta}>
                                  {formatRelativeTime(new Date(n.timestamp).toISOString())}
                                </time>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings dropdown */}
                <div ref={settingsRef} style={{ position: "relative" }}>
                  <button
                    className={`${styles.iconBtn} ${settingsOpen ? styles.iconBtnActive : ""}`}
                    onClick={() => { setSettingsOpen((v) => !v); setNotifOpen(false); }}
                    aria-label="Open settings menu"
                    aria-expanded={settingsOpen}
                    aria-haspopup="true"
                    title="Settings"
                  >
                    <Settings size={19} strokeWidth={1.8} />
                  </button>

                  {settingsOpen && (
                    <div className={styles.settingsDropdown}>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { setSettingsOpen(false); navigate("/settings"); }}
                      >
                        <Settings size={14} strokeWidth={1.8} />
                        Settings
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { setSettingsOpen(false); navigate("/profile"); }}
                      >
                        <User size={14} strokeWidth={1.8} />
                        My Profile
                      </button>
                      <div className={styles.dropdownDivider} />
                      <button
                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                        onClick={handleLogout}
                      >
                        <LogOut size={14} strokeWidth={1.8} />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className={styles.loginBtn}>Login</Link>
            )}
          </div>

          {/* ── Hamburger (mobile only) ── */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
          >
            {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>

        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <div
        id="mobile-drawer"
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        {isLoggedIn && user ? (
          <>
            <div className={styles.drawerProfile}>
              <Avatar author={user} size={40} />
              <div>
                <p className={styles.drawerProfileName}>{getDisplayName(user)}</p>
                <p className={styles.drawerProfileSub}>{user.email ?? user.phoneNumber ?? ""}</p>
              </div>
            </div>

            <div className={styles.drawerDivider} />

            <nav className={styles.drawerNav} aria-label="Mobile navigation">
              <Link to="/messenger" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                <MessageCircle size={17} strokeWidth={1.8} />
                Messenger
              </Link>
              <Link to="/profile" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                <User size={17} strokeWidth={1.8} />
                My Profile
              </Link>
              <Link to="/settings" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                <Settings size={17} strokeWidth={1.8} />
                Settings
              </Link>
            </nav>

            <div className={styles.drawerDivider} />

            <button className={styles.drawerLogoutBtn} onClick={handleLogout}>
              <LogOut size={15} strokeWidth={2} />
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className={styles.drawerLoginBtn} onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        )}
      </div>

      {/* ── Backdrop overlay ── */}
      {menuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
