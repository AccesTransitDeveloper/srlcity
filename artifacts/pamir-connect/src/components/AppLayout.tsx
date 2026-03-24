import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Home, Users, Car, CalendarDays, MessageCircle, User } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Лента" },
  { path: "/groups", icon: Users, label: "Группы" },
  { path: "/events", icon: CalendarDays, label: "События" },
  { path: "/rides", icon: Car, label: "Такси" },
  { path: "/messages", icon: MessageCircle, label: "Чат" },
  { path: "/profile", icon: User, label: "Профиль" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [location, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
