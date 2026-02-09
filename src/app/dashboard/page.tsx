"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, MoreHorizontal, Sparkles } from "lucide-react";
import { events } from "@/lib/api";
import { Event } from "@/lib/types";
import { formatDate, eventTypeLabels, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui";

const eventTypeEmojis: Record<string, string> = {
  wedding: "\u{1F48D}",
  birthday: "\u{1F382}",
  corporate: "\u{1F4BC}",
  other: "\u{1F389}",
};

export default function DashboardPage() {
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await events.list();
        setEventList(data || []);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  const activeEvents = eventList.filter(e => e.status === "active");
  const draftEvents = eventList.filter(e => e.status === "draft");

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-gradient rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">
              {getGreeting()}
            </h1>
            <p className="text-muted-foreground mt-1">
              {eventList.length === 0
                ? "Создайте первое мероприятие, чтобы начать"
                : `У вас ${activeEvents.length} активных мероприятий`}
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="btn-primary btn-lg shadow-lg hover:shadow-xl inline-flex"
          >
            <Plus className="w-5 h-5" />
            Создать мероприятие
          </Link>
        </div>
      </div>

      {/* Content */}
      {eventList.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <div className="space-y-8">
          {/* Active Events */}
          {activeEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="status-dot-active" />
                <h2 className="text-h3">Активные мероприятия</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    className={`animate-in stagger-${Math.min(index + 1, 4)}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Draft Events */}
          {draftEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="status-dot-warning" />
                <h2 className="text-h3">Черновики</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    className={`animate-in stagger-${Math.min(index + 1, 4)}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброе утро!";
  if (hour < 18) return "Добрый день!";
  return "Добрый вечер!";
}

function EventsEmptyState() {
  return (
    <div className="card-gradient p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-h2 mb-2">Начните планировать</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Создайте первое мероприятие и управляйте гостями, бюджетом и задачами в одном месте
      </p>
      <Link href="/dashboard/events/new" className="btn-primary btn-lg inline-flex">
        <Plus className="w-5 h-5" />
        Создать мероприятие
      </Link>
    </div>
  );
}

function EventCard({ event, className }: { event: Event; className?: string }) {
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;
  const emoji = eventTypeEmojis[event.type] || eventTypeEmojis.other;

  // Mock stats - in real app these would come from API
  const guestCount = 0; // Would be fetched from event stats
  const maxGuests = event.maxGuests || 100;
  const daysUntil = event.date ? getDaysUntil(event.date) : null;

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className={cn(
        "card-interactive group relative overflow-hidden",
        event.status === "active" && "border-l-4 border-l-emerald-500",
        event.status === "draft" && "border-l-4 border-l-amber-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
            {emoji}
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {typeLabel}
            </span>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {event.title}
            </h3>
          </div>
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.preventDefault(); }}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Person names for wedding */}
      {event.person1 && event.person2 && (
        <p className="text-sm text-muted-foreground mb-4">
          {event.person1} & {event.person2}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Quick Info */}
      <div className="space-y-2">
        {event.date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(event.date)}</span>
            {daysUntil !== null && daysUntil > 0 && (
              <span className="text-xs text-muted-foreground">
                (через {daysUntil} дн.)
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{guestCount} / {maxGuests} гостей</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="absolute bottom-4 right-4">
        <StatusBadge status={event.status} />
      </div>
    </Link>
  );
}

function getDaysUntil(dateStr: string): number | null {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 badge-success">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Активно
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 badge-warning">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Черновик
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 badge-default">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Завершено
    </span>
  );
}
