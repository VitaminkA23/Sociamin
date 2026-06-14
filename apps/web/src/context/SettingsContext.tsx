import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";
import type { UserSettings, UserSettingsResponse } from "../types/api";

// ── Defaults (applied while the real settings load) ───────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  pushNotifications:  true,
  isPrivateProfile:   false,
};

// ── Context ───────────────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: UserSettings;
  isLoadingSettings: boolean;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoadingSettings: true,
  updateSettings: async () => undefined,
});

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    api
      .get<UserSettingsResponse>("/users/settings")
      .then((res) => {
        if (!cancelled) setSettings(res.data);
      })
      .catch(() => {
        // Keep defaults on error — non-fatal
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSettings(false);
      });

    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    const prev = settings;
    setSettings((s) => ({ ...s, ...patch })); // optimistic
    try {
      const res = await api.put<UserSettingsResponse>("/users/settings", patch);
      setSettings(res.data);
    } catch (err) {
      setSettings(prev); // revert on failure
      throw err;
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, isLoadingSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
