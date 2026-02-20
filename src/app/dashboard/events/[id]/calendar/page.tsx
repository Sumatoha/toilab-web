"use client";

import { useEffect, useState } from "react";
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
  Link2,
} from "lucide-react";
import { calendar, checklist } from "@/lib/api";
import { CalendarEvent, CalendarEventType, ChecklistItem } from "@/lib/types";
import { cn, calendarEventTypeLabels } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, ConfirmDialog } from "@/components/ui";
import toast from "react-hot-toast";

const eventTypeIcons: Record<CalendarEventType, typeof Users> = {
  meeting: Users,
  deadline: AlertCircle,
  reminder: Bell,
  other: CalendarIcon,
};

const eventTypeColors: Record<CalendarEventType, { bg: string; text: string; border: string }> = {
  meeting: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  deadline: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  reminder: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  other: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

export default function CalendarPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [prefilledDate, setPrefilledDate] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [eventsData, tasksData] = await Promise.all([
        calendar.list(eventId).catch(() => []),
        checklist.list(eventId).catch(() => []),
      ]);
      setEvents(eventsData || []);
      setTasks((tasksData || []).filter((t: ChecklistItem) => !t.isCompleted));
    } catch (error) {
      console.error("Failed to load calendar:", error);
      toast.error("Не удалось загрузить календарь");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddEvent = async (data: {
    title: string;
    description?: string;
    type: CalendarEventType;
    date: string;
    time?: string;
    endTime?: string;
    location?: string;
    checklistItemId?: string;
    autoCompleteTask: boolean;
  }) => {
    try {
      const newEvent = await calendar.create(eventId, data);
      setEvents((prev) => [...prev, newEvent].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
      setShowAddModal(false);
      toast.success("Событие добавлено");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить событие");
    }
  };

  const handleUpdateEvent = async (data: {
    title: string;
    description?: string;
    type: CalendarEventType;
    date: string;
    time?: string;
    endTime?: string;
    location?: string;
    autoCompleteTask: boolean;
  }) => {
    if (!editingEvent) return;
    try {
      const updated = await calendar.update(eventId, editingEvent.id, data);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingEvent(null);
      toast.success("Событие обновлено");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить событие");
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;
    setIsDeleting(true);
    try {
      await calendar.delete(eventId, deleteEventId);
      setEvents((prev) => prev.filter((e) => e.id !== deleteEventId));
      setDeleteEventId(null);
      toast.success("Событие удалено");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить событие");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCompleteEvent = async (calendarEvent: CalendarEvent) => {
    try {
      const updated = await calendar.complete(eventId, calendarEvent.id);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (calendarEvent.autoCompleteTask && calendarEvent.checklistItemId) {
        toast.success("Событие завершено, задача отмечена выполненной");
      } else {
        toast.success("Событие завершено");
      }
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось завершить событие");
    }
  };

  // Get upcoming events (not completed, future dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events
    .filter((e) => !e.isCompleted && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get past events
  const pastEvents = events
    .filter((e) => e.isCompleted || new Date(e.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">Календарь</h1>
          <p className="text-caption mt-1">
            Встречи и важные даты
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить событие</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            viewMode === "list"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Список
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            viewMode === "calendar"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Календарь
        </button>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Предстоящие
              </h2>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <CalendarEventCard
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
          {events.length === 0 && (
            <div className="card text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Календарь пуст</h3>
              <p className="text-muted-foreground mb-6">
                Добавьте первое событие или встречу
              </p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                Добавить событие
              </button>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Прошедшие
              </h2>
              <div className="space-y-2 opacity-60">
                {pastEvents.slice(0, 5).map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onEdit={() => setEditingEvent(event)}
                    onDelete={() => setDeleteEventId(event.id)}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <CalendarView
          events={events}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onEventClick={setEditingEvent}
          onAddClick={(date) => {
            setPrefilledDate(date);
            setShowAddModal(true);
          }}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <CalendarEventModal
          onClose={() => { setShowAddModal(false); setPrefilledDate(""); }}
          onSubmit={handleAddEvent}
          tasks={tasks}
          initialDate={prefilledDate}
        />
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <CalendarEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSubmit={handleUpdateEvent}
          tasks={tasks}
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

function CalendarEventCard({
  event,
  onEdit,
  onDelete,
  onComplete,
  isPast,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  onComplete?: () => void;
  isPast?: boolean;
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
        "card p-3 sm:p-4 flex items-start gap-3 group cursor-pointer hover:border-primary/20 transition-colors",
        event.isCompleted && "opacity-60"
      )}
      onClick={onEdit}
    >
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        colors.bg
      )}>
        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.text)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn(
              "font-medium truncate",
              event.isCompleted && "line-through"
            )}>
              {event.title}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
              <span className={cn(
                "font-medium",
                isToday && !isPast && "text-primary",
                isTomorrow && !isPast && "text-amber-600"
              )}>
                {formatDate()}
              </span>
              {event.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.time}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              )}
              {event.checklistItemId && (
                <span className="flex items-center gap-1 text-primary">
                  <Link2 className="w-3 h-3" />
                  Связано с задачей
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!isPast && !event.isCompleted && onComplete && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Завершить"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarView({
  events,
  currentMonth,
  onMonthChange,
  onEventClick,
  onAddClick,
}: {
  events: CalendarEvent[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: (date: string) => void;
}) {
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

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString("ru-KZ", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = day.toISOString().split("T")[0];
          const dayEvents = events.filter((e) => e.date.split("T")[0] === dateStr);
          const isToday = day.getTime() === today.getTime();

          return (
            <div
              key={dateStr}
              onClick={() => onAddClick(dateStr)}
              className={cn(
                "aspect-square p-1 rounded-lg border cursor-pointer transition-colors hover:bg-secondary/50",
                isToday ? "border-primary bg-primary/5" : "border-transparent"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1",
                isToday && "text-primary"
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
                        event.isCompleted && "line-through opacity-60"
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

function CalendarEventModal({
  event,
  onClose,
  onSubmit,
  tasks,
  initialDate,
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
    checklistItemId?: string;
    autoCompleteTask: boolean;
  }) => void;
  tasks: ChecklistItem[];
  initialDate?: string;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [type, setType] = useState<CalendarEventType>(event?.type || "meeting");
  const [date, setDate] = useState(event?.date?.split("T")[0] || initialDate || "");
  const [time, setTime] = useState(event?.time || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [location, setLocation] = useState(event?.location || "");
  const [checklistItemId, setChecklistItemId] = useState(event?.checklistItemId || "");
  const [autoCompleteTask, setAutoCompleteTask] = useState(event?.autoCompleteTask ?? true);
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
        checklistItemId: checklistItemId || undefined,
        autoCompleteTask,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypes: CalendarEventType[] = ["meeting", "deadline", "reminder", "other"];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={event ? "Редактировать событие" : "Новое событие"}
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
          <label className="block text-sm font-medium mb-1.5">Тип</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    "p-2 sm:p-3 rounded-lg border-2 text-center transition-colors",
                    type === t
                      ? `${colors.border} ${colors.bg}`
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mx-auto mb-1", type === t ? colors.text : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{label.ru}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Дата *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Начало</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Конец</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
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
          <label className="block text-sm font-medium mb-1.5">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[60px]"
            placeholder="Дополнительная информация..."
          />
        </div>

        {/* Link to Task */}
        {!event && tasks.length > 0 && (
          <div className="p-3 rounded-lg bg-secondary/50 space-y-3">
            <label className="block text-sm font-medium">Связать с задачей</label>
            <select
              value={checklistItemId}
              onChange={(e) => setChecklistItemId(e.target.value)}
              className="input"
            >
              <option value="">Не связывать</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            {checklistItemId && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoCompleteTask}
                  onChange={(e) => setAutoCompleteTask(e.target.checked)}
                  className="rounded border-border"
                />
                Автоматически закрыть задачу после события
              </label>
            )}
          </div>
        )}

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
