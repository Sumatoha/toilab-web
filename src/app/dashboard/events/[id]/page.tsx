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
import { formatDate, getDaysUntil, eventTypeLabels, cn } from "@/lib/utils";
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

  // Combine tasks and calendar events into unified timeline
  const timelineItems = [
    ...upcomingTasks.map(task => ({
      id: task.id,
      type: 'task' as const,
      title: task.title,
      date: new Date(task.dueDate!),
      time: undefined as string | undefined,
      category: task.category,
      data: task,
    })),
    ...upcomingEvents.map(event => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      date: new Date(event.date),
      time: event.time,
      eventType: event.type,
      data: event,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header - Clean & Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{event.title}</h1>
          <p className="text-muted-foreground">
            {typeLabel}
            {event.person1 && event.person2 && ` • ${event.person1} & ${event.person2}`}
          </p>
        </div>

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

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/dashboard/events/${eventId}/guests`}
          className="card p-4 hover:shadow-md hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">{stats?.confirmedGuests || 0}<span className="text-muted-foreground font-normal text-sm">/{stats?.totalGuests || 0}</span></div>
              <div className="text-xs text-muted-foreground">Гости</div>
            </div>
          </div>
          {guestProgress > 0 && (
            <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${guestProgress}%` }} />
            </div>
          )}
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/budget`}
          className="card p-4 hover:shadow-md hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">{Math.round(budgetProgress)}%</div>
              <div className="text-xs text-muted-foreground">Бюджет</div>
            </div>
          </div>
          {budgetProgress > 0 && (
            <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${budgetProgress}%` }} />
            </div>
          )}
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/checklist`}
          className="card p-4 hover:shadow-md hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">{stats?.checklistDone || 0}<span className="text-muted-foreground font-normal text-sm">/{stats?.checklistTotal || 0}</span></div>
              <div className="text-xs text-muted-foreground">Задачи</div>
            </div>
          </div>
          {taskProgress > 0 && (
            <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${taskProgress}%` }} />
            </div>
          )}
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Unified Timeline (Tasks + Calendar) */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">Предстоящее</h2>
            <div className="flex gap-2">
              <Link href={`/dashboard/events/${eventId}/checklist`} className="text-xs text-muted-foreground hover:text-primary">
                Задачи
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href={`/dashboard/events/${eventId}/calendar`} className="text-xs text-muted-foreground hover:text-primary">
                Календарь
              </Link>
            </div>
          </div>

          <div className="p-4">
            {timelineItems.length > 0 ? (
              <div className="space-y-2">
                {timelineItems.map((item) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const itemDate = new Date(item.date);
                  itemDate.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isToday = diffDays === 0;
                  const isUrgent = diffDays > 0 && diffDays <= 3;
                  const isPast = diffDays < 0;

                  const href = item.type === 'task'
                    ? `/dashboard/events/${eventId}/checklist?task=${item.id}`
                    : `/dashboard/events/${eventId}/calendar`;

                  const ItemIcon = item.type === 'task' ? CheckSquare
                    : item.eventType === 'meeting' ? Users
                    : item.eventType === 'deadline' ? AlertCircle
                    : item.eventType === 'reminder' ? Bell
                    : CalendarDays;

                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-secondary/50",
                        isToday && "bg-primary/5 border border-primary/20",
                        isPast && "opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        item.type === 'task'
                          ? (isToday ? "bg-primary text-white" : isPast ? "bg-destructive/10 text-destructive" : isUrgent ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground")
                          : (isToday ? "bg-primary text-white" : "bg-blue-100 text-blue-600")
                      )}>
                        <ItemIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-medium text-sm truncate", isPast && "text-muted-foreground")}>
                            {item.title}
                          </p>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0",
                            item.type === 'task' ? "bg-secondary text-muted-foreground" : "bg-blue-50 text-blue-600"
                          )}>
                            {item.type === 'task' ? 'задача' : 'событие'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? "Сегодня" : diffDays === 1 ? "Завтра" : isPast ? `${Math.abs(diffDays)} дн. назад` : item.date.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
                          {item.time && ` • ${item.time}`}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">Нет предстоящих дел</p>
                <div className="flex gap-2 justify-center">
                  <Link href={`/dashboard/events/${eventId}/checklist`} className="btn-outline btn-sm">
                    Добавить задачу
                  </Link>
                  <Link href={`/dashboard/events/${eventId}/calendar`} className="btn-outline btn-sm">
                    Добавить событие
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Последние действия</h2>
          </div>
          <div className="p-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((log) => (
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
      </div>
    </div>
  );
}

