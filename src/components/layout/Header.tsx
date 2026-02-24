"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Logo } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t, locale, setLocale, canChangeLanguage } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Logo */}
        <div className="mr-4 lg:mr-8">
          <Logo size="md" href="/dashboard" />
        </div>

        {/* Nav - hidden on mobile when inside event */}
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className={
              pathname === "/dashboard" || pathname.startsWith("/dashboard/events")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            {t("nav.myEvents")}
          </Link>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Language switcher - only for KZ users */}
          {canChangeLanguage && (
            <button
              onClick={() => setLocale(locale === "kk" ? "ru" : "kk")}
              className="text-xs font-medium px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={locale === "kk" ? "Русский тілге ауысу" : "Қазақ тіліне ауысу"}
            >
              {locale === "kk" ? "RU" : "ҚАЗ"}
            </button>
          )}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 sm:px-3 sm:py-1.5 rounded-md hover:bg-secondary"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user?.name || t("nav.profile")}</span>
          </Link>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-secondary"
            title={t("auth.logout")}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
