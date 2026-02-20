"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Users, Wallet, CheckSquare, Mail, Settings, Gift, Clock, LayoutGrid, Sparkles, LucideIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { Plan } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  feature?: string;
}

const navItems: NavItem[] = [
  { href: "", label: "Обзор", icon: LayoutDashboard },
  { href: "/guests", label: "Гости", icon: Users, feature: "guests" },
  { href: "/seating", label: "Рассадка", icon: LayoutGrid, feature: "seating" },
  { href: "/gifts", label: "Подарки", icon: Gift, feature: "gifts" },
  { href: "/program", label: "Программа", icon: Clock },
  { href: "/budget", label: "Расходы", icon: Wallet },
  { href: "/checklist", label: "Задачи", icon: CheckSquare },
  { href: "/invitation", label: "Приглашение", icon: Mail, feature: "invitation" },
  { href: "/settings", label: "Настройки", icon: Settings },
];

const planFeatures: Record<Plan, string[]> = {
  free: ["budget", "checklist", "program"],
  single: ["guests", "budget", "checklist", "vendors", "program", "seating", "gifts", "sharing", "invitation"],
  pro: ["guests", "budget", "checklist", "vendors", "program", "seating", "gifts", "sharing", "invitation"],
  trial: ["guests", "budget", "checklist", "vendors", "program", "seating", "gifts", "sharing", "invitation"],
};

function hasFeature(plan: Plan, feature: string | undefined): boolean {
  if (!feature) return true;
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
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getBadge = (href: string) => {
    if (href === "/guests" && guestCount !== undefined) return guestCount;
    if (href === "/checklist" && taskCount !== undefined) return taskCount;
    return undefined;
  };

  // Get current page title
  const currentItem = navItems.find((item) => {
    const href = basePath + item.href;
    return item.href === "" ? pathname === basePath : pathname.startsWith(href);
  });

  const SidebarContent = () => (
    <>
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
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 text-muted-foreground/60 hover:bg-primary/5 hover:text-primary"
              >
                <Icon className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  Pro
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={href}
              onClick={() => setIsOpen(false)}
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
            </Link>
          );
        })}
      </nav>

      {/* Upsell banner for free users */}
      {userPlan === "free" && (
        <Link
          href="/dashboard/settings"
          onClick={() => setIsOpen(false)}
          className="mt-6 block p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Toilab Pro</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Откройте гостей, рассадку и другие функции
          </p>
        </Link>
      )}
    </>
  );

  return (
    <>
      {/* Mobile header with burger */}
      <div className="lg:hidden sticky top-14 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Menu className="w-5 h-5" />
          <span>{currentItem?.label || "Меню"}</span>
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Меню</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-border bg-card/50">
        <div className="sticky top-14 p-4">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
