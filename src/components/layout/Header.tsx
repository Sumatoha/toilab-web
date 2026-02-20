"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Logo } from "@/components/ui";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <div className="mr-8">
          <Logo size="md" href="/dashboard" />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className={
              pathname === "/dashboard" || pathname.startsWith("/dashboard/events")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Мероприятия
          </Link>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user?.name || "Профиль"}</span>
          </Link>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
