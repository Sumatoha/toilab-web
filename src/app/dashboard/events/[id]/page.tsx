"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, Wallet, CheckSquare, Copy, ExternalLink } from "lucide-react";
import { events } from "@/lib/api";
import { Event, EventStats } from "@/lib/types";
import { formatDate, formatCurrency, getDaysUntil, eventTypeLabels } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventData, statsData] = await Promise.all([
          events.get(eventId),
          events.getStats(eventId).catch(() => null),
        ]);
        setEvent(eventData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load event:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const copyLink = () => {
    if (event) {
      navigator.clipboard.writeText(`${window.location.origin}/i/${event.slug}`);
      toast.success("Ссылка скопирована");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Мероприятие не найдено</p>
        <Link href="/dashboard" className="text-sm underline mt-2 inline-block">
          Назад
        </Link>
      </div>
    );
  }

  const daysUntil = getDaysUntil(event.date);
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-default">{typeLabel}</span>
            <StatusBadge status={event.status} />
          </div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          {event.person1 && event.person2 && (
            <p className="text-muted-foreground mt-1">{event.person1} & {event.person2}</p>
          )}
        </div>

        {event.status === "active" && (
          <div className="flex gap-2">
            <button onClick={copyLink} className="btn-outline btn-sm">
              <Copy className="w-4 h-4" />
              Ссылка
            </button>
            <Link
              href={`/i/${event.slug}`}
              target="_blank"
              className="btn-outline btn-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть
            </Link>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <Calendar className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Дата</p>
          <p className="font-medium">{event.date ? formatDate(event.date) : "Не указана"}</p>
          {daysUntil !== null && daysUntil > 0 && (
            <p className="text-xs text-muted-foreground mt-1">через {daysUntil} дн.</p>
          )}
        </div>

        <div className="card">
          <Clock className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Время</p>
          <p className="font-medium">{event.time || "Не указано"}</p>
        </div>

        <div className="card col-span-2">
          <MapPin className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Место</p>
          <p className="font-medium">{event.venue?.name || "Не указано"}</p>
          {event.venue?.address && (
            <p className="text-xs text-muted-foreground mt-1">{event.venue.address}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Link href={`/dashboard/events/${eventId}/guests`} className="card hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-semibold">{stats?.confirmedGuests || 0}</span>
          </div>
          <p className="text-sm text-muted-foreground">гостей подтвердили</p>
          <p className="text-xs text-muted-foreground">из {stats?.totalGuests || 0}</p>
        </Link>

        <Link href={`/dashboard/events/${eventId}/budget`} className="card hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-semibold">{formatCurrency(stats?.paidAmount || 0)}</span>
          </div>
          <p className="text-sm text-muted-foreground">потрачено</p>
          <p className="text-xs text-muted-foreground">из {formatCurrency(event.totalBudget)}</p>
        </Link>

        <Link href={`/dashboard/events/${eventId}/checklist`} className="card hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-semibold">{stats?.checklistDone || 0}/{stats?.checklistTotal || 0}</span>
          </div>
          <p className="text-sm text-muted-foreground">задач выполнено</p>
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <span className="badge-success">Активно</span>;
  if (status === "draft") return <span className="badge-warning">Черновик</span>;
  return <span className="badge-default">Завершено</span>;
}
