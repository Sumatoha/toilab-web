import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  src?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const colorPalette = [
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-lime-100", text: "text-lime-700" },
  { bg: "bg-yellow-100", text: "text-yellow-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
];

function getColorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, size = "md", src, className }: AvatarProps) {
  const initials = getInitials(name);
  const colors = getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium",
        sizeClasses[size],
        colors.bg,
        colors.text,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({ names, max = 4, size = "md", className }: AvatarGroupProps) {
  const visibleNames = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleNames.map((name, index) => (
        <Avatar
          key={index}
          name={name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-medium bg-slate-200 text-slate-600 ring-2 ring-white",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
