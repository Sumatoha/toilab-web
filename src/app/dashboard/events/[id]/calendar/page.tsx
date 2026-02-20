"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  Bell,
  Trash2,
  Check,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { calendar as calendarApi } from "@/lib/api";
import { CalendarEvent, CalendarEventType } from "@/lib/types";
import { cn, calendarEventTypeLabels } from "@/lib/utils";
import { Modal, ModalFooter, ConfirmDialog } from "@/components/ui";
import toast from "react-hot-toast";

const eventTypeIcons: Record<CalendarEventType, typeof Users> = {
  meeting: Users,
  deadline: AlertCircle,
  reminder: Bell,
  other: CalendarIcon,
};

const eventTypeColors: Record<CalendarEventType, { bg: string; text: string; border: string; dot: string }> = {
  meeting: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  deadline: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  reminder: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  other: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
};

export default function CalendarPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string>("");
  const [prefilledTime, setPrefilledTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load events from API
  useEffect(() => {
    loadEvents();
  }, [eventId]);

  const loadEvents = async () => {
    try {
      const data = await calendarApi.list(eventId);
      setEvents(data || []);
    } catch (error) {
      console.error("Failed to load calendar events:", error);
      // Silently fail - calendar will just be empty
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
      const newEvent = await calendarApi.create(eventId, {
        title: data.title,
        description: data.description,
        type: data.type,
        date: data.date,
        time: data.time,
        endTime: data.endTime,
        location: data.location,
      });
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

  const handleCompleteEvent = useCallback(async (calendarEvent: CalendarEvent) => {
    try {
      if (calendarEvent.isCompleted) {
        // Uncomplete
        const updated = await calendarApi.update(eventId, calendarEvent.id, { isCompleted: false });
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        toast.success("Событие возобновлено");
      } else {
        // Complete
        const updated = await calendarApi.complete(eventId, calendarEvent.id);
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        toast.success("Событие завершено");
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить событие");
    }
  }, [eventId]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleAddFromDate = useCallback((date: Date, time?: string) => {
    const dateStr = date.toISOString().split("T")[0];
    setPrefilledDate(dateStr);
    setPrefilledTime(time || "");
    setShowAddModal(true);
    setSelectedDate(null);
  }, []);

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
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

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(e => {
      const eventDateStr = typeof e.date === 'string' ? e.date.split("T")[0] : new Date(e.date).toISOString().split("T")[0];
      return eventDateStr === dateStr;
    });
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Time slots for day view
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Календарь</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Встречи и важные даты
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary btn-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить событие</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-secondary/30">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-secondary rounded-lg transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-semibold capitalize">
              {currentMonth.toLocaleDateString("ru-KZ", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs text-primary hover:underline"
            >
              Сегодня
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-secondary rounded-lg transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary/20">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-medium py-2 sm:py-3",
                i >= 5 ? "text-muted-foreground/70" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px] bg-secondary/10 border-b border-r border-border/50"
                />
              );
            }

            const dateStr = day.toISOString().split("T")[0];
            const dayEvents = getEventsForDate(day);
            const isToday = day.getTime() === today.getTime();
            const isPast = day < today;
            const isSelected = selectedDate?.toISOString().split("T")[0] === dateStr;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "min-h-[60px] sm:min-h-[80px] md:min-h-[100px] p-1 sm:p-1.5 border-b border-r border-border/50 cursor-pointer transition-all duration-200",
                  "hover:bg-primary/5 active:bg-primary/10",
                  isToday && "bg-primary/5 ring-2 ring-primary ring-inset",
                  isSelected && "bg-primary/10",
                  isPast && !isToday && "bg-secondary/30",
                  isWeekend && !isToday && !isSelected && "bg-secondary/20"
                )}
              >
                {/* Date number */}
                <div className={cn(
                  "text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 flex items-center justify-center sm:justify-start",
                  isToday && "text-primary",
                  isPast && !isToday && "text-muted-foreground/60"
                )}>
                  <span className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-white"
                  )}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="hidden sm:block space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => {
                    const colors = eventTypeColors[event.type];
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                        className={cn(
                          "text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate transition-all",
                          "hover:ring-2 hover:ring-offset-1 cursor-pointer",
                          colors.bg, colors.text,
                          event.isCompleted && "line-through opacity-50"
                        )}
                      >
                        {event.time && <span className="opacity-70">{event.time} </span>}
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 2} еще
                    </div>
                  )}
                </div>

                {/* Mobile: dots only */}
                <div className="sm:hidden flex justify-center gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors = eventTypeColors[event.type];
                    return (
                      <div
                        key={event.id}
                        className={cn("w-1.5 h-1.5 rounded-full", colors.dot)}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Panel */}
      {selectedDate && (
        <div className="card overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-secondary/30">
            <div>
              <h3 className="font-semibold">
                {selectedDate.toLocaleDateString("ru-KZ", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedDateEvents.length === 0
                  ? "Нет событий"
                  : `${selectedDateEvents.length} ${selectedDateEvents.length === 1 ? "событие" : "события"}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddFromDate(selectedDate)}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Добавить</span>
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Timeline */}
          <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            {selectedDateEvents.length > 0 ? (
              <div className="divide-y divide-border">
                {selectedDateEvents.map((event) => {
                  const Icon = eventTypeIcons[event.type];
                  const colors = eventTypeColors[event.type];
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-start gap-3 p-3 sm:p-4 transition-colors hover:bg-secondary/30 cursor-pointer group",
                        event.isCompleted && "opacity-60"
                      )}
                      onClick={() => setEditingEvent(event)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        colors.bg
                      )}>
                        <Icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          event.isCompleted && "line-through"
                        )}>
                          {event.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.time}
                              {event.endTime && ` - ${event.endTime}`}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompleteEvent(event); }}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            event.isCompleted
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-emerald-500 hover:bg-emerald-50"
                          )}
                          title={event.isCompleted ? "Возобновить" : "Завершить"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteEventId(event.id); }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Time slots for empty days */
              <div className="divide-y divide-border/50">
                {timeSlots.filter((_, i) => i >= 8 && i <= 20).map((time) => (
                  <div
                    key={time}
                    onClick={() => handleAddFromDate(selectedDate, time)}
                    className="flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-primary/5 cursor-pointer transition-colors group"
                  >
                    <span className="text-xs text-muted-foreground w-12">{time}</span>
                    <div className="flex-1 h-8 border border-dashed border-border/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground ml-1">Добавить</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      {!selectedDate && events.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Ближайшие события
          </h2>
          <div className="space-y-2">
            {events
              .filter(e => !e.isCompleted && new Date(e.date) >= today)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={() => setEditingEvent(event)}
                  onDelete={() => setDeleteEventId(event.id)}
                  onComplete={() => handleCompleteEvent(event)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && !selectedDate && (
        <div className="card text-center py-12 px-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Календарь пуст</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Добавьте первое событие: встречу с ведущим, дегустацию торта или примерку платья
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            Добавить событие
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

function EventCard({
  event,
  onEdit,
  onDelete,
  onComplete,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const Icon = eventTypeIcons[event.type];
  const colors = eventTypeColors[event.type];

  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = eventDate.toDateString() === today.toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(today.getTime() + 86400000).toDateString();

  const formatDate = () => {
    if (isToday) return "Сегодня";
    if (isTomorrow) return "Завтра";
    return eventDate.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" });
  };

  return (
    <div
      className={cn(
        "card p-3 sm:p-4 flex items-start gap-3 group cursor-pointer",
        "hover:shadow-md hover:border-primary/20 transition-all duration-200",
        event.isCompleted && "opacity-50"
      )}
      onClick={onEdit}
    >
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
        colors.bg
      )}>
        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.text)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          event.isCompleted && "line-through"
        )}>
          {event.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
          <span className={cn(
            "font-medium",
            isToday && "text-primary",
            isTomorrow && "text-amber-600"
          )}>
            {formatDate()}
          </span>
          {event.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.time}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
          title="Завершить"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Удалить"
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

  // Quick time suggestions
  const timeSuggestions = ["09:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={event ? "Редактировать" : "Новое событие"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
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

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Тип</label>
          <div className="grid grid-cols-4 gap-2">
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
                    "p-2 sm:p-3 rounded-xl border-2 text-center transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    type === t
                      ? `${colors.border} ${colors.bg} shadow-sm`
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mx-auto mb-1 transition-colors",
                    type === t ? colors.text : "text-muted-foreground"
                  )} />
                  <span className="text-[10px] sm:text-xs font-medium block truncate">
                    {label.ru}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Дата *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Время</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {timeSuggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-colors",
                  time === t
                    ? "bg-primary text-white border-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
              placeholder="Начало"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
              placeholder="Конец"
            />
          </div>
        </div>

        {/* Location */}
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

        {/* Description */}
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
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !date}
            className="btn-primary btn-md"
          >
            {isSubmitting ? "..." : event ? "Сохранить" : "Добавить"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
