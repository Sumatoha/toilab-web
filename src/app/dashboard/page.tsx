"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, MoreHorizontal } from "lucide-react";
import { events } from "@/lib/api";
import { Event } from "@/lib/types";
import { formatDate, eventTypeLabels } from "@/lib/utils";

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
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
        <EmptyState />
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

function EmptyState() {
  return (
    <div className="text-center py-16 border border-dashed border-border rounded-lg">
      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-lg font-medium mb-2">Нет мероприятий</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Создайте первое мероприятие
      </p>
      <Link href="/dashboard/events/new" className="btn-primary btn-md">
        <Plus className="w-4 h-4" />
        Создать мероприятие
      </Link>
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
