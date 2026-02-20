import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

export function Logo({ size = "md", showText = true, href = "/dashboard", className }: LogoProps) {
  const sizes = {
    sm: { icon: "w-6 h-6", text: "text-sm", spark: "w-1 h-1" },
    md: { icon: "w-7 h-7", text: "text-base", spark: "w-1.5 h-1.5" },
    lg: { icon: "w-8 h-8", text: "text-lg", spark: "w-1.5 h-1.5" },
  };

  const s = sizes[size];

  const LogoIcon = (
    <div className={cn("relative", s.icon)}>
      {/* Main circle with gradient */}
      <div className={cn(
        "absolute inset-0 rounded-lg bg-gradient-to-br from-primary via-primary to-pink-500",
        "flex items-center justify-center"
      )}>
        <span className="text-white font-bold" style={{ fontSize: size === "lg" ? "1rem" : size === "md" ? "0.875rem" : "0.75rem" }}>
          T
        </span>
      </div>
      {/* Festive sparkle accents */}
      <div className={cn("absolute -top-0.5 -right-0.5 rounded-full bg-amber-400", s.spark)} />
      <div className={cn("absolute -bottom-0.5 -left-0.5 rounded-full bg-pink-400", s.spark)} />
    </div>
  );

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {LogoIcon}
      {showText && (
        <span className={cn("font-semibold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent", s.text)}>
          Toilab
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
