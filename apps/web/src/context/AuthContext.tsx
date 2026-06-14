import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { User, MeResponse } from "../types/api";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Seed token from localStorage so SocketProvider can connect immediately on reload
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session from stored token on mount
  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem("token");

    if (!stored) {
      setIsLoading(false);
      return;
    }

    api
      .get<MeResponse>("/auth/me")
      .then((res) => {
        if (cancelled) return;
        setUser(res.user);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    (newToken: string, newUser: User) => {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(newUser);
      void navigate("/feed");
    },
    [navigate],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    void navigate("/login");
  }, [navigate]);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: user !== null, isLoading, user, token, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
