"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, ArrowRight } from "lucide-react";
import { events } from "@/lib/api";
import { Event, EventStats } from "@/lib/types";
import { formatDate, getDaysUntil, eventTypeLabels, formatDaysCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [eventList, setEventList] = useState<Event[]>([]);
  const [stats, setStats] = useState<Map<string, EventStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await events.list();
      const eventData = data || [];
      setEventList(eventData);

      const statsMap = new Map<string, EventStats>();
      if (eventData.length > 0) {
        await Promise.all(
          eventData.slice(0, 5).map(async (event) => {
            try {
              const eventStats = await events.getStats(event.id);
              statsMap.set(event.id, eventStats);
            } catch {
              // Ignore stats errors
            }
          })
        );
      }
      setStats(statsMap);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Мероприятия</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {eventList.length > 0
              ? `${eventList.length} ${eventList.length === 1 ? "мероприятие" : "мероприятий"}`
              : "Начните планирование"}
          </p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          Создать
        </Link>
      </div>

      {/* Events list */}
      {eventList.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {eventList.map((event) => (
            <EventCard key={event.id} event={event} stats={stats.get(event.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Calendar className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-base font-medium mb-1.5">Нет мероприятий</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        Создайте первое мероприятие и начните планирование вашего торжества
      </p>
      <Link href="/dashboard/events/new" className="btn-primary btn-md">
        <Plus className="w-4 h-4" />
        Создать мероприятие
      </Link>
    </div>
  );
}

function EventCard({ event, stats }: { event: Event; stats?: EventStats }) {
  const daysUntil = getDaysUntil(event.date);
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card",
        "hover:border-primary/20 hover:shadow-sm transition-all"
      )}
    >
      {/* Date badge */}
      <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/5 text-primary">
        {event.date ? (
          <>
            <span className="text-lg font-semibold leading-none">
              {new Date(event.date).getDate()}
            </span>
            <span className="text-[10px] font-medium uppercase mt-0.5">
              {new Date(event.date).toLocaleDateString("ru", { month: "short" })}
            </span>
          </>
        ) : (
          <Calendar className="w-5 h-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {typeLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {event.person1 && event.person2 && (
            <span>{event.person1} & {event.person2}</span>
          )}
          {event.date && (
            <span className="flex items-center gap-1">
              {daysUntil !== null && daysUntil > 0 ? (
                `через ${formatDaysCount(daysUntil)}`
              ) : daysUntil === 0 ? (
                <span className="text-primary font-medium">Сегодня</span>
              ) : (
                formatDate(event.date)
              )}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="hidden md:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{stats.confirmedGuests}</span>
            <span className="text-xs">/ {stats.totalGuests}</span>
          </div>
        </div>
      )}

      {/* Status & arrow */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            event.status === "active" && "bg-emerald-500",
            event.status === "draft" && "bg-amber-500",
            event.status === "completed" && "bg-muted-foreground"
          )}
        />
        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
