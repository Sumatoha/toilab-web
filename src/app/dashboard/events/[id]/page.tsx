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
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { events, checklist, calendar, activity, shares } from "@/lib/api";
import { Event, EventStats, ChecklistItem, CalendarEvent, ActivityLog, ShareLink, ShareWidget } from "@/lib/types";
import { formatDate, getDaysUntil, cn } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { t } = useTranslation();

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<ChecklistItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

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

  if (isLoading) {
    return <PageLoader />;
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("errors.eventNotFound")}</p>
        <Link href="/dashboard" className="text-sm underline mt-2 inline-block">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const daysUntil = getDaysUntil(event.date);
  const typeLabel = t(`event.${event.type}`);
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

        <button
          onClick={() => setShowShareModal(true)}
          className="btn-outline btn-sm"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.share")}</span>
        </button>
      </div>

      {/* Event Info Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{event.date ? formatDate(event.date) : t("common.dateNotSet")}</span>
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
            <span>{daysUntil} {t("dashboard.daysLeft")}</span>
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
              <div className="text-xs text-muted-foreground">{t("event.overview.stats.guests")}</div>
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
              <div className="text-xs text-muted-foreground">{t("event.overview.stats.budget")}</div>
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
              <div className="text-xs text-muted-foreground">{t("event.overview.stats.tasks")}</div>
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
            <h2 className="font-semibold">{t("event.overview.timeline")}</h2>
            <div className="flex gap-2">
              <Link href={`/dashboard/events/${eventId}/checklist`} className="text-xs text-muted-foreground hover:text-primary">
                {t("nav.checklist")}
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href={`/dashboard/events/${eventId}/calendar`} className="text-xs text-muted-foreground hover:text-primary">
                {t("nav.calendar")}
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
                            {item.type === 'task' ? t("checklist.title").toLowerCase() : t("calendar.title").toLowerCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? t("calendar.today") : diffDays === 1 ? t("common.next") : isPast ? `${Math.abs(diffDays)} ${t("dashboard.daysLeft")}` : item.date.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
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
                <p className="text-muted-foreground text-sm mb-3">{t("event.overview.noUpcoming")}</p>
                <div className="flex gap-2 justify-center">
                  <Link href={`/dashboard/events/${eventId}/checklist`} className="btn-outline btn-sm">
                    {t("checklist.addTask")}
                  </Link>
                  <Link href={`/dashboard/events/${eventId}/calendar`} className="btn-outline btn-sm">
                    {t("calendar.addEvent")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">{t("event.overview.activity")}</h2>
          </div>
          <div className="p-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((log) => (
                  <ActivityItem key={log.id} log={log} t={t} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("event.overview.noActivity")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Share Modal */}
      <QuickShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        eventId={eventId}
        t={t}
      />
    </div>
  );
}

// Activity action configurations
const activityConfig: Record<string, { icon: LucideIcon; color: string }> = {
  // Guest actions
  guest_added: { icon: UserPlus, color: "text-emerald-600 bg-emerald-100" },
  guest_updated: { icon: Users, color: "text-blue-600 bg-blue-100" },
  guest_deleted: { icon: Users, color: "text-red-600 bg-red-100" },
  guest_rsvp: { icon: UserCheck, color: "text-emerald-600 bg-emerald-100" },

  // Expense actions
  expense_added: { icon: Wallet, color: "text-indigo-600 bg-indigo-100" },
  expense_updated: { icon: Wallet, color: "text-blue-600 bg-blue-100" },
  expense_paid: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100" },
  expense_deleted: { icon: Wallet, color: "text-red-600 bg-red-100" },

  // Task/checklist actions
  task_completed: { icon: CheckSquare, color: "text-emerald-600 bg-emerald-100" },
  task_added: { icon: CheckSquare, color: "text-indigo-600 bg-indigo-100" },
  task_updated: { icon: CheckSquare, color: "text-blue-600 bg-blue-100" },
  task_deleted: { icon: CheckSquare, color: "text-red-600 bg-red-100" },

  // Program actions
  program_item_added: { icon: FileText, color: "text-indigo-600 bg-indigo-100" },
  program_item_updated: { icon: FileText, color: "text-blue-600 bg-blue-100" },
  program_item_deleted: { icon: FileText, color: "text-red-600 bg-red-100" },

  // Vendor actions
  vendor_added: { icon: Users, color: "text-indigo-600 bg-indigo-100" },
  vendor_updated: { icon: Users, color: "text-blue-600 bg-blue-100" },
  vendor_paid: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100" },
  vendor_deleted: { icon: Users, color: "text-red-600 bg-red-100" },

  // Seating/table actions
  table_added: { icon: LayoutGrid, color: "text-indigo-600 bg-indigo-100" },
  table_updated: { icon: LayoutGrid, color: "text-blue-600 bg-blue-100" },
  table_deleted: { icon: LayoutGrid, color: "text-red-600 bg-red-100" },
  guest_seated: { icon: LayoutGrid, color: "text-emerald-600 bg-emerald-100" },

  // Gift actions
  gift_added: { icon: GiftIcon, color: "text-pink-600 bg-pink-100" },
  gift_deleted: { icon: GiftIcon, color: "text-red-600 bg-red-100" },

  // Calendar actions
  calendar_event_added: { icon: CalendarDays, color: "text-indigo-600 bg-indigo-100" },
  calendar_event_completed: { icon: CalendarDays, color: "text-emerald-600 bg-emerald-100" },

  // Event actions
  event_updated: { icon: Settings, color: "text-blue-600 bg-blue-100" },

  // Share actions
  share_link_created: { icon: Link2, color: "text-indigo-600 bg-indigo-100" },
};

