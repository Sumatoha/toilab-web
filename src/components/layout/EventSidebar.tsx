"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Users, Wallet, CheckSquare, Mail, Settings, Gift, Clock, LayoutGrid, Lock, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { Plan } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  feature?: string; // Feature name for plan check
}

const navItems: NavItem[] = [
  { href: "", label: "Обзор", icon: LayoutDashboard },
  { href: "/guests", label: "Гости", icon: Users, feature: "guests" },
  { href: "/seating", label: "Рассадка", icon: LayoutGrid, feature: "seating" },
  { href: "/gifts", label: "Подарки", icon: Gift, feature: "gifts" },
  { href: "/program", label: "Программа", icon: Clock, feature: "program" },
  { href: "/budget", label: "Расходы", icon: Wallet },
  { href: "/checklist", label: "Задачи", icon: CheckSquare },
  { href: "/invitation", label: "Приглашение", icon: Mail },
  { href: "/settings", label: "Настройки", icon: Settings },
];

// Features available for each plan
const planFeatures: Record<Plan, string[]> = {
  free: ["budget", "checklist"],
  single: ["guests", "budget", "checklist", "vendors", "program", "seating", "gifts", "sharing"],
  pro: ["guests", "budget", "checklist", "vendors", "program", "seating", "gifts", "sharing"],
  trial: ["guests", "budget", "checklist", "vendors", "program", "seating", "gifts", "sharing"],
};

function hasFeature(plan: Plan, feature: string | undefined): boolean {
  if (!feature) return true; // No feature required
  return planFeatures[plan]?.includes(feature) ?? false;
}

interface EventSidebarProps {
  guestCount?: number;
  taskCount?: number;
}

export function EventSidebar({ guestCount, taskCount }: EventSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuthStore();
  const eventId = params.id as string;
  const basePath = `/dashboard/events/${eventId}`;
  const userPlan = user?.plan || "free";

  const getBadge = (href: string) => {
    if (href === "/guests" && guestCount !== undefined) return guestCount;
    if (href === "/checklist" && taskCount !== undefined) return taskCount;
    return undefined;
  };

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card/50">
      <div className="sticky top-14 p-4">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Все мероприятия</span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const href = basePath + item.href;
            const isActive = item.href === ""
              ? pathname === basePath
              : pathname.startsWith(href);
            const badge = getBadge(item.href);
            const Icon = item.icon;
            const isLocked = !hasFeature(userPlan, item.feature);

            if (isLocked) {
              return (
                <Link
                  key={item.href}
                  href="/dashboard/settings"
                  className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 text-muted-foreground/50 hover:bg-secondary/50"
                  title="Требуется платный тариф"
                >
                  <Icon className="w-4 h-4 text-muted-foreground/50" />
                  <span className="flex-1">{item.label}</span>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground group-hover:bg-muted"
                    )}
                  >
                    {badge}
                  </span>
                )}
                {isActive && (
                  <div className="w-1 h-4 bg-primary rounded-full absolute left-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
