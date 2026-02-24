"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
  Clock,
} from "lucide-react";
import { calendar as calendarApi } from "@/lib/api";
import { CalendarEvent, CalendarEventType } from "@/lib/types";
import { cn, calendarEventTypeLabels } from "@/lib/utils";
import { Modal, ModalFooter, ConfirmDialog, TimeInput } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";
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

// Helper to calculate event duration in hours
function getEventDurationHours(event: CalendarEvent): number {
  if (!event.time) return 1;
  if (!event.endTime) return 1;

  const [startH, startM] = event.time.split(":").map(Number);
  const [endH, endM] = event.endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) return 1;

  const durationHours = (endMinutes - startMinutes) / 60;
  return Math.max(1, Math.ceil(durationHours));
}

// Helper to calculate the top offset within the hour slot
function getEventTopOffset(time: string): number {
  if (!time) return 0;
  const minutes = parseInt(time.split(":")[1] || "0");
  return (minutes / 60) * 100; // percentage
}

export default function CalendarPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { t, tLabel } = useTranslation();
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
      toast.success(t("calendar.eventAdded"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("calendar.addError"));
    }
  }, [eventId, t]);

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
      toast.success(t("calendar.eventUpdated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("calendar.updateError"));
    }
  }, [eventId, editingEvent, t]);

  const handleDeleteEvent = useCallback(async () => {
    if (!deleteEventId) return;
    setIsDeleting(true);
    try {
      await calendarApi.delete(eventId, deleteEventId);
      setEvents(prev => prev.filter(e => e.id !== deleteEventId));
      setDeleteEventId(null);
      toast.success(t("calendar.eventDeleted"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("calendar.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }, [eventId, deleteEventId, t]);

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

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 - 23:00

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
          <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
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
              <span className="hidden sm:inline">{t("calendar.week")}</span>
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all",
                view === "month" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">{t("calendar.month")}</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button onClick={goPrev} className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label={t("calendar.prevPeriod")}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={goNext} className="p-2 hover:bg-secondary rounded-lg transition-colors" aria-label={t("calendar.nextPeriod")}>
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={goToday} className="px-3 py-1.5 text-sm hover:bg-secondary rounded-lg transition-colors">
          {t("calendar.today")}
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
          <div className="max-h-[600px] overflow-y-auto" style={{ isolation: 'isolate' }}>
            {hours.map((hour, hourIdx) => (
              <div key={hour} className="flex relative" style={{ zIndex: hours.length - hourIdx }}>
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
                    // Only get events that START in this hour slot
                    const startingEvents = getEventsForDate(day).filter(e => {
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
                          "h-14 border-t border-l border-border/40 cursor-pointer hover:bg-primary/5 transition-colors relative overflow-visible",
                          isWeekend && "bg-muted/20",
                          dayIdx === 6 && "border-r"
                        )}
                      >
                        {/* Events starting in this slot - they span multiple hours via CSS */}
                        {startingEvents.map((event) => {
                          const durationHours = getEventDurationHours(event);
                          const heightPx = durationHours * 56 - 4; // 56px per hour (h-14), minus padding
                          const topOffset = getEventTopOffset(event.time || "");

                          return (
                            <CalendarEventBlock
                              key={event.id}
                              event={event}
                              heightPx={heightPx}
                              topOffsetPercent={topOffset}
                              onClick={() => setEditingEvent(event)}
                              tLabel={tLabel}
                            />
                          );
                        })}
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
          t={t}
        />
      )}

      {/* Upcoming Events List */}
      {events.filter(e => !e.isCompleted && new Date(e.date) >= today).length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">{t("calendar.upcoming")}</h2>
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
                  t={t}
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
          <h3 className="text-lg font-semibold mb-1">{t("calendar.emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("calendar.emptyDescription")}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> {t("calendar.addEvent")}
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
          t={t}
          tLabel={tLabel}
        />
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <CalendarEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSubmit={handleUpdateEvent}
          onDelete={() => { setDeleteEventId(editingEvent.id); setEditingEvent(null); }}
          t={t}
          tLabel={tLabel}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteEventId}
        onClose={() => setDeleteEventId(null)}
        onConfirm={handleDeleteEvent}
        title={t("calendar.deleteTitle")}
        description={t("calendar.deleteDescription")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function CalendarEventBlock({
  event,
  heightPx,
  topOffsetPercent,
  onClick,
  tLabel,
}: {
  event: CalendarEvent;
  heightPx: number;
  topOffsetPercent: number;
  onClick: () => void;
  tLabel: (ru: string, kz?: string) => string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, showBelow: false });
  const blockRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Check if there's enough space above (need ~180px for tooltip)
    const showBelow = rect.top < 180;
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: showBelow ? rect.bottom : rect.top,
      showBelow,
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const Icon = eventTypeIcons[event.type];
  const typeLabel = calendarEventTypeLabels[event.type];

  return (
    <>
      <div
        ref={blockRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          height: `${heightPx}px`,
          top: `${topOffsetPercent}%`,
        }}
        className={cn(
          "absolute inset-x-0.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-all",
          "z-20 hover:z-30 hover:shadow-lg",
          "border-l-[3px]",
          event.type === "meeting" && "bg-primary/90 border-l-primary text-white",
          event.type === "deadline" && "bg-destructive/90 border-l-destructive text-white",
          event.type === "reminder" && "bg-warning/90 border-l-warning text-white",
          event.type === "other" && "bg-muted-foreground/80 border-l-muted-foreground text-white",
          event.isCompleted && "opacity-50"
        )}
      >
        <div className="font-medium truncate">{event.title}</div>
        {event.time && (
          <div className="text-[10px] opacity-70">
            {event.time}
            {event.endTime && ` - ${event.endTime}`}
          </div>
        )}
      </div>

      {/* Tooltip - rendered via Portal to body for proper z-index */}
      {showTooltip && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.showBelow ? tooltipPosition.y + 8 : tooltipPosition.y - 8,
            transform: tooltipPosition.showBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
          }}
        >
          <div className="bg-popover border border-border rounded-lg shadow-xl p-3 min-w-[200px] max-w-[280px]">
            <div className="flex items-start gap-2 mb-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                eventTypeColors[event.type].bg
              )}>
                <Icon className={cn("w-4 h-4", eventTypeColors[event.type].text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{tLabel(typeLabel.ru, typeLabel.kk)}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {event.time && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {event.time}
                    {event.endTime && ` - ${event.endTime}`}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              {event.description && (
                <p className="text-muted-foreground pt-1 border-t border-border mt-2 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>

            {/* Arrow - adapts to position */}
            {tooltipPosition.showBelow ? (
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full">
                <div className="w-2 h-2 bg-popover border-l border-t border-border rotate-45 mt-[3px]" />
              </div>
            ) : (
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full">
                <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function MonthView({
  currentDate,
  onDateClick,
  onEventClick,
  getEventsForDate,
  t,
}: {
  currentDate: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  t: (key: string) => string;
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

  // Get weekday names from translations (array format)
  const weekDaysRaw = t("calendar.weekDays");
  const weekDayNames = weekDaysRaw.startsWith("[") ? JSON.parse(weekDaysRaw) : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="card overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
        {weekDayNames.map((day: string, i: number) => (
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
  t,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
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
            {isToday ? t("calendar.today") :
             isTomorrow ? t("calendar.tomorrow") :
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
  t,
  tLabel,
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
  t: (key: string) => string;
  tLabel: (ru: string, kz?: string) => string;
}) {
  const getDateString = (date: string | Date | undefined): string => {
    if (!date) return new Date().toISOString().split("T")[0];
    if (typeof date === 'string') return date.split("T")[0];
    return new Date(date).toISOString().split("T")[0];
  };

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [type, setType] = useState<CalendarEventType>(event?.type || "meeting");
  const [date, setDate] = useState(
    event?.date
      ? getDateString(event.date)
      : (initialDate || new Date().toISOString().split("T")[0])
  );
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
    <Modal isOpen onClose={onClose} title={event ? t("calendar.editEvent") : t("calendar.newEvent")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("calendar.titleRequired")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder={t("calendar.titlePlaceholder")}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("calendar.type")}</label>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((eventType) => {
              const Icon = eventTypeIcons[eventType];
              const colors = eventTypeColors[eventType];
              const label = calendarEventTypeLabels[eventType];
              return (
                <button
                  key={eventType}
                  type="button"
                  onClick={() => setType(eventType)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                    type === eventType ? `${colors.bg} ${colors.text}` : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tLabel(label.ru, label.kk)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("calendar.dateRequired")}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("calendar.time")}</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {timeSuggestions.map((timeSuggestion) => (
              <button
                key={timeSuggestion}
                type="button"
                onClick={() => setTime(timeSuggestion)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  time === timeSuggestion ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {timeSuggestion}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TimeInput value={time} onChange={setTime} placeholder={t("calendar.startPlaceholder")} />
            <TimeInput value={endTime} onChange={setEndTime} placeholder={t("calendar.endPlaceholder")} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("calendar.location")}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder={t("calendar.locationPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("calendar.note")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[60px] resize-none"
            placeholder={t("calendar.notePlaceholder")}
            rows={2}
          />
        </div>

        <ModalFooter>
          {event && onDelete && (
            <button type="button" onClick={onDelete} className="btn-outline btn-md text-red-500 border-red-200 hover:bg-red-50 mr-auto">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-outline btn-md">{t("common.cancel")}</button>
          <button type="submit" disabled={isSubmitting || !title.trim() || !date} className="btn-primary btn-md">
            {isSubmitting ? "..." : event ? t("common.save") : t("common.add")}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
