import { Mountain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/types";
import UserBadge from "@/components/UserBadge";

function getAvatar(p: UserProfile) {
  return p.avatarUrl || p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`;
}

const AuthPage = () => {
  const { profiles, signIn } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Mountain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Sarykol Connect</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Социальная сеть студентов Памира
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-foreground">Выберите профиль</p>
          {profiles.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Загрузка...</div>
          ) : (
            profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => signIn(profile.id)}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary hover:shadow-sm transition-all text-left"
              >
                <img
                  src={getAvatar(profile)}
                  alt={profile.name}
                  className="h-12 w-12 rounded-full bg-muted object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm text-card-foreground truncate">
                      {profile.name}
                    </span>
                    {profile.badge && <UserBadge type={profile.badge} />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.institution} • {profile.city}
                  </p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Демо-версия: выберите один из профилей для входа
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