// Activity action configurations
const activityConfig: Record<string, { icon: LucideIcon; color: string; getText: (log: ActivityLog) => string }> = {
  // Guest actions
  guest_added: { icon: UserPlus, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Добавлен гость: ${log.entityName || ""}` },
  guest_updated: { icon: Users, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён гость: ${log.entityName || ""}` },
  guest_deleted: { icon: Users, color: "text-red-600 bg-red-100", getText: (log) => `Удалён гость: ${log.entityName || ""}` },
  guest_rsvp: { icon: UserCheck, color: "text-emerald-600 bg-emerald-100", getText: (log) => `RSVP: ${log.entityName || ""} ${log.details || ""}` },

  // Expense actions
  expense_added: { icon: Wallet, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлен расход: ${log.entityName || ""}` },
  expense_updated: { icon: Wallet, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён расход: ${log.entityName || ""}` },
  expense_paid: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Оплачено: ${log.entityName || ""} ${log.details || ""}` },
  expense_deleted: { icon: Wallet, color: "text-red-600 bg-red-100", getText: (log) => `Удалён расход: ${log.entityName || ""}` },

  // Task/checklist actions
  task_completed: { icon: CheckSquare, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Выполнено: ${log.entityName || ""}` },
  task_added: { icon: CheckSquare, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлена задача: ${log.entityName || ""}` },
  task_updated: { icon: CheckSquare, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлена задача: ${log.entityName || ""}` },
  task_deleted: { icon: CheckSquare, color: "text-red-600 bg-red-100", getText: (log) => `Удалена задача: ${log.entityName || ""}` },
  checklist_added: { icon: CheckSquare, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлена задача: ${log.entityName || ""}` },
  checklist_updated: { icon: CheckSquare, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлена задача: ${log.entityName || ""}` },
  checklist_deleted: { icon: CheckSquare, color: "text-red-600 bg-red-100", getText: (log) => `Удалена задача: ${log.entityName || ""}` },

  // Program actions
  program_item_added: { icon: FileText, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Программа: добавлено "${log.entityName || ""}"` },
  program_item_updated: { icon: FileText, color: "text-blue-600 bg-blue-100", getText: (log) => `Программа: изменено "${log.entityName || ""}"` },
  program_item_deleted: { icon: FileText, color: "text-red-600 bg-red-100", getText: (log) => `Программа: удалено "${log.entityName || ""}"` },
  program_added: { icon: FileText, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Программа: добавлено "${log.entityName || ""}"` },
  program_updated: { icon: FileText, color: "text-blue-600 bg-blue-100", getText: (log) => `Программа: изменено "${log.entityName || ""}"` },
  program_deleted: { icon: FileText, color: "text-red-600 bg-red-100", getText: (log) => `Программа: удалено "${log.entityName || ""}"` },

  // Vendor actions
  vendor_added: { icon: Users, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Добавлен подрядчик: ${log.entityName || ""}` },
  vendor_updated: { icon: Users, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён подрядчик: ${log.entityName || ""}` },
  vendor_paid: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Оплата подрядчику: ${log.entityName || ""} ${log.details || ""}` },
  vendor_deleted: { icon: Users, color: "text-red-600 bg-red-100", getText: (log) => `Удалён подрядчик: ${log.entityName || ""}` },

  // Seating/table actions
  table_added: { icon: LayoutGrid, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Рассадка: добавлен ${log.entityName || "стол"}` },
  table_updated: { icon: LayoutGrid, color: "text-blue-600 bg-blue-100", getText: (log) => `Рассадка: изменён ${log.entityName || "стол"}` },
  table_deleted: { icon: LayoutGrid, color: "text-red-600 bg-red-100", getText: (log) => `Рассадка: удалён ${log.entityName || "стол"}` },
  guest_seated: { icon: LayoutGrid, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Рассажен гость: ${log.entityName || ""}` },
  seating_added: { icon: LayoutGrid, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Рассадка: добавлен ${log.entityName || "стол"}` },
  seating_updated: { icon: LayoutGrid, color: "text-blue-600 bg-blue-100", getText: (log) => `Рассадка: изменён ${log.entityName || "стол"}` },
  seating_deleted: { icon: LayoutGrid, color: "text-red-600 bg-red-100", getText: (log) => `Рассадка: удалён ${log.entityName || "стол"}` },

  // Gift actions
  gift_added: { icon: GiftIcon, color: "text-pink-600 bg-pink-100", getText: (log) => `Подарок от ${log.entityName || ""}` },
  gift_deleted: { icon: GiftIcon, color: "text-red-600 bg-red-100", getText: (log) => `Удалён подарок: ${log.entityName || ""}` },
  gift_updated: { icon: GiftIcon, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлён подарок: ${log.entityName || ""}` },

  // Calendar actions
  calendar_event_added: { icon: CalendarDays, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Событие: ${log.entityName || ""}` },
  calendar_event_completed: { icon: CalendarDays, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Завершено: ${log.entityName || ""}` },
  calendar_event_updated: { icon: CalendarDays, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлено событие: ${log.entityName || ""}` },
  calendar_event_deleted: { icon: CalendarDays, color: "text-red-600 bg-red-100", getText: (log) => `Удалено событие: ${log.entityName || ""}` },
  calendar_added: { icon: CalendarDays, color: "text-indigo-600 bg-indigo-100", getText: (log) => `Событие: ${log.entityName || ""}` },
  calendar_updated: { icon: CalendarDays, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлено событие: ${log.entityName || ""}` },
  calendar_deleted: { icon: CalendarDays, color: "text-red-600 bg-red-100", getText: (log) => `Удалено событие: ${log.entityName || ""}` },

  // Event actions
  event_created: { icon: Calendar, color: "text-emerald-600 bg-emerald-100", getText: (log) => `Создано мероприятие${log.entityName ? `: ${log.entityName}` : ""}` },
  event_updated: { icon: Settings, color: "text-blue-600 bg-blue-100", getText: (log) => `Обновлены настройки${log.details ? ` ${log.details}` : ""}` },
  event_deleted: { icon: Settings, color: "text-red-600 bg-red-100", getText: () => `Удалено мероприятие` },

  // Share actions
  share_link_created: { icon: Link2, color: "text-indigo-600 bg-indigo-100", getText: () => `Создана ссылка для доступа` },
  share_created: { icon: Link2, color: "text-indigo-600 bg-indigo-100", getText: () => `Создана ссылка для доступа` },
  share_deleted: { icon: Link2, color: "text-red-600 bg-red-100", getText: () => `Удалена ссылка для доступа` },
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

