import { useState, type ReactNode } from "react";
import {
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  Mail,
  Phone,
  AtSign,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { api } from "../../lib/api";
import type { UpdateAccountResponse, ChangePasswordResponse, UpdateProfileResponse } from "../../types/api";
import styles from "./SettingsPage.module.css";

// ── Shared primitives ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className={styles.toggleSlider} />
    </label>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingInfo}>
        <span className={styles.settingLabel}>{label}</span>
        {description && <span className={styles.settingDesc}>{description}</span>}
      </div>
      {children}
    </div>
  );
}

function StatusMsg({
  type,
  text,
}: {
  type: "success" | "error";
  text: string;
}) {
  return (
    <p className={type === "success" ? styles.statusSuccess : styles.statusError}>
      {text}
    </p>
  );
}

// ── Tab 1: Account ────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [displayNameMsg, setDisplayNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  const [email, setEmail]       = useState(user?.email ?? "");
  const [phone, setPhone]       = useState(user?.phoneNumber ?? "");
  const [accountMsg, setAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  const [oldPassword, setOldPassword]         = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [pwMsg, setPwMsg]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  async function handleSaveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    setDisplayNameMsg(null);
    setSavingDisplayName(true);
    try {
      const res = await api.put<UpdateProfileResponse>("/users/profile", {
        displayName: displayName.trim() || null,
      });
      updateUser({ displayName: res.data.displayName });
      setDisplayNameMsg({ type: "success", text: "Display name updated!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update display name.";
      setDisplayNameMsg({ type: "error", text: msg });
    } finally {
      setSavingDisplayName(false);
    }
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountMsg(null);

    const patch: { email?: string; phoneNumber?: string } = {};
    if (email.trim() && email.trim() !== (user?.email ?? ""))       patch.email       = email.trim();
    if (phone.trim() && phone.trim() !== (user?.phoneNumber ?? "")) patch.phoneNumber = phone.trim();

    if (Object.keys(patch).length === 0) {
      setAccountMsg({ type: "error", text: "No changes to save." });
      return;
    }

    setSavingAccount(true);
    try {
      const res = await api.put<UpdateAccountResponse>("/users/account", patch);
      updateUser({ email: res.data.email, phoneNumber: res.data.phoneNumber });
      setAccountMsg({ type: "success", text: "Account updated successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update account.";
      setAccountMsg({ type: "error", text: msg });
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }

    setSavingPw(true);
    try {
      const res = await api.put<ChangePasswordResponse>("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      setPwMsg({ type: "success", text: res.message });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setPwMsg({ type: "error", text: msg });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      {/* ── Display name ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Display Name</h2>
        <form onSubmit={(e) => void handleSaveDisplayName(e)}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="displayName">
              <AtSign size={13} strokeWidth={2} />
              Name shown to others
            </label>
            <input
              id="displayName"
              type="text"
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sofia H."
              maxLength={50}
            />
          </div>
          {displayNameMsg && <StatusMsg type={displayNameMsg.type} text={displayNameMsg.text} />}
          <div className={styles.saveRow}>
            <button type="submit" className={styles.btnPrimary} disabled={savingDisplayName}>
              <Save size={14} strokeWidth={2.2} />
              {savingDisplayName ? "Saving…" : "Save Name"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Account details ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Account Details</h2>
        <form onSubmit={(e) => void handleSaveAccount(e)}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              <Mail size={13} strokeWidth={2} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="phone">
              <Phone size={13} strokeWidth={2} />
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>
          {accountMsg && <StatusMsg type={accountMsg.type} text={accountMsg.text} />}
          <div className={styles.saveRow}>
            <button type="submit" className={styles.btnPrimary} disabled={savingAccount}>
              <Save size={14} strokeWidth={2.2} />
              {savingAccount ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change password ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <KeyRound size={18} strokeWidth={1.8} />
          Change Password
        </h2>
        <form onSubmit={(e) => void handleChangePassword(e)}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="oldPw">Current Password</label>
            <div className={styles.pwWrap}>
              <input
                id="oldPw"
                type={showOld ? "text" : "password"}
                className={styles.input}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowOld((v) => !v)}
                aria-label={showOld ? "Hide password" : "Show password"}
              >
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="newPw">New Password</label>
            <div className={styles.pwWrap}>
              <input
                id="newPw"
                type={showNew ? "text" : "password"}
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="confirmPw">Confirm New Password</label>
            <input
              id="confirmPw"
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {pwMsg && <StatusMsg type={pwMsg.type} text={pwMsg.text} />}
          <div className={styles.saveRow}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={savingPw || !oldPassword || !newPassword || !confirmPassword}
            >
              <KeyRound size={14} strokeWidth={2.2} />
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab 2: Notifications ──────────────────────────────────────────────────────

function NotificationsTab() {
  const { settings, updateSettings } = useSettings();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function toggle(key: "pushNotifications" | "emailNotifications", value: boolean) {
    setBusy(key);
    setMsg(null);
    try {
      await updateSettings({ [key]: value });
    } catch {
      setMsg({ type: "error", text: "Could not save preference. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Notification Preferences</h2>
        <div className={styles.settingsList}>
          <SettingRow
            label="In-App Notifications"
            description="Show real-time toast alerts for messages and friend requests."
          >
            <Toggle
              checked={settings.pushNotifications}
              onChange={(v) => void toggle("pushNotifications", v)}
              disabled={busy === "pushNotifications"}
            />
          </SettingRow>
          <SettingRow
            label="Email Alerts"
            description="Receive email summaries for activity while you're offline."
          >
            <Toggle
              checked={settings.emailNotifications}
              onChange={(v) => void toggle("emailNotifications", v)}
              disabled={busy === "emailNotifications"}
            />
          </SettingRow>
        </div>
        {msg && <StatusMsg type={msg.type} text={msg.text} />}
        <p className={styles.hint}>Changes take effect immediately.</p>
      </div>
    </div>
  );
}

// ── Tab 3: Privacy ────────────────────────────────────────────────────────────

function PrivacyTab() {
  const { settings, updateSettings } = useSettings();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function togglePrivate(value: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      await updateSettings({ isPrivateProfile: value });
    } catch {
      setMsg({ type: "error", text: "Could not save preference. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Privacy Controls</h2>
        <div className={styles.settingsList}>
          <SettingRow
            label="Private Profile"
            description="When enabled, only accepted friends can view your bio, location, and connections."
          >
            <Toggle
              checked={settings.isPrivateProfile}
              onChange={(v) => void togglePrivate(v)}
              disabled={busy}
            />
          </SettingRow>
        </div>
        {msg && <StatusMsg type={msg.type} text={msg.text} />}
        {settings.isPrivateProfile && (
          <div className={styles.privacyBanner}>
            <Shield size={14} strokeWidth={2} />
            Your profile is currently private. Only friends see your full details.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "account" | "notifications" | "privacy";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "account",       label: "Account",       icon: User  },
  { id: "notifications", label: "Notifications", icon: Bell  },
  { id: "privacy",       label: "Privacy",       icon: Shield },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account, notifications, and privacy.</p>
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.tabBar} role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`${styles.tabBtn} ${activeTab === id ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} strokeWidth={activeTab === id ? 2.3 : 1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "account"       && <AccountTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "privacy"       && <PrivacyTab />}
    </div>
  );
}
