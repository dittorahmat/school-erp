import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "teacher" | "student" | "guardian";
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = (await res.json()) as { user: any };
          if (data.user) {
            setUser({
              id: data.user.sub,
              username: data.user.username,
              fullName: data.user.fullName,
              role: data.user.role,
            });
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Gagal masuk" };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Koneksi ke server bermasalah" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