function ActivityItem({ log, t }: { log: ActivityLog; t: (key: string) => string }) {
  const config = activityConfig[log.action] || {
    icon: Clock,
    color: "text-gray-600 bg-gray-100",
  };
  const Icon = config.icon;
  const text = t(`activity.${log.action}`) + (log.entityName ? `: ${log.entityName}` : "");

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("calendar.today");
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
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

// Widget options for sharing
const getWidgetOptions = (t: (key: string) => string): { key: ShareWidget; label: string }[] => [
  { key: "guests", label: t("share.widgets.guests") },
  { key: "budget", label: t("share.widgets.budget") },
  { key: "checklist", label: t("share.widgets.checklist") },
  { key: "program", label: t("share.widgets.program") },
  { key: "seating", label: t("share.widgets.seating") },
  { key: "gifts", label: t("share.widgets.gifts") },
];

interface QuickShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  t: (key: string) => string;
}

function QuickShareModal({ isOpen, onClose, eventId, t }: QuickShareModalProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<ShareWidget[]>(["guests", "checklist", "program"]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const WIDGET_OPTIONS = getWidgetOptions(t);

  const toggleWidget = (widget: ShareWidget) => {
    setSelectedWidgets((prev) =>
      prev.includes(widget)
        ? prev.filter((w) => w !== widget)
        : [...prev, widget]
    );
  };

  const handleCreate = async () => {
    if (selectedWidgets.length === 0) return;

    setIsCreating(true);
    try {
      const link = await shares.create(eventId, {
        accessLevel: "view",
        widgets: selectedWidgets,
      });
      setCreatedLink(link);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("errors.saveError"));
    } finally {
      setIsCreating(false);
    }
  };

  const getShareUrl = () => {
    if (!createdLink) return "";
    return `${window.location.origin}/share/${createdLink.token}`;
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("toasts.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setCreatedLink(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("share.title")}>
      {!createdLink ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("event.overview.shareDescription")}</label>
            <div className="grid grid-cols-2 gap-2">
              {WIDGET_OPTIONS.map((widget) => (
                <label
                  key={widget.key}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedWidgets.includes(widget.key)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedWidgets.includes(widget.key)}
                    onChange={() => toggleWidget(widget.key)}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">{widget.label}</span>
                </label>
              ))}
            </div>
            {selectedWidgets.length === 0 && (
              <p className="text-xs text-red-500 mt-2">{t("errors.required")}</p>
            )}
          </div>

          <ModalFooter>
            <button type="button" onClick={handleClose} className="btn-ghost btn-md">
              {t("common.cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || selectedWidgets.length === 0}
              className="btn-primary btn-md"
            >
              {isCreating ? t("common.loading") : t("share.createLink")}
            </button>
          </ModalFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">{t("invitation.copyLink")}:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="input flex-1 text-sm bg-background"
              />
              <button
                onClick={handleCopy}
                className={cn(
                  "btn-md px-3 transition-colors",
                  copied ? "btn-ghost text-emerald-600" : "btn-primary"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{selectedWidgets.map(w =>
              WIDGET_OPTIONS.find(o => o.key === w)?.label
            ).join(", ")}</p>
          </div>

          <ModalFooter>
            <button onClick={handleClose} className="btn-primary btn-md w-full">
              {t("common.close")}
            </button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
