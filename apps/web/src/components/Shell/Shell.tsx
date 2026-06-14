import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, MessageCircle, Info, Phone, User } from "lucide-react";
import { Sidebar } from "../Sidebar/Sidebar";
import { NotificationProvider } from "../Notifications/NotificationProvider";
import { SettingsProvider } from "../../context/SettingsContext";
import styles from "./Shell.module.css";

const MOBILE_NAV = [
  { to: "/feed",      Icon: Home,          label: "Feed"      },
  { to: "/messenger", Icon: MessageCircle,  label: "Chats"     },
  { to: "/about",     Icon: Info,           label: "About"     },
  { to: "/contact",   Icon: Phone,          label: "Contact"   },
  { to: "/profile",   Icon: User,           label: "Profile"   },
];

export function Shell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <SettingsProvider>
    <NotificationProvider>
    <div className={styles.page}>
      <div className={styles.layout}>
        <Sidebar />
        <Outlet />
      </div>

      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        {MOBILE_NAV.map(({ to, Icon, label }) => {
          const isActive = pathname === to || (to !== "/feed" && pathname.startsWith(to));
          return (
            <button
              key={to}
              className={`${styles.mobileNavBtn} ${isActive ? styles.mobileNavBtnActive : ""}`}
              onClick={() => navigate(to)}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} />
              <span className={styles.mobileNavLabel}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </NotificationProvider>
    </SettingsProvider>
  );
}
