import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Info, Phone, User, Settings, LogOut, type LucideIcon } from "lucide-react";
import { Logo } from "../Logo/Logo";
import { Avatar } from "../Avatar/Avatar";
import { useAuth } from "../../context/AuthContext";
import { getDisplayName } from "../../utils/format";
import styles from "./Sidebar.module.css";

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { to: "/feed",      label: "Feed",       icon: Home          },
  { to: "/messenger", label: "Messenger",  icon: MessageCircle },
  { to: "/about",     label: "About Us",   icon: Info          },
  { to: "/contact",   label: "Contact Us", icon: Phone         },
  { to: "/settings",  label: "Settings",   icon: Settings      },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <Logo size={38} />
        <span className={styles.brandName}>VitaminA</span>
      </div>

      {/* Primary nav */}
      <nav className={styles.nav} aria-label="Main navigation">
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className={styles.navLabel}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: profile + logout */}
      <div className={styles.footer}>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
          }
        >
          {({ isActive }) => (
            <>
              <User size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={styles.navLabel}>Profile</span>
            </>
          )}
        </NavLink>

        {user && (
          <div className={styles.profileCard}>
            <Avatar author={user} size={36} />
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{getDisplayName(user)}</span>
              <span className={styles.profileSub}>
                {user.email ?? user.phoneNumber ?? ""}
              </span>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
