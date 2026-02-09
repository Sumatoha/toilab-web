"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Wallet,
  CheckSquare,
  Copy,
  ExternalLink,
  Pencil,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { events } from "@/lib/api";
import { Event, EventStats } from "@/lib/types";
import { formatDate, formatCurrency, getDaysUntil, eventTypeLabels, cn } from "@/lib/utils";
import { PageLoader, ProgressBar, CircularProgress } from "@/components/ui";
import toast from "react-hot-toast";

const eventTypeEmojis: Record<string, string> = {
  wedding: "\u{1F48D}",
  birthday: "\u{1F382}",
  corporate: "\u{1F4BC}",
  other: "\u{1F389}",
};

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
    return <PageLoader />;
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
  const emoji = eventTypeEmojis[event.type] || eventTypeEmojis.other;
  const guestProgress = stats?.totalGuests ? (stats.confirmedGuests / stats.totalGuests) * 100 : 0;
  const budgetProgress = event.totalBudget ? ((stats?.paidAmount || 0) / event.totalBudget) * 100 : 0;
  const taskProgress = stats?.checklistTotal ? (stats.checklistDone / stats.checklistTotal) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-gradient rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center text-2xl shadow-sm">
                  {emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge-default">{typeLabel}</span>
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              </div>
              <h1 className="text-display">{event.title}</h1>
              {event.person1 && event.person2 && (
                <p className="text-lg text-muted-foreground mt-1">{event.person1} & {event.person2}</p>
              )}
            </div>

            {event.status === "active" && (
              <div className="flex gap-2">
                <button onClick={copyLink} className="btn-outline btn-sm glass">
                  <Copy className="w-4 h-4" />
                  Ссылка
                </button>
                <Link
                  href={`/i/${event.slug}`}
                  target="_blank"
                  className="btn-primary btn-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть
                </Link>
              </div>
            )}
          </div>

          {/* Countdown */}
          {daysUntil !== null && daysUntil > 0 && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/60 backdrop-blur rounded-xl px-4 py-3">
              <div className="text-3xl font-bold text-primary">{daysUntil}</div>
              <div className="text-sm text-muted-foreground">
                дней до<br />мероприятия
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard
          href={`/dashboard/events/${eventId}/settings`}
          icon={Calendar}
          label="Дата"
          value={event.date ? formatDate(event.date) : "Не указана"}
        />
        <InfoCard
          href={`/dashboard/events/${eventId}/settings`}
          icon={Clock}
          label="Время"
          value={event.time || "Не указано"}
        />
        <InfoCard
          href={`/dashboard/events/${eventId}/settings`}
          icon={MapPin}
          label="Место"
          value={event.venue?.name || "Не указано"}
          sublabel={event.venue?.address}
          className="col-span-2"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Guests Card */}
        <Link
          href={`/dashboard/events/${eventId}/guests`}
          className="card-interactive p-6 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold">{stats?.confirmedGuests || 0}</div>
              <div className="text-sm text-muted-foreground">гостей подтвердили</div>
            </div>
            <ProgressBar
              value={stats?.confirmedGuests || 0}
              max={stats?.totalGuests || 1}
              color="info"
              size="sm"
            />
            <div className="text-xs text-muted-foreground">
              из {stats?.totalGuests || 0} приглашённых
            </div>
          </div>
        </Link>

        {/* Budget Card */}
        <Link
          href={`/dashboard/events/${eventId}/budget`}
          className="card-interactive p-6 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(stats?.paidAmount || 0)}</div>
              <div className="text-sm text-muted-foreground">потрачено</div>
            </div>
            <ProgressBar
              value={stats?.paidAmount || 0}
              max={event.totalBudget || 1}
              color="success"
              size="sm"
            />
            <div className="text-xs text-muted-foreground">
              из {formatCurrency(event.totalBudget)} бюджета
            </div>
          </div>
        </Link>

        {/* Tasks Card */}
        <Link
          href={`/dashboard/events/${eventId}/checklist`}
          className="card-interactive p-6 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold">
                {stats?.checklistDone || 0}/{stats?.checklistTotal || 0}
              </div>
              <div className="text-sm text-muted-foreground">задач выполнено</div>
            </div>
            <ProgressBar
              value={stats?.checklistDone || 0}
              max={stats?.checklistTotal || 1}
              color="primary"
              size="sm"
            />
            <div className="text-xs text-muted-foreground">
              {Math.round(taskProgress)}% завершено
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Быстрые действия
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/events/${eventId}/guests`} className="btn-outline btn-sm">
            <Users className="w-4 h-4" />
            Добавить гостей
          </Link>
          <Link href={`/dashboard/events/${eventId}/budget`} className="btn-outline btn-sm">
            <Wallet className="w-4 h-4" />
            Добавить расход
          </Link>
          <Link href={`/dashboard/events/${eventId}/checklist`} className="btn-outline btn-sm">
            <CheckSquare className="w-4 h-4" />
            Добавить задачу
          </Link>
          <Link href={`/dashboard/events/${eventId}/settings`} className="btn-outline btn-sm">
            <Pencil className="w-4 h-4" />
            Редактировать
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  href,
  icon: Icon,
  label,
  value,
  sublabel,
  className,
}: {
  href: string;
  icon: typeof Calendar;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("card group hover:border-primary/20 transition-colors", className)}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium truncate">{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{sublabel}</p>
      )}
    </Link>
  );
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
