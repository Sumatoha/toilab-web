import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  iconColor?: "default" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  href?: string;
}

const iconColors = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  error: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-600",
};

export function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  iconColor = "default",
  onClick,
  href,
}: StatCardProps) {
  const Wrapper = href ? "a" : onClick ? "button" : "div";
  const isInteractive = href || onClick;

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      className={cn(
        "stat-card",
        isInteractive && "card-hover"
      )}
    >
      <div className={cn("stat-card-icon", iconColors[iconColor])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sublabel && (
        <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>
      )}
    </Wrapper>
  );
}
