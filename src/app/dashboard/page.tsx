"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Users,
  Wallet,
  CheckSquare,
  ChevronRight,
} from "lucide-react";
import { events } from "@/lib/api";
import { Event, EventStats } from "@/lib/types";
import { formatDate, getDaysUntil, eventTypeLabels } from "@/lib/utils";

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
      setEventList(data);

      // Load stats for each event
      const statsMap = new Map<string, EventStats>();
      await Promise.all(
        data.slice(0, 3).map(async (event) => {
          try {
            const eventStats = await events.getStats(event.id);
            statsMap.set(event.id, eventStats);
          } catch {
            // Ignore stats errors
          }
        })
      );
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Главная</h1>
          <p className="text-muted-foreground">
            Управляйте своими мероприятиями
          </p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary btn-md">
          <Plus className="w-5 h-5 mr-2" />
          Создать мероприятие
        </Link>
      </div>

      {/* Events grid */}
      {eventList.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Нет мероприятий</h2>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Создайте первое мероприятие и начните планирование
      </p>
      <Link href="/dashboard/events/new" className="btn-primary btn-md">
        <Plus className="w-5 h-5 mr-2" />
        Создать мероприятие
      </Link>
    </div>
  );
}

function EventCard({ event, stats }: { event: Event; stats?: EventStats }) {
  const daysUntil = getDaysUntil(event.date);
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;

  return (
    <Link href={`/dashboard/events/${event.id}`} className="card-hover group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
            {typeLabel}
          </span>
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          {event.person1 && event.person2 && (
            <p className="text-sm text-muted-foreground">
              {event.person1} & {event.person2}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Date */}
      {event.date && (
        <div className="flex items-center gap-2 text-sm mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{formatDate(event.date)}</span>
          {daysUntil !== null && daysUntil > 0 && (
            <span className="text-muted-foreground">
              (через {daysUntil} дн.)
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Users className="w-4 h-4 text-muted-foreground" />
              {stats.totalGuests}
            </div>
            <p className="text-xs text-muted-foreground">Гостей</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              {Math.round((stats.paidAmount / (event.totalBudget || 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Бюджет</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              {stats.checklistDone}/{stats.checklistTotal}
            </div>
            <p className="text-xs text-muted-foreground">Задач</p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-border">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            event.status === "active"
              ? "text-green-600"
              : event.status === "draft"
              ? "text-yellow-600"
              : "text-muted-foreground"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              event.status === "active"
                ? "bg-green-600"
                : event.status === "draft"
                ? "bg-yellow-600"
                : "bg-muted-foreground"
            }`}
          />
          {event.status === "active"
            ? "Активно"
            : event.status === "draft"
            ? "Черновик"
            : event.status === "completed"
            ? "Завершено"
            : "В архиве"}
        </span>
      </div>
    </Link>
  );
}
