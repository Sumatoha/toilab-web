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
  ArrowRight,
  AlertCircle,
  CalendarDays,
  Bell,
  ChevronRight,
  UserPlus,
  UserCheck,
  CreditCard,
  LayoutGrid,
  Gift as GiftIcon,
  FileText,
  Settings,
  Link2,
  LucideIcon,
} from "lucide-react";
import { events, checklist, calendar, activity } from "@/lib/api";
import { Event, EventStats, ChecklistItem, CalendarEvent, ActivityLog } from "@/lib/types";
import { formatDate, formatCurrency, getDaysUntil, eventTypeLabels, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<ChecklistItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventData, statsData, checklistData, calendarData, activityData] = await Promise.all([
          events.get(eventId),
          events.getStats(eventId).catch(() => null),
          checklist.list(eventId).catch(() => []),
          calendar.getUpcoming(eventId, 5).catch(() => []),
          activity.list(eventId, 5).catch(() => []),
        ]);
        setEvent(eventData);
        setStats(statsData);
        setUpcomingEvents(calendarData || []);
        setRecentActivity(activityData || []);

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
          .slice(0, 5);
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
  const taskProgress = stats?.checklistTotal ? Math.round((stats.checklistDone / stats.checklistTotal) * 100) : 0;
  const budgetProgress = event.totalBudget > 0 ? Math.round(((stats?.paidAmount || 0) / event.totalBudget) * 100) : 0;
  const guestProgress = stats?.totalGuests ? Math.round(((stats?.confirmedGuests || 0) / stats.totalGuests) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header - Clean & Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.title}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-muted-foreground">
            {typeLabel}
            {event.person1 && event.person2 && ` • ${event.person1} & ${event.person2}`}
          </p>
        </div>

        {event.status === "active" && (
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="btn-outline btn-sm"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Скопировать</span>
            </button>
            <Link
              href={`/i/${event.slug}`}
              target="_blank"
              className="btn-primary btn-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Открыть</span>
            </Link>
          </div>
        )}
      </div>

      {/* Event Info Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{event.date ? formatDate(event.date) : "Дата не указана"}</span>
        </div>
        {event.time && (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{event.time}</span>
          </div>
        )}
        {event.venue?.name && (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{event.venue.name}</span>
          </div>
        )}
        {daysUntil !== null && daysUntil > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            <span>{daysUntil} {daysUntil === 1 ? "день" : daysUntil < 5 ? "дня" : "дней"} до события</span>
          </div>
        )}
      </div>

      {/* Stats Cards - Monochrome */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          href={`/dashboard/events/${eventId}/guests`}
          icon={Users}
          value={stats?.confirmedGuests || 0}
          total={stats?.totalGuests || 0}
          label="Гости"
          progress={guestProgress}
        />
        <StatCard
          href={`/dashboard/events/${eventId}/budget`}
          icon={Wallet}
          value={formatCurrency(stats?.paidAmount || 0)}
          total={formatCurrency(event.totalBudget)}
          label="Бюджет"
          progress={budgetProgress}
        />
        <StatCard
          href={`/dashboard/events/${eventId}/checklist`}
          icon={CheckSquare}
          value={stats?.checklistDone || 0}
          total={stats?.checklistTotal || 0}
          label="Задачи"
          progress={taskProgress}
        />
        <StatCard
          href={`/dashboard/events/${eventId}/calendar`}
          icon={CalendarDays}
          value={upcomingEvents.length}
          label="События"
          sublabel="предстоящих"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Tasks - Clean Timeline */}
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">Предстоящие этапы</h2>
            <Link
              href={`/dashboard/events/${eventId}/checklist`}
              className="text-sm text-primary hover:underline"
            >
              Все задачи
            </Link>
          </div>

          <div className="p-4">
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const dueDate = new Date(task.dueDate!);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isToday = diffDays === 0;
                  const isUrgent = diffDays <= 3 && diffDays > 0;
                  const isPast = diffDays < 0;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-secondary/50",
                        isToday && "bg-primary/5",
                        isPast && "bg-destructive/5"
                      )}
                    >
                      {/* Status indicator */}
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        isToday ? "bg-primary" :
                        isPast ? "bg-destructive" :
                        isUrgent ? "bg-warning" :
                        "bg-muted-foreground/30"
                      )} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm truncate",
                          isPast && "text-destructive"
                        )}>
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.category && `${task.category} • `}
                          {isToday ? "Сегодня" :
                           diffDays === 1 ? "Завтра" :
                           isPast ? `${Math.abs(diffDays)} дн. назад` :
                           `Через ${diffDays} дн.`}
                        </p>
                      </div>

                      {/* Date badge */}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {dueDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">Нет предстоящих задач</p>
                <Link
                  href={`/dashboard/events/${eventId}/checklist`}
                  className="btn-primary btn-sm inline-flex"
                >
                  Добавить задачу
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity & Calendar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="card">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Последние действия</h2>
            </div>
            <div className="p-4">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 3).map((log) => (
                    <ActivityItem key={log.id} log={log} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Пока нет действий
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Calendar Events */}
          {upcomingEvents.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold">Ближайшие события</h2>
                <Link
                  href={`/dashboard/events/${eventId}/calendar`}
                  className="text-sm text-primary hover:underline"
                >
                  Все
                </Link>
              </div>

              <div className="divide-y divide-border">
                {upcomingEvents.slice(0, 3).map((calEvent) => {
                  const eventDate = new Date(calEvent.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isToday = diffDays === 0;

                  const EventIcon = calEvent.type === "meeting" ? Users
                    : calEvent.type === "deadline" ? AlertCircle
                    : calEvent.type === "reminder" ? Bell
                    : CalendarDays;

                  return (
                    <Link
                      key={calEvent.id}
                      href={`/dashboard/events/${eventId}/calendar`}
                      className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        isToday ? "bg-primary text-white" : "bg-secondary"
                      )}>
                        <EventIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{calEvent.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? "Сегодня" :
                           diffDays === 1 ? "Завтра" :
                           eventDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
                          {calEvent.time && ` • ${calEvent.time}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  href,
  icon: Icon,
  value,
  total,
  label,
  sublabel,
  progress,
}: {
  href: string;
  icon: typeof Users;
  value: string | number;
  total?: string | number;
  label: string;
  sublabel?: string;
  progress?: number;
}) {
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-md hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">
          {label}
          {total !== undefined && <span className="opacity-60"> из {total}</span>}
          {sublabel && <span className="opacity-60"> {sublabel}</span>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}

// Activity action configurations
const activityConfig: Record<string, { icon: LucideIcon; color: string; getText: (log: ActivityLog) => string }> = {
  guest_added: { icon: UserPlus, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Добавлен гость: ${log.entityName || ""}` },
  guest_updated: { icon: Users, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён гость: ${log.entityName || ""}` },
  guest_deleted: { icon: Users, color: "text-red-600 bg-red-100", getText: (log) => `Удалён гость: ${log.entityName || ""}` },
  guest_rsvp: { icon: UserCheck, color: "text-emerald-600 bg-emerald-100", getText: (log) => `RSVP: ${log.entityName || ""} ${log.details || ""}` },
  expense_added: { icon: Wallet, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлен расход: ${log.entityName || ""}` },
  expense_updated: { icon: Wallet, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён расход: ${log.entityName || ""}` },
  expense_paid: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Оплачено: ${log.entityName || ""} ${log.details || ""}` },
  expense_deleted: { icon: Wallet, color: "text-red-600 bg-red-100", getText: (log) => `Удалён расход: ${log.entityName || ""}` },
  task_completed: { icon: CheckSquare, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Выполнено: ${log.entityName || ""}` },
  task_added: { icon: CheckSquare, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлена задача: ${log.entityName || ""}` },
  task_updated: { icon: CheckSquare, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлена задача: ${log.entityName || ""}` },
  task_deleted: { icon: CheckSquare, color: "text-red-600 bg-red-100", getText: (log) => `Удалена задача: ${log.entityName || ""}` },
  program_item_added: { icon: FileText, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Программа: добавлено "${log.entityName || ""}"` },
  program_item_updated: { icon: FileText, color: "text-blue-600 bg-blue-100", getText: (log) => `Программа: изменено "${log.entityName || ""}"` },
  program_item_deleted: { icon: FileText, color: "text-red-600 bg-red-100", getText: (log) => `Программа: удалено "${log.entityName || ""}"` },
  vendor_added: { icon: Users, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлен подрядчик: ${log.entityName || ""}` },
  vendor_updated: { icon: Users, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён подрядчик: ${log.entityName || ""}` },
  vendor_paid: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Оплата подрядчику: ${log.entityName || ""} ${log.details || ""}` },
  vendor_deleted: { icon: Users, color: "text-red-600 bg-red-100", getText: (log) => `Удалён подрядчик: ${log.entityName || ""}` },
  table_added: { icon: LayoutGrid, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Рассадка: добавлен ${log.entityName || "стол"}` },
  table_updated: { icon: LayoutGrid, color: "text-blue-600 bg-blue-100", getText: (log) => `Рассадка: изменён ${log.entityName || "стол"}` },
  table_deleted: { icon: LayoutGrid, color: "text-red-600 bg-red-100", getText: (log) => `Рассадка: удалён ${log.entityName || "стол"}` },
  guest_seated: { icon: LayoutGrid, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Рассажен гость: ${log.entityName || ""}` },
  gift_added: { icon: GiftIcon, color: "text-pink-600 bg-pink-100", getText: (log) => `Подарок от ${log.entityName || ""}` },
  gift_deleted: { icon: GiftIcon, color: "text-red-600 bg-red-100", getText: (log) => `Удалён подарок: ${log.entityName || ""}` },
  calendar_event_added: { icon: CalendarDays, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Событие: ${log.entityName || ""}` },
  calendar_event_completed: { icon: CalendarDays, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Завершено: ${log.entityName || ""}` },
  event_updated: { icon: Settings, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлены настройки ${log.details || ""}` },
  share_link_created: { icon: Link2, color: "text-indigo-600 bg-indigo-100", getText: () => `Создана ссылка для доступа` },
};

function ActivityItem({ log }: { log: ActivityLog }) {
  const config = activityConfig[log.action] || {
    icon: Clock,
    color: "text-gray-600 bg-gray-100",
    getText: () => log.action,
  };
  const Icon = config.icon;
  const text = config.getText(log);

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return then.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex items-start gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.color.split(" ")[1])}>
        <Icon className={cn("w-4 h-4", config.color.split(" ")[0])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{text}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Активно
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Черновик
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      Завершено
    </span>
  );
}
