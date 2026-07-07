import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types";
import { getMe } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const setToken = (t: string) => {
    localStorage.setItem("token", t);
    setTokenState(t);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
    } catch (err: unknown) {
      // Only force logout on explicit 401 — not on network errors or timeouts
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) logout();
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
