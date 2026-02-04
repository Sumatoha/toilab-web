"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  Wallet,
  CheckSquare,
  Mail,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const eventNav: NavItem[] = [
  { href: "/budget", label: "Расходы", icon: Wallet },
  { href: "/guests", label: "Гости", icon: Users },
  { href: "/checklist", label: "Чек-лист", icon: CheckSquare },
  { href: "/invitation", label: "Приглашение", icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isEventPage = pathname.includes("/events/");
  const eventId = isEventPage ? pathname.split("/events/")[1]?.split("/")[0] : null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border/50 bg-card/80 backdrop-blur-sm flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/30 transition-shadow">
            <span className="text-white font-bold text-base">T</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Toilab</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Back to events when viewing an event */}
        {eventId && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Все мероприятия
          </Link>
        )}

        {/* Main navigation - just events list */}
        {!eventId && (
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              pathname === "/dashboard" || pathname === "/dashboard/events"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Мероприятия
          </Link>
        )}

        {/* Event navigation (when viewing an event) */}
        {eventId && (
          <div className="space-y-1">
            {eventNav.map((item) => {
              const href = `/dashboard/events/${eventId}${item.href}`;
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || ""}
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-1.5 mt-2">
          <Link
            href="/dashboard/settings"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Настройки
          </Link>
          <button
            onClick={logout}
            className="flex items-center justify-center px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
