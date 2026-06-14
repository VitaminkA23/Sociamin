import { Avatar } from "../Avatar/Avatar";
import { ACTIVE_USERS } from "../../mock/posts";
import { getDisplayName } from "../../utils/format";
import { Logo } from "../Logo/Logo";
import styles from "./RightPanel.module.css";

export function RightPanel() {
  return (
    <aside className={styles.panel} aria-label="Right panel">
      {/* Active Now */}
      <div className={styles.widget}>
        <h3 className={styles.widgetTitle}>Active Now</h3>
        <ul className={styles.userList}>
          {ACTIVE_USERS.map((user) => (
            <li key={user.id} className={styles.userRow}>
              <Avatar author={user} size={38} isOnline />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{getDisplayName(user)}</span>
                <span className={styles.userStatus}>Active now</span>
              </div>
              <button className={styles.msgBtn} aria-label={`Message ${getDisplayName(user)}`}>
                Message
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* VitaminA brand tagline */}
      <div className={styles.taglineCard}>
        <Logo size={32} />
        <p className={styles.tagline}>Your healthy dose of connection</p>
        <p className={styles.taglineSub}>
          Connecting people who care about wellbeing, growth, and community.
        </p>
      </div>
    </aside>
  );
}
