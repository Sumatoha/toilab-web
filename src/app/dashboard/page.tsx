"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, MoreHorizontal } from "lucide-react";
import { events } from "@/lib/api";
import { Event } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";

const WEDDING_EMOJI = "\u{1F48D}";

export default function DashboardPage() {
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await events.list();
        setEventList(data || []);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-gradient rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">
              {getGreeting(t)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {eventList.length === 0
                ? t("dashboard.createFirst")
                : `${eventList.length} ${t("dashboard.myEvents").toLowerCase()}`}
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="btn-primary btn-lg shadow-lg hover:shadow-xl inline-flex"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.createEvent")}
          </Link>
        </div>
      </div>

      {/* Content */}
      {eventList.length === 0 ? (
        <EventsEmptyState t={t} />
      ) : (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-h3">{t("dashboard.myEvents")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventList.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                t={t}
                className={`animate-in stagger-${Math.min(index + 1, 4)}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function getGreeting(t: (key: string) => string) {
  return t("auth.welcome") + "!";
}

function EventsEmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="card-gradient p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-3xl">
        {WEDDING_EMOJI}
      </div>
      <h2 className="text-h2 mb-2">{t("dashboard.noEvents")}</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t("dashboard.createFirst")}
      </p>
      <Link href="/dashboard/events/new" className="btn-primary btn-lg inline-flex">
        <Plus className="w-5 h-5" />
        {t("dashboard.createEvent")}
      </Link>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  t: (key: string) => string;
  className?: string;
}

function EventCard({ event, t, className }: EventCardProps) {

  // Mock stats - in real app these would come from API
  const guestCount = 0; // Would be fetched from event stats
  const maxGuests = event.guestLimit || 100;
  const daysUntil = event.date ? getDaysUntil(event.date) : null;

  // Get event type label
  const eventTypeKey = `event.${event.type}` as const;
  const eventTypeLabel = t(eventTypeKey);

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className={cn(
        "card-interactive group relative overflow-hidden border-l-4 border-l-emerald-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
            {WEDDING_EMOJI}
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {eventTypeLabel}
            </span>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {event.title}
            </h3>
          </div>
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.preventDefault(); }}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Person names for wedding */}
      {event.person1 && event.person2 && (
        <p className="text-sm text-muted-foreground mb-4">
          {event.person1} & {event.person2}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Quick Info */}
      <div className="space-y-2">
        {event.date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(event.date)}</span>
            {daysUntil !== null && daysUntil > 0 && (
              <span className="text-xs text-muted-foreground">
                ({daysUntil} {t("dashboard.daysLeft")})
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{guestCount} / {maxGuests} {t("dashboard.guests")}</span>
        </div>
      </div>

    </Link>
  );
}

function getDaysUntil(dateStr: string): number | null {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
