import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnClasses = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {children}
    </div>
  );
}

interface StatItemProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "slate";
  trend?: { value: number; positive?: boolean };
  href?: string;
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  blue: {
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    accent: "border-l-blue-500",
  },
  green: {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    accent: "border-l-emerald-500",
  },
  yellow: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    accent: "border-l-amber-500",
  },
  red: {
    iconBg: "bg-red-100",
    iconText: "text-red-600",
    accent: "border-l-red-500",
  },
  purple: {
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
    accent: "border-l-purple-500",
  },
  slate: {
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    accent: "border-l-slate-500",
  },
};

export function StatItem({
  icon: Icon,
  value,
  label,
  sublabel,
  color = "blue",
  trend,
  href,
  onClick,
  className,
}: StatItemProps) {
  const isInteractive = href || onClick;
  const styles = colorStyles[color];

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("w-5 h-5", styles.iconText)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sublabel && (
          <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "card-interactive p-4 border-l-4",
          styles.accent,
          className
        )}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "card-interactive p-4 border-l-4 text-left w-full",
          styles.accent,
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "card p-4 border-l-4",
        styles.accent,
        className
      )}
    >
      {content}
    </div>
  );
}

interface StatusBadgeProps {
  status: "active" | "draft" | "completed" | "pending" | "success" | "error" | "warning";
  className?: string;
}

const statusConfig = {
  active: {
    label: "Активно",
    className: "badge-success",
    dotClass: "status-dot-active",
  },
  draft: {
    label: "Черновик",
    className: "badge-warning",
    dotClass: "status-dot-warning",
  },
  completed: {
    label: "Завершено",
    className: "badge-default",
    dotClass: "status-dot-inactive",
  },
  pending: {
    label: "Ожидание",
    className: "badge-warning",
    dotClass: "status-dot-warning",
  },
  success: {
    label: "Успешно",
    className: "badge-success",
    dotClass: "status-dot-active",
  },
  error: {
    label: "Ошибка",
    className: "badge-error",
    dotClass: "status-dot-inactive",
  },
  warning: {
    label: "Внимание",
    className: "badge-warning",
    dotClass: "status-dot-warning",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5", config.className, className)}>
      <span className={config.dotClass} />
      {config.label}
    </span>
  );
}
