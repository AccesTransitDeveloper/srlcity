import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UserProfile } from "@/types";
import { api, getToken, setToken, clearToken } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; institution?: string; city?: string; bio?: string }) => Promise<void>;
  signInWithPhone: (token: string, profile: any) => void;
  signOut: () => void;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (token) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
        } catch {
          clearToken();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { token, user: profile } = await api.auth.login({ email, password });
    setToken(token);
    setUser(profile);
  };

  const signUp = async (data: { email: string; password: string; name: string; institution?: string; city?: string; bio?: string }) => {
    const { token, user: profile } = await api.auth.register(data);
    setToken(token);
    setUser(profile);
  };

  const signInWithPhone = (token: string, profile: any) => {
    setToken(token);
    setUser(profile);
  };

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await api.profiles.update(user.id, data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithPhone, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
