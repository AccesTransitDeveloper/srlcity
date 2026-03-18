import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UserProfile } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  profiles: UserProfile[];
  signIn: (profileId: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "pamir_user_id";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.profiles.list();
        setProfiles(list);
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId) {
          const found = list.find((p: UserProfile) => p.id === savedId);
          if (found) setUser(found);
        }
      } catch (e) {
        console.error("Failed to load profiles", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signIn = (profileId: string) => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, profileId);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, profiles, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
