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
  Building,
  Mail,
  Settings,
  Copy,
} from "lucide-react";
import { events } from "@/lib/api";
import { Event, EventStats } from "@/lib/types";
import {
  formatDate,
  formatCurrency,
  getDaysUntil,
  formatDaysCount,
  formatGuestCount,
  eventTypeLabels,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold mb-2">Мероприятие не найдено</h2>
        <Link href="/dashboard" className="text-primary hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  const daysUntil = getDaysUntil(event.date);
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;
  const budgetPercent =
    event.totalBudget > 0
      ? Math.round((stats?.paidAmount || 0) / event.totalBudget * 100)
      : 0;
  const checklistPercent =
    stats && stats.checklistTotal > 0
      ? Math.round((stats.checklistDone / stats.checklistTotal) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
              {typeLabel}
            </span>
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
                : "Завершено"}
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold">{event.title}</h1>
          {event.person1 && event.person2 && (
            <p className="text-muted-foreground">
              {event.person1} & {event.person2}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {event.status === "active" && (
            <button
              onClick={copyInvitationLink}
              className="btn-outline btn-sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Копировать ссылку
            </button>
          )}
          <Link
            href={`/dashboard/events/${eventId}/settings`}
            className="btn-ghost btn-sm"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Date */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата</p>
              <p className="font-semibold">
                {event.date ? formatDate(event.date) : "Не указана"}
              </p>
              {daysUntil !== null && daysUntil > 0 && (
                <p className="text-xs text-muted-foreground">
                  Через {formatDaysCount(daysUntil)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Место</p>
              <p className="font-semibold truncate">
                {event.venue?.name || "Не указано"}
              </p>
              {event.venue?.address && (
                <p className="text-xs text-muted-foreground truncate">
                  {event.venue.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Гости</p>
              <p className="font-semibold">
                {stats?.confirmedGuests || 0} / {stats?.totalGuests || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                подтвердили
              </p>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Бюджет</p>
              <p className="font-semibold">
                {formatCurrency(stats?.paidAmount || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                из {formatCurrency(event.totalBudget)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href={`/dashboard/events/${eventId}/guests`}
          icon={Users}
          title="Гости"
          description={formatGuestCount(stats?.totalGuests || 0)}
          stat={`${stats?.confirmedGuests || 0} подтвердили`}
          color="blue"
        />
        <QuickAction
          href={`/dashboard/events/${eventId}/budget`}
          icon={Wallet}
          title="Бюджет"
          description={`${budgetPercent}% использовано`}
          stat={formatCurrency(event.totalBudget - (stats?.paidAmount || 0)) + " осталось"}
          color="green"
        />
        <QuickAction
          href={`/dashboard/events/${eventId}/checklist`}
          icon={CheckSquare}
          title="Чек-лист"
          description={`${checklistPercent}% выполнено`}
          stat={`${stats?.checklistDone || 0} из ${stats?.checklistTotal || 0} задач`}
          color="purple"
        />
        <QuickAction
          href={`/dashboard/events/${eventId}/invitation`}
          icon={Mail}
          title="Приглашение"
          description="Настроить"
          stat={event.status === "active" ? "Активно" : "Не опубликовано"}
          color="orange"
        />
      </div>

      {/* Vendors preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Подрядчики</h2>
          <Link
            href={`/dashboard/events/${eventId}/vendors`}
            className="text-sm text-primary hover:underline"
          >
            Все подрядчики
          </Link>
        </div>
        <p className="text-muted-foreground">
          Добавьте подрядчиков для отслеживания контактов и оплат
        </p>
        <Link
          href={`/dashboard/events/${eventId}/vendors`}
          className="btn-outline btn-sm mt-4"
        >
          <Building className="w-4 h-4 mr-2" />
          Добавить подрядчика
        </Link>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  stat,
  color,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  stat: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-green-500/10 text-green-600",
    purple: "bg-purple-500/10 text-purple-600",
    orange: "bg-orange-500/10 text-orange-600",
  };

  return (
    <Link href={href} className="card-hover group">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground mt-1">{stat}</p>
        </div>
      </div>
    </Link>
  );
}
