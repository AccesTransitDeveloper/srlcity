import { Star } from "lucide-react";

interface BadgeProps {
  type: "active" | "leader" | string;
}

const UserBadge = ({ type }: BadgeProps) => {
  if (type === "leader") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        <Star className="h-3 w-3" />
        Лидер
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      Активный
    </span>
  );
};

export default UserBadge;
