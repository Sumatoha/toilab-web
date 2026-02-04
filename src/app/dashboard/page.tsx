"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, MoreHorizontal } from "lucide-react";
import { events } from "@/lib/api";
import { Event } from "@/lib/types";
import { formatDate, eventTypeLabels } from "@/lib/utils";
import { PageLoader, EmptyState } from "@/components/ui";

export default function DashboardPage() {
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Мероприятия</h1>
        <Link href="/dashboard/events/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4" />
          Создать
        </Link>
      </div>

      {/* Content */}
      {eventList.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Название</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Тип</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Дата</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Статус</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {eventList.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventsEmptyState() {
  return (
    <div className="border border-dashed border-border rounded-lg">
      <EmptyState
        icon={Calendar}
        title="Нет мероприятий"
        description="Создайте первое мероприятие, чтобы начать планирование"
        action={
          <Link href="/dashboard/events/new" className="btn-primary btn-md">
            <Plus className="w-4 h-4" />
            Создать мероприятие
          </Link>
        }
      />
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  const typeLabel = eventTypeLabels[event.type]?.ru || event.type;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/dashboard/events/${event.id}`} className="hover:underline font-medium">
          {event.title}
        </Link>
        {event.person1 && event.person2 && (
          <p className="text-sm text-muted-foreground">{event.person1} & {event.person2}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="badge-default">{typeLabel}</span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {event.date ? formatDate(event.date) : "—"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={event.status} />
      </td>
      <td className="px-4 py-3">
        <button className="p-1 hover:bg-secondary rounded transition-colors">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <span className="badge-success">Активно</span>;
  }
  if (status === "draft") {
    return <span className="badge-warning">Черновик</span>;
  }
  return <span className="badge-default">Завершено</span>;
}
