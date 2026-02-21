import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-8 px-4",
      icon: "w-10 h-10",
      iconInner: "w-5 h-5",
      title: "text-base",
      desc: "text-xs",
    },
    md: {
      container: "py-12 px-4",
      icon: "w-14 h-14",
      iconInner: "w-7 h-7",
      title: "text-lg",
      desc: "text-sm",
    },
    lg: {
      container: "py-16 px-6",
      icon: "w-16 h-16",
      iconInner: "w-8 h-8",
      title: "text-xl",
      desc: "text-base",
    },
  };

  const s = sizes[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-in",
        s.container,
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center mb-4",
          s.icon
        )}
      >
        <Icon className={cn("text-muted-foreground", s.iconInner)} />
      </div>
      <h3 className={cn("font-semibold text-foreground mb-1", s.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn("text-muted-foreground max-w-xs mb-4", s.desc)}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Compact empty state for inline use
interface EmptyStateInlineProps {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyStateInline({
  icon: Icon,
  message,
  action,
  className,
}: EmptyStateInlineProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-3 py-6 px-4 text-center sm:text-left",
        className
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <span className="text-sm text-muted-foreground">{message}</span>
      {action}
    </div>
  );
}
