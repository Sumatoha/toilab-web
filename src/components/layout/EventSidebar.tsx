"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ArrowLeft, Users, Wallet, CheckSquare, Mail, Settings } from "lucide-react";

const navItems = [
  { href: "", label: "Обзор", icon: null },
  { href: "/guests", label: "Гости", icon: Users },
  { href: "/budget", label: "Расходы", icon: Wallet },
  { href: "/checklist", label: "Задачи", icon: CheckSquare },
  { href: "/invitation", label: "Приглашение", icon: Mail },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function EventSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const eventId = params.id as string;
  const basePath = `/dashboard/events/${eventId}`;

  return (
    <aside className="w-52 shrink-0 border-r border-border">
      <div className="sticky top-14 p-4">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Все мероприятия
        </Link>

        {/* Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const href = basePath + item.href;
            const isActive = item.href === ""
              ? pathname === basePath
              : pathname.startsWith(href);

            return (
              <Link
                key={item.href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
