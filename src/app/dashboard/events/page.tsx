"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, MapPin } from "lucide-react";
import { events as eventsApi } from "@/lib/api";
import { Event } from "@/lib/types";
import { formatDate, eventTypeLabels } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EventsPage() {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await eventsApi.list();
      setEventsList(data || []);
    } catch (error) {
      console.error("Failed to load events:", error);
      toast.error("Не удалось загрузить мероприятия");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Мероприятия</h1>
          <p className="text-muted-foreground">Все ваши мероприятия</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Новое мероприятие
        </Link>
      </div>

      {eventsList.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет мероприятий</h3>
          <p className="text-muted-foreground mb-4">
            Создайте первое мероприятие, чтобы начать планирование
          </p>
          <Link href="/dashboard/events/new" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Создать мероприятие
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventsList.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium text-primary">
                    {eventTypeLabels[event.type]?.ru || event.type}
                  </span>
                  <h3 className="font-semibold mt-1">
                    {event.person1} & {event.person2}
                  </h3>
                </div>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    event.status === "active" ? "bg-green-500" : "bg-yellow-500"
                  )}
                />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {event.date ? formatDate(event.date) : "Дата не указана"}
                </div>
                {event.venue?.name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.venue.name}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {event.guestLimit} гостей макс.
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
