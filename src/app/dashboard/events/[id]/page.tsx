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
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { events, checklist, calendar } from "@/lib/api";
import { Event, EventStats, ChecklistItem, CalendarEvent } from "@/lib/types";
import { calendarEventTypeLabels } from "@/lib/utils";
import { formatDate, formatCurrency, getDaysUntil, eventTypeLabels, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui";
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
          calendar.getUpcoming(eventId, 5).catch(() => []),
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
  const budgetProgress = event.totalBudget ? ((stats?.paidAmount || 0) / event.totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section with Glassmorphism */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />

        <div className="relative z-10 p-5 sm:p-8">
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-black/10">
                  {emoji}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      {typeLabel}
                    </span>
                    <StatusBadge status={event.status} />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {event.title}
                  </h1>
                  {event.person1 && event.person2 && (
                    <p className="text-white/80 text-sm sm:text-base mt-0.5">
                      {event.person1} & {event.person2}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown Badge */}
            {daysUntil !== null && daysUntil > 0 && (
              <div className="flex items-center gap-4">
                <div className="glass-card rounded-2xl px-5 py-3 inline-flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white">{daysUntil}</div>
                    <div className="text-xs text-white/70 uppercase tracking-wider">дней</div>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div className="text-sm text-white/80">
                    до мероприятия
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {event.status === "active" && (
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium backdrop-blur-sm transition-all duration-200"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Копировать ссылку</span>
                  <span className="sm:hidden">Ссылка</span>
                </button>
                <Link
                  href={`/i/${event.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary text-sm font-medium shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Открыть приглашение</span>
                  <span className="sm:hidden">Открыть</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Info Pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/events/${eventId}/settings`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
        >
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{event.date ? formatDate(event.date) : "Дата не указана"}</span>
        </Link>
        <Link
          href={`/dashboard/events/${eventId}/settings`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
        >
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{event.time || "Время не указано"}</span>
        </Link>
        {event.venue?.name && (
          <Link
            href={`/dashboard/events/${eventId}/settings`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{event.venue.name}</span>
          </Link>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Guests Card */}
            <Link
              href={`/dashboard/events/${eventId}/guests`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Users className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-3xl font-bold">{stats?.confirmedGuests || 0}</div>
              <div className="text-blue-100 text-sm">из {stats?.totalGuests || 0} гостей</div>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${stats?.totalGuests ? (stats.confirmedGuests / stats.totalGuests) * 100 : 0}%` }}
                />
              </div>
            </Link>

            {/* Budget Card */}
            <Link
              href={`/dashboard/events/${eventId}/budget`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Wallet className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats?.paidAmount || 0)}</div>
              <div className="text-emerald-100 text-sm">из {formatCurrency(event.totalBudget)}</div>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                />
              </div>
            </Link>

            {/* Tasks Card */}
            <Link
              href={`/dashboard/events/${eventId}/checklist`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-5 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CheckSquare className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-3xl font-bold">{Math.round(taskProgress)}%</div>
              <div className="text-violet-100 text-sm">{stats?.checklistDone || 0} из {stats?.checklistTotal || 0} задач</div>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </Link>
          </div>

          {/* Upcoming Deadlines */}
          {upcomingTasks.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold">Ближайшие дедлайны</h3>
                </div>
                <Link
                  href={`/dashboard/events/${eventId}/checklist`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Все задачи
                </Link>
              </div>
              <div className="space-y-3">
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
                        "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01]",
                        isUrgent
                          ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50"
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        isUrgent ? "bg-amber-500 text-white" : "bg-primary/10 text-primary"
                      )}>
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className={cn(
                          "text-sm",
                          isUrgent ? "text-amber-600" : "text-muted-foreground"
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
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
                          Срочно
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold">Быстрые действия</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickActionButton
                href={`/dashboard/events/${eventId}/guests`}
                icon={Users}
                label="Гости"
                color="blue"
              />
              <QuickActionButton
                href={`/dashboard/events/${eventId}/budget`}
                icon={Wallet}
                label="Бюджет"
                color="emerald"
              />
              <QuickActionButton
                href={`/dashboard/events/${eventId}/checklist`}
                icon={CheckSquare}
                label="Задачи"
                color="violet"
              />
              <QuickActionButton
                href={`/dashboard/events/${eventId}/calendar`}
                icon={CalendarDays}
                label="Календарь"
                color="rose"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/dashboard/events/${eventId}/settings`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/50 text-sm font-medium transition-all duration-200"
              >
                <Pencil className="w-4 h-4" />
                Редактировать
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          {/* Timeline Widget */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">Предстоящие события</h3>
              </div>
              <Link
                href={`/dashboard/events/${eventId}/calendar`}
                className="text-sm text-primary hover:underline font-medium"
              >
                Все
              </Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-transparent rounded-full" />

                <div className="space-y-4">
                  {upcomingEvents.map((calEvent) => {
                    const eventDate = new Date(calEvent.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isToday = diffDays === 0;
                    const isTomorrow = diffDays === 1;
                    const typeInfo = calendarEventTypeLabels[calEvent.type] || calendarEventTypeLabels.other;

                    const EventIcon = calEvent.type === "meeting" ? Users
                      : calEvent.type === "deadline" ? AlertCircle
                      : calEvent.type === "reminder" ? Bell
                      : CalendarDays;

                    const colorClasses = {
                      blue: "bg-blue-500",
                      red: "bg-red-500",
                      amber: "bg-amber-500",
                      slate: "bg-slate-500",
                    };

                    return (
                      <Link
                        key={calEvent.id}
                        href={`/dashboard/events/${eventId}/calendar`}
                        className="relative flex items-start gap-4 pl-10 group"
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background transition-transform duration-200 group-hover:scale-110",
                          colorClasses[typeInfo.color as keyof typeof colorClasses] || "bg-slate-500"
                        )}>
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>

                        {/* Content */}
                        <div className={cn(
                          "flex-1 p-3 rounded-xl transition-all duration-200 group-hover:shadow-md",
                          isToday
                            ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
                            : "bg-secondary/50 group-hover:bg-secondary"
                        )}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{calEvent.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                  "text-xs font-medium",
                                  isToday ? "text-primary" : "text-muted-foreground"
                                )}>
                                  {isToday
                                    ? "Сегодня"
                                    : isTomorrow
                                      ? "Завтра"
                                      : eventDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })
                                  }
                                </span>
                                {calEvent.time && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">{calEvent.time}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              `bg-${typeInfo.color}-100 text-${typeInfo.color}-600`
                            )}>
                              <EventIcon className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">Нет предстоящих событий</p>
                <Link
                  href={`/dashboard/events/${eventId}/calendar`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2 font-medium"
                >
                  Добавить событие
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Budget Summary Mini */}
          <Link
            href={`/dashboard/events/${eventId}/budget`}
            className="card p-5 group hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold">Бюджет</h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-2xl font-bold">{formatCurrency(stats?.paidAmount || 0)}</span>
                  <span className="text-sm text-muted-foreground">/ {formatCurrency(event.totalBudget)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      budgetProgress > 90 ? "bg-red-500" : budgetProgress > 70 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Осталось</span>
                <span className={cn(
                  "font-medium",
                  (event.totalBudget - (stats?.paidAmount || 0)) < 0 ? "text-red-500" : "text-emerald-600"
                )}>
                  {formatCurrency(event.totalBudget - (stats?.paidAmount || 0))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-primary mt-4 font-medium group-hover:gap-2 transition-all duration-200">
              Подробнее
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  color: "blue" | "emerald" | "violet" | "rose";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white",
    emerald: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
    violet: "bg-violet-100 text-violet-600 group-hover:bg-violet-500 group-hover:text-white",
    rose: "bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white",
  };

  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
        colorClasses[color]
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-100 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Активно
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-100 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Черновик
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white/80 backdrop-blur-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
      Завершено
    </span>
  );
}
