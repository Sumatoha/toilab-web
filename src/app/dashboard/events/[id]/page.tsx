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
  AlertCircle,
  CalendarDays,
  Bell,
} from "lucide-react";
import { events, checklist, calendar } from "@/lib/api";
import { Event, EventStats, ChecklistItem, CalendarEvent } from "@/lib/types";
import { calendarEventTypeLabels } from "@/lib/utils";
import { formatDate, formatCurrency, getDaysUntil, eventTypeLabels, cn } from "@/lib/utils";
import { PageLoader, ProgressBar } from "@/components/ui";
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
  const [upcomingTasks, setUpcomingTasks] = useState<ChecklistItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventData, statsData, checklistData, calendarData] = await Promise.all([
          events.get(eventId),
          events.getStats(eventId).catch(() => null),
          checklist.list(eventId).catch(() => []),
          calendar.getUpcoming(eventId, 3).catch(() => []),
        ]);
        setEvent(eventData);
        setStats(statsData);
        setUpcomingEvents(calendarData || []);

        // Filter and sort upcoming deadlines
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = (checklistData || [])
          .filter((item: ChecklistItem) =>
            item.dueDate &&
            !item.isCompleted &&
            new Date(item.dueDate) >= now
          )
          .sort((a: ChecklistItem, b: ChecklistItem) =>
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
          )
          .slice(0, 3);
        setUpcomingTasks(upcoming);
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
  const taskProgress = stats?.checklistTotal ? (stats.checklistDone / stats.checklistTotal) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-gradient rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0">
                  {emoji}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-default text-xs">{typeLabel}</span>
                  <StatusBadge status={event.status} />
                </div>
              </div>
              <h1 className="text-display break-words">{event.title}</h1>
              {event.person1 && event.person2 && (
                <p className="text-sm sm:text-lg text-muted-foreground mt-1">{event.person1} & {event.person2}</p>
              )}
            </div>

            {event.status === "active" && (
              <div className="flex gap-2">
                <button onClick={copyLink} className="btn-outline btn-sm glass flex-1 sm:flex-none">
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Ссылка</span>
                </button>
                <Link
                  href={`/i/${event.slug}`}
                  target="_blank"
                  className="btn-primary btn-sm flex-1 sm:flex-none"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Открыть</span>
                </Link>
              </div>
            )}
          </div>

          {/* Countdown */}
          {daysUntil !== null && daysUntil > 0 && (
            <div className="mt-4 sm:mt-6 inline-flex items-center gap-3 bg-white/60 backdrop-blur rounded-xl px-3 sm:px-4 py-2 sm:py-3">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{daysUntil}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                дней до<br />мероприятия
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Guests Card */}
        <Link
          href={`/dashboard/events/${eventId}/guests`}
          className="card-interactive p-4 sm:p-6 group"
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="text-2xl sm:text-3xl font-bold">{stats?.confirmedGuests || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">гостей подтвердили</div>
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
          className="card-interactive p-4 sm:p-6 group"
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="text-xl sm:text-3xl font-bold">{formatCurrency(stats?.paidAmount || 0)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">потрачено</div>
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
          className="card-interactive p-4 sm:p-6 group"
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="text-2xl sm:text-3xl font-bold">
                {stats?.checklistDone || 0}/{stats?.checklistTotal || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">задач выполнено</div>
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

      {/* Upcoming Deadlines */}
      {upcomingTasks.length > 0 && (
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Ближайшие дедлайны
            </h3>
            <Link
              href={`/dashboard/events/${eventId}/checklist`}
              className="text-xs text-primary hover:underline"
            >
              Все задачи
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task) => {
              const dueDate = new Date(task.dueDate!);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = diffDays <= 3;
              const isToday = diffDays === 0;

              return (
                <Link
                  key={task.id}
                  href={`/dashboard/events/${eventId}/checklist`}
                  className={cn(
                    "flex items-center gap-3 p-2 sm:p-3 rounded-lg transition-colors",
                    isUrgent ? "bg-amber-50 hover:bg-amber-100" : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    isUrgent ? "bg-amber-200 text-amber-700" : "bg-primary/10 text-primary"
                  )}>
                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className={cn(
                      "text-xs",
                      isUrgent ? "text-amber-600 font-medium" : "text-muted-foreground"
                    )}>
                      {isToday
                        ? "Сегодня"
                        : diffDays === 1
                          ? "Завтра"
                          : `Через ${diffDays} дн.`
                      }
                      {" • "}
                      {dueDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {isUrgent && (
                    <div className="flex-shrink-0">
                      <span className="badge-warning text-xs">Срочно</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Calendar Events */}
      {upcomingEvents.length > 0 && (
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              Предстоящие события
            </h3>
            <Link
              href={`/dashboard/events/${eventId}/calendar`}
              className="text-xs text-primary hover:underline"
            >
              Календарь
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((calEvent) => {
              const eventDate = new Date(calEvent.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;
              const typeInfo = calendarEventTypeLabels[calEvent.type] || calendarEventTypeLabels.other;

              const bgColorClass = {
                blue: "bg-blue-100 text-blue-600",
                red: "bg-red-100 text-red-600",
                amber: "bg-amber-100 text-amber-600",
                slate: "bg-slate-100 text-slate-600",
              }[typeInfo.color] || "bg-slate-100 text-slate-600";

              const EventIcon = calEvent.type === "meeting" ? Users
                : calEvent.type === "deadline" ? AlertCircle
                : calEvent.type === "reminder" ? Bell
                : CalendarDays;

              return (
                <Link
                  key={calEvent.id}
                  href={`/dashboard/events/${eventId}/calendar`}
                  className={cn(
                    "flex items-center gap-3 p-2 sm:p-3 rounded-lg transition-colors",
                    isToday ? "bg-blue-50 hover:bg-blue-100" : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    bgColorClass
                  )}>
                    <EventIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{calEvent.title}</p>
                    <p className={cn(
                      "text-xs",
                      isToday ? "text-blue-600 font-medium" : "text-muted-foreground"
                    )}>
                      {isToday
                        ? "Сегодня"
                        : isTomorrow
                          ? "Завтра"
                          : `Через ${diffDays} дн.`
                      }
                      {calEvent.time && ` • ${calEvent.time}`}
                      {" • "}
                      {eventDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {isToday && (
                    <div className="flex-shrink-0">
                      <span className="badge-info text-xs">Сегодня</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Быстрые действия
        </h3>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Link href={`/dashboard/events/${eventId}/guests`} className="btn-outline btn-sm justify-center">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить</span> гостей
          </Link>
          <Link href={`/dashboard/events/${eventId}/budget`} className="btn-outline btn-sm justify-center">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить</span> расход
          </Link>
          <Link href={`/dashboard/events/${eventId}/checklist`} className="btn-outline btn-sm justify-center">
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить</span> задачу
          </Link>
          <Link href={`/dashboard/events/${eventId}/calendar`} className="btn-outline btn-sm justify-center">
            <CalendarDays className="w-4 h-4" />
            Календарь
          </Link>
          <Link href={`/dashboard/events/${eventId}/settings`} className="btn-outline btn-sm justify-center">
            <Pencil className="w-4 h-4" />
            <span className="sm:hidden">Изменить</span>
            <span className="hidden sm:inline">Редактировать</span>
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
      className={cn("card group hover:border-primary/20 transition-colors p-3 sm:p-4", className)}
    >
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
      <p className="text-sm sm:text-base font-medium truncate">{value}</p>
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
