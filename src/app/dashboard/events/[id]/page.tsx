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
  CalendarDays,
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
  Sparkles,
  Heart,
  PartyPopper,
} from "lucide-react";
import { events, checklist, activity, shares } from "@/lib/api";
import { Event, EventStats, ChecklistItem, ActivityLog, ShareLink, ShareWidget } from "@/lib/types";
import { formatDate, getDaysUntil, cn } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

// Format number compactly (e.g., 3200000 -> "3.2M")
function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}

// Countdown Timer Component
function CountdownTimer({ targetDate, t }: { targetDate: string; t: (key: string) => string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) return null;

  const items = [
    { value: timeLeft.days, label: t("countdown.days") },
    { value: timeLeft.hours, label: t("countdown.hours") },
    { value: timeLeft.minutes, label: t("countdown.minutes") },
    { value: timeLeft.seconds, label: t("countdown.seconds") },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <div className="relative">
            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                {String(item.value).padStart(2, '0')}
              </span>
            </div>
            {i < items.length - 1 && (
              <span className="absolute -right-2 sm:-right-2.5 top-1/2 -translate-y-1/2 text-white/60 text-xl font-light">:</span>
            )}
          </div>
          <span className="text-xs text-white/70 mt-2 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 60, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-primary/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-500"
      />
    </svg>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { t } = useTranslation();

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<ChecklistItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventData, statsData, checklistData, activityData] = await Promise.all([
          events.get(eventId),
          events.getStats(eventId).catch(() => null),
          checklist.list(eventId).catch(() => []),
          activity.list(eventId, 5).catch(() => []),
        ]);
        setEvent(eventData);
        setStats(statsData);
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

  // Tasks timeline
  const timelineItems = upcomingTasks.map(task => ({
    id: task.id,
    title: task.title,
    date: new Date(task.dueDate!),
    time: task.dueTime,
    category: task.category,
    data: task,
  })).slice(0, 6);

  const showCountdown = event.date && daysUntil !== null && daysUntil > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Section with Countdown */}
      {showCountdown ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-4 left-4 opacity-20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="absolute bottom-4 right-4 opacity-20">
            {event.type === 'wedding' ? (
              <Heart className="w-8 h-8 text-white" />
            ) : (
              <PartyPopper className="w-8 h-8 text-white" />
            )}
          </div>

          <div className="relative z-10">
            <div className="text-center mb-5">
              <h1 className="font-display text-2xl sm:text-3xl font-extralight text-white tracking-widest uppercase">
                {typeLabel}
                {event.person1 && event.person2 && ` ${event.person1} & ${event.person2}`}
              </h1>
            </div>

            <CountdownTimer targetDate={event.date!} t={t} />

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date!)}</span>
              </div>
              {event.time && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90">
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </div>
              )}
              {event.venue?.name && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Simple Header when no date or past event */
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
      )}

      {/* Quick Actions Bar */}
      {showCountdown && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Link
              href={`/dashboard/events/${eventId}/guests`}
              className="btn-outline btn-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("guests.addGuest")}</span>
            </Link>
            <Link
              href={`/dashboard/events/${eventId}/checklist`}
              className="btn-outline btn-sm"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t("checklist.addTask")}</span>
            </Link>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-primary btn-sm"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common.share")}</span>
          </button>
        </div>
      )}

      {/* Stats Cards with Progress Rings */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Link
          href={`/dashboard/events/${eventId}/guests`}
          className="card p-3 sm:p-5 hover:shadow-lg hover:border-primary/30 transition-all group overflow-visible"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3 overflow-visible">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="flex-shrink-0">
              <ProgressRing progress={guestProgress} size={36} strokeWidth={3} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {stats?.confirmedGuests || 0}
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">/{stats?.totalGuests || 0}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">{t("event.overview.stats.guests")}</div>
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/budget`}
          className="card p-3 sm:p-5 hover:shadow-lg hover:border-primary/30 transition-all group overflow-visible"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3 overflow-visible">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-shrink-0">
              <ProgressRing progress={Math.min(budgetProgress, 100)} size={36} strokeWidth={3} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {formatCompactNumber(stats?.paidAmount || 0)}
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">/{formatCompactNumber(event.totalBudget || 0)}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">{t("event.overview.stats.budget")}</div>
        </Link>

        <Link
          href={`/dashboard/events/${eventId}/checklist`}
          className="card p-3 sm:p-5 hover:shadow-lg hover:border-primary/30 transition-all group overflow-visible"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3 overflow-visible">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
            </div>
            <div className="flex-shrink-0">
              <ProgressRing progress={taskProgress} size={36} strokeWidth={3} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold">
            {stats?.checklistDone || 0}
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">/{stats?.checklistTotal || 0}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">{t("event.overview.stats.tasks")}</div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Tasks Timeline */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">{t("event.overview.timeline")}</h2>
            <Link href={`/dashboard/events/${eventId}/checklist`} className="text-xs text-primary hover:underline">
              {t("common.all")}
            </Link>
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

                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/events/${eventId}/checklist?task=${item.id}`}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-secondary/50 hover:translate-x-1",
                        isToday && "bg-primary/5 border border-primary/20",
                        isPast && "opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform",
                        isToday ? "bg-primary text-white" : isPast ? "bg-destructive/10 text-destructive" : isUrgent ? "bg-amber-100 text-amber-600" : "bg-secondary text-muted-foreground"
                      )}>
                        <CheckSquare className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", isPast && "text-muted-foreground")}>
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isToday ? t("calendar.today") : item.date.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
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
                <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm mb-3">{t("event.overview.noUpcoming")}</p>
                <Link href={`/dashboard/events/${eventId}/checklist`} className="btn-primary btn-sm">
                  {t("checklist.addTask")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity - Accent Background */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-primary to-primary/90 text-white overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white">{t("event.overview.activity")}</h2>
          </div>
          <div className="p-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((log) => (
                  <ActivityItemLight key={log.id} log={log} t={t} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white/60" />
                </div>
                <p className="text-sm text-white/70">
                  {t("event.overview.noActivity")}
                </p>
              </div>
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
  guest_seated: { icon: LayoutGrid, color: "text-emerald-600 bg-emerald-100" },
  guest_unseated: { icon: LayoutGrid, color: "text-orange-600 bg-orange-100" },

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

  // Program actions (both naming conventions)
  program_added: { icon: FileText, color: "text-indigo-600 bg-indigo-100" },
  program_updated: { icon: FileText, color: "text-blue-600 bg-blue-100" },
  program_deleted: { icon: FileText, color: "text-red-600 bg-red-100" },
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
  seating_updated: { icon: LayoutGrid, color: "text-blue-600 bg-blue-100" },

  // Gift actions
  gift_added: { icon: GiftIcon, color: "text-pink-600 bg-pink-100" },
  gift_updated: { icon: GiftIcon, color: "text-blue-600 bg-blue-100" },
  gift_deleted: { icon: GiftIcon, color: "text-red-600 bg-red-100" },

  // Calendar actions
  calendar_event_added: { icon: CalendarDays, color: "text-indigo-600 bg-indigo-100" },
  calendar_event_updated: { icon: CalendarDays, color: "text-blue-600 bg-blue-100" },
  calendar_event_completed: { icon: CalendarDays, color: "text-emerald-600 bg-emerald-100" },
  calendar_event_deleted: { icon: CalendarDays, color: "text-red-600 bg-red-100" },

  // Event actions
  event_created: { icon: Calendar, color: "text-emerald-600 bg-emerald-100" },
  event_updated: { icon: Settings, color: "text-blue-600 bg-blue-100" },

  // Share actions
  share_link_created: { icon: Link2, color: "text-indigo-600 bg-indigo-100" },
  share_link_deleted: { icon: Link2, color: "text-red-600 bg-red-100" },

  // Other actions
  invitation_sent: { icon: Users, color: "text-emerald-600 bg-emerald-100" },
  budget_updated: { icon: Wallet, color: "text-blue-600 bg-blue-100" },
};

// Light version of ActivityItem for dark background
function ActivityItemLight({ log, t }: { log: ActivityLog; t: (key: string) => string }) {
  const config = activityConfig[log.action] || {
    icon: Clock,
    color: "text-gray-600 bg-gray-100",
  };
  const Icon = config.icon;

  // Get translated text, fallback to formatted action name if translation is missing
  const translationKey = `activity.${log.action}`;
  let actionText = t(translationKey);

  // If translation returns the key itself, format the action name
  if (actionText === translationKey || actionText.startsWith("activity.")) {
    actionText = log.action
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  const text = actionText + (log.entityName ? `: ${log.entityName}` : "");

  // Format date and time
  const formatDateTime = (date: string) => {
    const then = new Date(date);
    const dateStr = then.toLocaleDateString("ru-KZ", {
      day: "2-digit",
      month: "2-digit",
    });
    const timeStr = then.toLocaleTimeString("ru-KZ", {
      hour: "2-digit",
      minute: "2-digit"
    });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{text}</p>
        <p className="text-xs text-white/60">{formatDateTime(log.createdAt)}</p>
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
