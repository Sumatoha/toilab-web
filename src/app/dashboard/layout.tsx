"use client";

import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { EventSidebar } from "@/components/layout/EventSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useRequireAuth();

  // Check if we're inside an event page (but not /new)
  const isEventPage = pathname.match(/\/dashboard\/events\/[^/]+/) && !pathname.includes("/new");

  // Show loading only briefly, then redirect happens automatically
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {isEventPage && <EventSidebar />}
        <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
