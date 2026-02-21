"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  Bell,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
} from "lucide-react";
import { calendar as calendarApi } from "@/lib/api";
import { CalendarEvent, CalendarEventType } from "@/lib/types";
import { cn, calendarEventTypeLabels } from "@/lib/utils";
import { Modal, ModalFooter, ConfirmDialog, TimeInput } from "@/components/ui";
import toast from "react-hot-toast";

const eventTypeIcons: Record<CalendarEventType, typeof Users> = {
  meeting: Users,
  deadline: AlertCircle,
  reminder: Bell,
  other: CalendarIcon,
};

const eventTypeColors: Record<CalendarEventType, { bg: string; text: string; border: string }> = {
  meeting: { bg: "bg-primary", text: "text-white", border: "border-primary" },
  deadline: { bg: "bg-destructive", text: "text-white", border: "border-destructive" },
  reminder: { bg: "bg-warning", text: "text-white", border: "border-warning" },
  other: { bg: "bg-muted-foreground", text: "text-white", border: "border-muted-foreground" },
};

type ViewType = "week" | "month";

export default function CalendarPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string>("");
  const [prefilledTime, setPrefilledTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [eventId]);

  const loadEvents = async () => {
    try {
      const data = await calendarApi.list(eventId);
      setEvents(data || []);
    } catch (error) {
      console.error("Failed to load calendar events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = useCallback(async (data: {
    title: string;
    description?: string;
    type: CalendarEventType;
    date: string;
    time?: string;
    endTime?: string;
    location?: string;
  }) => {
    try {
      const newEvent = await calendarApi.create(eventId, data);
      setEvents(prev => [...prev, newEvent].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
      setShowAddModal(false);
      setPrefilledDate("");
      setPrefilledTime("");
      toast.success("Событие добавлено");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить событие");
    }
  }, [eventId]);

  const handleUpdateEvent = useCallback(async (data: {
    title: string;
    description?: string;
    type: CalendarEventType;
    date: string;
    time?: string;
    endTime?: string;
    location?: string;
  }) => {
    if (!editingEvent) return;
    try {
      const updated = await calendarApi.update(eventId, editingEvent.id, data);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEditingEvent(null);
      toast.success("Событие обновлено");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить событие");
    }
  }, [eventId, editingEvent]);

  const handleDeleteEvent = useCallback(async () => {
    if (!deleteEventId) return;
    setIsDeleting(true);
    try {
      await calendarApi.delete(eventId, deleteEventId);
      setEvents(prev => prev.filter(e => e.id !== deleteEventId));
      setDeleteEventId(null);
      toast.success("Событие удалено");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить событие");
    } finally {
      setIsDeleting(false);
    }
  }, [eventId, deleteEventId]);

  const handleAddFromSlot = useCallback((date: Date, hour?: number) => {
    const dateStr = date.toISOString().split("T")[0];
    setPrefilledDate(dateStr);
    if (hour !== undefined) {
      setPrefilledTime(`${hour.toString().padStart(2, "0")}:00`);
    }
    setShowAddModal(true);
  }, []);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    if (view === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };
  const goNext = () => {
    if (view === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  // Get week days
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Start from Monday
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getEventsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(e => {
      const eventDateStr = typeof e.date === 'string' ? e.date.split("T")[0] : new Date(e.date).toISOString().split("T")[0];
      return eventDateStr === dateStr;
    });
  }, [events]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - minimal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Календарь</h1>
          <p className="text-sm text-muted-foreground">
            {view === "week"
              ? `${weekDays[0].toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })} - ${weekDays[6].toLocaleDateString("ru-KZ", { day: "numeric", month: "short", year: "numeric" })}`
              : currentDate.toLocaleDateString("ru-KZ", { month: "long", year: "numeric" })
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg bg-secondary p-1">
            <button
              onClick={() => setView("week")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all",
                view === "week" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Неделя</span>
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all",
                view === "month" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Месяц</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button onClick={goPrev} className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label="Предыдущий период">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={goNext} className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label="Следующий период">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={goToday} className="px-3 py-1.5 text-sm hover:bg-secondary rounded-lg transition-colors">
          Сегодня
        </button>
      </div>

      {/* Week View */}
      {view === "week" && (
        <div className="card overflow-hidden">
          {/* Day Headers */}
          <div className="flex border-b border-border">
            {/* Time gutter spacer */}
            <div className="w-16 flex-shrink-0" />
            {/* Days */}
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === today.toDateString();
                const isWeekend = i >= 5;
                return (
                  <div
                    key={i}
                    className={cn(
                      "py-3 text-center",
                      isWeekend && "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "text-[11px] uppercase tracking-wide mb-1",
                      isToday ? "text-primary font-semibold" : "text-muted-foreground"
                    )}>
                      {day.toLocaleDateString("ru-KZ", { weekday: "short" })}
                    </div>
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center mx-auto text-sm font-semibold",
                      isToday ? "bg-primary text-white" : "text-foreground"
                    )}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {hours.map((hour, hourIdx) => (
              <div key={hour} className="flex">
                {/* Time Label */}
                <div className="w-16 flex-shrink-0 relative">
                  <span className={cn(
                    "absolute -top-2.5 right-3 text-[11px] font-medium text-muted-foreground",
                    hourIdx === 0 && "hidden"
                  )}>
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>

                {/* Day Columns */}
                <div className="flex-1 grid grid-cols-7">
                  {weekDays.map((day, dayIdx) => {
                    const dayEvents = getEventsForDate(day).filter(e => {
                      if (!e.time) return hour === 9;
                      const eventHour = parseInt(e.time.split(":")[0]);
                      return eventHour === hour;
                    });
                    const isWeekend = dayIdx >= 5;

                    return (
                      <div
                        key={dayIdx}
                        onClick={() => handleAddFromSlot(day, hour)}
                        className={cn(
                          "h-14 border-t border-l border-border/40 cursor-pointer hover:bg-primary/5 transition-colors relative",
                          isWeekend && "bg-muted/20",
                          dayIdx === 6 && "border-r"
                        )}
                      >
                        {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                              className={cn(
                                "absolute inset-x-0.5 top-0.5 bottom-0.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-all",
                                "hover:shadow-md hover:scale-[1.02] hover:z-10",
                                "border-l-[3px]",
                                event.type === "meeting" && "bg-primary/15 border-l-primary text-primary",
                                event.type === "deadline" && "bg-destructive/15 border-l-destructive text-destructive",
                                event.type === "reminder" && "bg-warning/15 border-l-warning text-warning-foreground",
                                event.type === "other" && "bg-muted border-l-muted-foreground text-muted-foreground",
                                event.isCompleted && "opacity-50"
                              )}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {event.time && (
                                <div className="text-[10px] opacity-70">{event.time}</div>
                              )}
                            </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          onDateClick={(date) => handleAddFromSlot(date)}
          onEventClick={(event) => setEditingEvent(event)}
          getEventsForDate={getEventsForDate}
        />
      )}

      {/* Upcoming Events List */}
      {events.filter(e => !e.isCompleted && new Date(e.date) >= today).length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Ближайшие события</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events
              .filter(e => !e.isCompleted && new Date(e.date) >= today)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 6)
              .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={() => setEditingEvent(event)}
                  onDelete={() => setDeleteEventId(event.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="card text-center py-12 px-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Календарь пуст</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Добавьте события: встречи, дедлайны, напоминания
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Добавить событие
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <CalendarEventModal
          onClose={() => { setShowAddModal(false); setPrefilledDate(""); setPrefilledTime(""); }}
          onSubmit={handleAddEvent}
          initialDate={prefilledDate}
          initialTime={prefilledTime}
        />
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <CalendarEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSubmit={handleUpdateEvent}
          onDelete={() => { setDeleteEventId(editingEvent.id); setEditingEvent(null); }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteEventId}
        onClose={() => setDeleteEventId(null)}
        onConfirm={handleDeleteEvent}
        title="Удалить событие?"
        description="Событие будет удалено из календаря"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function MonthView({
  currentDate,
  onDateClick,
  onEventClick,
  getEventsForDate,
}: {
  currentDate: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
          <div key={day} className={cn(
            "text-center text-xs font-medium py-2",
            i >= 5 ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="min-h-[80px] bg-secondary/10 border-b border-r border-border/50" />;
          }

          const dayEvents = getEventsForDate(day);
          const isToday = day.getTime() === today.getTime();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                "min-h-[80px] p-1 border-b border-r border-border/50 cursor-pointer hover:bg-primary/5 transition-colors",
                isToday && "bg-primary/5",
                isWeekend && "bg-secondary/20"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1",
                isToday && "bg-primary text-white font-medium"
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => {
                  const colors = eventTypeColors[event.type];
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className={cn(
                        "text-[10px] px-1 py-0.5 rounded truncate",
                        colors.bg, colors.text,
                        event.isCompleted && "opacity-50"
                      )}
                    >
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = eventTypeIcons[event.type];
  const colors = eventTypeColors[event.type];
  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = eventDate.toDateString() === today.toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(today.getTime() + 86400000).toDateString();

  return (
    <div
      onClick={onEdit}
      className="card p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isToday ? colors.bg : "bg-primary/10"
        )}>
          <Icon className={cn("w-5 h-5", isToday ? colors.text : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isToday ? "Сегодня" :
             isTomorrow ? "Завтра" :
             eventDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" })}
            {event.time && ` • ${event.time}`}
          </p>
          {event.location && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CalendarEventModal({
  event,
  onClose,
  onSubmit,
  onDelete,
  initialDate,
  initialTime,
}: {
  event?: CalendarEvent;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    type: CalendarEventType;
    date: string;
    time?: string;
    endTime?: string;
    location?: string;
  }) => void;
  onDelete?: () => void;
  initialDate?: string;
  initialTime?: string;
}) {
  const getDateString = (date: string | Date | undefined): string => {
    if (!date) return new Date().toISOString().split("T")[0];
    if (typeof date === 'string') return date.split("T")[0];
    return new Date(date).toISOString().split("T")[0];
  };

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [type, setType] = useState<CalendarEventType>(event?.type || "meeting");
  const [date, setDate] = useState(getDateString(event?.date) || initialDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(event?.time || initialTime || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [location, setLocation] = useState(event?.location || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        date,
        time: time || undefined,
        endTime: endTime || undefined,
        location: location.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypes: CalendarEventType[] = ["meeting", "deadline", "reminder", "other"];
  const timeSuggestions = ["09:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

  return (
    <Modal isOpen onClose={onClose} title={event ? "Редактировать" : "Новое событие"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Название *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Встреча с ведущим"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Тип</label>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((t) => {
              const Icon = eventTypeIcons[t];
              const colors = eventTypeColors[t];
              const label = calendarEventTypeLabels[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                    type === t ? `${colors.bg} ${colors.text}` : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label.ru}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Дата *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Время</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {timeSuggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  time === t ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TimeInput value={time} onChange={setTime} placeholder="Начало" />
            <TimeInput value={endTime} onChange={setEndTime} placeholder="Конец" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Место</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder="Ресторан, офис, онлайн..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Заметка</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[60px] resize-none"
            placeholder="Дополнительная информация..."
            rows={2}
          />
        </div>

        <ModalFooter>
          {event && onDelete && (
            <button type="button" onClick={onDelete} className="btn-outline btn-md text-red-500 border-red-200 hover:bg-red-50 mr-auto">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-outline btn-md">Отмена</button>
          <button type="submit" disabled={isSubmitting || !title.trim() || !date} className="btn-primary btn-md">
            {isSubmitting ? "..." : event ? "Сохранить" : "Добавить"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
