"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  CheckSquare,
  Mail,
  Settings,
  Copy,
  Clock,
} from "lucide-react";
import { events } from "@/lib/api";
import { Event, EventStats } from "@/lib/types";
import {
  formatDate,
  getDaysUntil,
  formatDaysCount,
  eventTypeLabels,
  cn,
} from "@/lib/utils";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [eventData, statsData] = await Promise.all([
        events.get(eventId),
        events.getStats(eventId).catch(() => null),
      ]);
      setEvent(eventData);
      setStats(statsData || {
        totalGuests: 0,
        confirmedGuests: 0,
        declinedGuests: 0,
        pendingGuests: 0,
        totalPlusOnes: 0,
        plannedBudget: 0,
        actualBudget: 0,
        paidAmount: 0,
        checklistTotal: 0,
        checklistDone: 0,
      });
    } catch (error) {
      console.error("Failed to load event:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const copyInvitationLink = () => {
    if (event) {
      const link = `${window.location.origin}/i/${event.slug}`;
      navigator.clipboard.writeText(link);
      toast.success("Ссылка скопирована!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-base font-medium mb-2">Мероприятие не найдено</h2>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  const daysUntil = getDaysUntil(event.date);
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {typeLabel}
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                event.status === "active" && "text-emerald-600",
                event.status === "draft" && "text-amber-600",
                event.status === "completed" && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  event.status === "active" && "bg-emerald-500",
                  event.status === "draft" && "bg-amber-500",
                  event.status === "completed" && "bg-muted-foreground"
                )}
              />
              {event.status === "active" ? "Активно" : event.status === "draft" ? "Черновик" : "Завершено"}
            </span>
          </div>
          <h1 className="text-xl font-semibold">{event.title}</h1>
          {event.person1 && event.person2 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {event.person1} & {event.person2}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {event.status === "active" && (
            <button onClick={copyInvitationLink} className="btn-outline btn-sm">
              <Copy className="w-3.5 h-3.5" />
              Ссылка
            </button>
          )}
          <Link href={`/dashboard/events/${eventId}/settings`} className="btn-ghost btn-sm">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Event info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Дата</span>
          </div>
          <p className="font-medium text-sm">{event.date ? formatDate(event.date) : "Не указана"}</p>
          {daysUntil !== null && daysUntil > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">через {formatDaysCount(daysUntil)}</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Время</span>
          </div>
          <p className="font-medium text-sm">{event.time || "Не указано"}</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 border border-border/40 col-span-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">Место</span>
          </div>
          <p className="font-medium text-sm">{event.venue?.name || "Не указано"}</p>
          {event.venue?.address && (
            <p className="text-xs text-muted-foreground mt-0.5">{event.venue.address}</p>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/dashboard/events/${eventId}/guests`}
          className="group p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-semibold">{stats?.confirmedGuests || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">подтвердили из {stats?.totalGuests || 0}</p>
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/budget`}
          className="group p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-2xl font-semibold">
              {event.totalBudget > 0
                ? Math.round(((stats?.paidAmount || 0) / event.totalBudget) * 100)
                : 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">бюджета использовано</p>
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/checklist`}
          className="group p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="text-2xl font-semibold">
              {stats?.checklistDone || 0}/{stats?.checklistTotal || 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">задач выполнено</p>
        </Link>
      </div>

      {/* Invitation */}
      <Link
        href={`/dashboard/events/${eventId}/invitation`}
        className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary transition-colors">Приглашение</p>
            <p className="text-xs text-muted-foreground">
              {event.status === "active" ? "Активно — гости могут отвечать" : "Настройте и опубликуйте"}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Открыть →</span>
      </Link>
    </div>
  );
}
