"use client";

import { useEffect, useState, useRef, forwardRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Plus,
  Check,
  CheckSquare,
  Trash2,
  Sparkles,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { checklist as checklistApi, calendar as calendarApi } from "@/lib/api";
import { ChecklistItem, ChecklistProgress, ChecklistCategory, CreateCalendarEventRequest } from "@/lib/types";
import { cn, formatShortDate, checklistCategoryLabels } from "@/lib/utils";
import { PageLoader, ConfirmDialog, Modal, ProgressBar, TimeInput } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

// Suggested wedding tasks
const WEDDING_TASK_SUGGESTIONS = [
  { title: "Выбрать дату свадьбы", category: "other" as ChecklistCategory },
  { title: "Определить бюджет", category: "other" as ChecklistCategory },
  { title: "Составить список гостей", category: "other" as ChecklistCategory },
  { title: "Забронировать ресторан/банкетный зал", category: "venue" as ChecklistCategory },
  { title: "Найти фотографа", category: "other" as ChecklistCategory },
  { title: "Найти видеографа", category: "other" as ChecklistCategory },
  { title: "Заказать свадебное платье", category: "attire" as ChecklistCategory },
  { title: "Выбрать костюм жениха", category: "attire" as ChecklistCategory },
  { title: "Найти ведущего", category: "entertainment" as ChecklistCategory },
  { title: "Заказать музыку/DJ", category: "entertainment" as ChecklistCategory },
  { title: "Выбрать флориста и декор", category: "decor" as ChecklistCategory },
  { title: "Заказать свадебный торт", category: "food" as ChecklistCategory },
  { title: "Организовать транспорт", category: "other" as ChecklistCategory },
  { title: "Подать заявление в ЗАГС", category: "documents" as ChecklistCategory },
  { title: "Разослать приглашения", category: "other" as ChecklistCategory },
  { title: "Собрать RSVP от гостей", category: "other" as ChecklistCategory },
  { title: "Финальная примерка платья", category: "attire" as ChecklistCategory },
  { title: "Репетиция церемонии", category: "other" as ChecklistCategory },
  { title: "Подготовить кольца", category: "other" as ChecklistCategory },
  { title: "Организовать девичник/мальчишник", category: "entertainment" as ChecklistCategory },
];

export default function ChecklistPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const highlightTaskId = searchParams.get("task");
  const { t, tLabel } = useTranslation();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [prefillSuggestion, setPrefillSuggestion] = useState<{ title: string; category: ChecklistCategory } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [highlightedTask, setHighlightedTask] = useState<string | null>(highlightTaskId);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadData();
  }, [eventId]);

  // Scroll to highlighted task when data loads
  useEffect(() => {
    if (highlightedTask && items.length > 0 && taskRefs.current[highlightedTask]) {
      taskRefs.current[highlightedTask]?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Clear highlight after 3 seconds
      const timeout = setTimeout(() => setHighlightedTask(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedTask, items]);

  async function loadData() {
    try {
      const [itemsData, progressData] = await Promise.all([
        checklistApi.list(eventId),
        checklistApi.getProgress(eventId),
      ]);
      setItems(itemsData || []);
      setProgress(progressData || { total: 0, completed: 0, percent: 0 });
    } catch (error) {
      console.error("Failed to load checklist:", error);
      toast.error(t("checklist.loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to recalculate progress locally (avoids extra API call)
  const updateProgress = (newItems: ChecklistItem[]) => {
    const total = newItems.length;
    const completed = newItems.filter(i => i.isCompleted).length;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    setProgress({ total, completed, percent });
  };

  const handleToggle = async (item: ChecklistItem) => {
    // Optimistic update
    const newItems = items.map((i) =>
      i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i
    );
    setItems(newItems);
    updateProgress(newItems);

    try {
      await checklistApi.toggle(eventId, item.id, !item.isCompleted);
    } catch (error) {
      // Revert on error
      setItems(items);
      updateProgress(items);
      const err = error as Error;
      toast.error(err.message || t("checklist.updateError"));
    }
  };

  const handleAdd = async (data: {
    title: string;
    category: ChecklistCategory;
    dueDate?: string;
    description?: string;
  }) => {
    try {
      const newItem = await checklistApi.create(eventId, data);
      const newItems = [...items, newItem];
      setItems(newItems);
      updateProgress(newItems);
      toast.success(t("checklist.taskAdded"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("checklist.addError"));
    }
  };

  const handleUpdate = async (itemId: string, data: {
    title?: string;
    category?: ChecklistCategory;
    dueDate?: string;
    description?: string;
  }) => {
    try {
      const updated = await checklistApi.update(eventId, itemId, data);
      setItems((prev) => prev.map((i) => i.id === itemId ? updated : i));
      setEditingItem(null);
      toast.success(t("checklist.taskUpdated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("checklist.updateError"));
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      await checklistApi.delete(eventId, deleteItemId);
      const newItems = items.filter((i) => i.id !== deleteItemId);
      setItems(newItems);
      updateProgress(newItems);
      setDeleteItemId(null);
      toast.success(t("checklist.taskDeleted"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("checklist.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyTemplate = async () => {
    setIsApplyingTemplate(true);
    try {
      const result = await checklistApi.applyTemplate(eventId);
      toast.success(t("checklist.tasksFromTemplate").replace("{count}", result.count.toString()));
      // Template adds items, need to reload to get them
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("checklist.templateError"));
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "pending" && item.isCompleted) return false;
    if (filter === "completed" && !item.isCompleted) return false;
    return true;
  });

  // Get suggestions that haven't been added yet
  const existingTitles = new Set(items.map(i => i.title.toLowerCase()));
  const availableSuggestions = WEDDING_TASK_SUGGESTIONS.filter(
    s => !existingTitles.has(s.title.toLowerCase())
  );

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">{t("checklist.title")}</h1>
          <p className="text-caption mt-1">
            {t("checklist.description")}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("checklist.addTask")}</span>
          <span className="sm:hidden">{t("checklist.addTaskShort")}</span>
        </button>
      </div>

      {/* Progress */}
      {progress && progress.total > 0 && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("checklist.progress")}</p>
              <p className="text-xl sm:text-2xl font-bold">
                {progress.completed} {t("common.of")} {progress.total}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {Math.round(progress.percent)}%
            </div>
          </div>
          <ProgressBar
            value={progress.completed}
            max={progress.total}
            color="primary"
            size="md"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
        {[
          { key: "all", label: t("checklist.filterAll") },
          { key: "pending", label: t("checklist.incomplete") },
          { key: "completed", label: t("checklist.completed") },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={cn(
              "chip",
              filter === f.key && "chip-active"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Checklist */}
      {items.length === 0 ? (
        <div className="card text-center py-12">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("checklist.emptyTitle")}</h3>
          <p className="text-muted-foreground mb-6">
            {t("checklist.emptyDescription")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleApplyTemplate}
              disabled={isApplyingTemplate}
              className="btn-primary btn-md"
            >
              <Sparkles className="w-4 h-4" />
              {isApplyingTemplate ? t("checklist.applying") : t("checklist.applyTemplate")}
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-outline btn-md">
              <Plus className="w-4 h-4" />
              {t("checklist.addManually")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-3">
            {filteredItems.map((item) => (
              <ChecklistCard
                key={item.id}
                ref={(el) => { taskRefs.current[item.id] = el; }}
                item={item}
                isHighlighted={highlightedTask === item.id}
                onToggle={() => handleToggle(item)}
                onEdit={() => setEditingItem(item)}
                onDelete={() => setDeleteItemId(item.id)}
                t={t}
                tLabel={tLabel}
              />
            ))}
          </div>

          {/* Desktop: Row layout */}
          <div className="hidden sm:block card p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {filteredItems.map((item) => (
                <ChecklistRow
                  key={item.id}
                  ref={(el) => { taskRefs.current[item.id] = el; }}
                  item={item}
                  isHighlighted={highlightedTask === item.id}
                  onToggle={() => handleToggle(item)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => setDeleteItemId(item.id)}
                  t={t}
                  tLabel={tLabel}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <TaskModal
          eventId={eventId}
          onClose={() => { setShowAddModal(false); setPrefillSuggestion(null); }}
          onSubmit={handleAdd}
          suggestions={availableSuggestions}
          prefillSuggestion={prefillSuggestion}
          onSelectSuggestion={(s) => setPrefillSuggestion(s)}
          t={t}
          tLabel={tLabel}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <TaskModal
          eventId={eventId}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={(data) => handleUpdate(editingItem.id, data)}
          suggestions={[]}
          t={t}
          tLabel={tLabel}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDelete}
        title={t("checklist.deleteConfirm")}
        description={t("checklist.deleteDescription")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

// Mobile card component
const ChecklistCard = forwardRef<HTMLDivElement, {
  item: ChecklistItem;
  isHighlighted?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
  tLabel: (ru: string, kz?: string) => string;
}>(({ item, isHighlighted, onToggle, onEdit, onDelete, t, tLabel }, ref) => {
  const categoryLabel = checklistCategoryLabels[item.category];

  // Calculate days until deadline
  let daysUntil: number | null = null;
  let isOverdue = false;
  let isUrgent = false;

  if (item.dueDate && !item.isCompleted) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(item.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isOverdue = daysUntil < 0;
    isUrgent = daysUntil >= 0 && daysUntil <= 3;
  }

  const getDeadlineLabel = () => {
    if (daysUntil === null) return null;
    if (isOverdue) return t("checklist.overdueBy").replace("{count}", Math.abs(daysUntil).toString());
    if (daysUntil === 0) return t("checklist.today");
    if (daysUntil === 1) return t("checklist.tomorrow");
    return formatShortDate(item.dueDate!);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "card p-4 transition-all touch-manipulation",
        item.isCompleted
          ? "bg-emerald-50/80 border-emerald-200"
          : isOverdue
            ? "bg-red-50/80 border-red-200"
            : isUrgent
              ? "bg-amber-50/80 border-amber-200"
              : "",
        isHighlighted && "ring-2 ring-primary ring-offset-2 animate-pulse"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
            item.isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-muted-foreground/30 active:border-primary active:bg-primary/10"
          )}
        >
          {item.isCompleted && <Check className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-semibold",
              item.isCompleted && "line-through text-muted-foreground"
            )}
          >
            {item.title}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {categoryLabel ? tLabel(categoryLabel.ru, categoryLabel.kz) : item.category}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2.5 text-muted-foreground hover:text-primary active:bg-primary/10 rounded-xl transition-colors"
            aria-label={t("common.edit")}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 text-muted-foreground hover:text-red-500 active:bg-red-50 rounded-xl transition-colors"
            aria-label={t("common.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
      )}

      {/* Deadline badge */}
      {item.dueDate && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
            item.isCompleted
              ? "bg-emerald-100 text-emerald-700"
              : isOverdue
                ? "bg-red-100 text-red-700"
                : isUrgent
                  ? "bg-amber-100 text-amber-700"
                  : "bg-secondary text-muted-foreground"
          )}>
            <CalendarDays className="w-3.5 h-3.5" />
            {getDeadlineLabel()}
          </span>
          {!item.isCompleted && (isOverdue || isUrgent) && (
            <span className={cn(
              "text-xs font-medium",
              isOverdue ? "text-red-600" : "text-amber-600"
            )}>
              {isOverdue ? t("checklist.overdue") : t("checklist.urgentSoon")}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

ChecklistCard.displayName = "ChecklistCard";

// Desktop row component
const ChecklistRow = forwardRef<HTMLDivElement, {
  item: ChecklistItem;
  isHighlighted?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
  tLabel: (ru: string, kz?: string) => string;
}>(({ item, isHighlighted, onToggle, onEdit, onDelete, t, tLabel }, ref) => {
  const categoryLabel = checklistCategoryLabels[item.category];

  // Calculate days until deadline
  let daysUntil: number | null = null;
  let isOverdue = false;
  let isUrgent = false;

  if (item.dueDate && !item.isCompleted) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(item.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isOverdue = daysUntil < 0;
    isUrgent = daysUntil >= 0 && daysUntil <= 3;
  }

  const getDeadlineLabel = () => {
    if (daysUntil === null) return null;
    if (isOverdue) return t("checklist.overdueBy").replace("{count}", Math.abs(daysUntil).toString());
    if (daysUntil === 0) return t("checklist.today");
    if (daysUntil === 1) return t("checklist.tomorrow");
    return formatShortDate(item.dueDate!);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 p-4 transition-colors group",
        item.isCompleted
          ? "bg-emerald-50/50"
          : isOverdue
            ? "bg-red-50/50"
            : isUrgent
              ? "bg-amber-50/50"
              : "hover:bg-secondary/50",
        isHighlighted && "ring-2 ring-primary ring-inset animate-pulse"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          item.isCompleted
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
        )}
      >
        {item.isCompleted && <Check className="w-4 h-4" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium",
            item.isCompleted && "line-through text-muted-foreground"
          )}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{categoryLabel ? tLabel(categoryLabel.ru, categoryLabel.kz) : item.category}</span>
          {item.dueDate && (
            <>
              <span>•</span>
              <span className={cn(
                "flex-shrink-0",
                !item.isCompleted && isOverdue && "text-red-600 font-medium",
                !item.isCompleted && isUrgent && "text-amber-600 font-medium"
              )}>
                {getDeadlineLabel()}
              </span>
            </>
          )}
        </div>
      </div>
      {!item.isCompleted && (isOverdue || isUrgent) && (
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
          isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        )}>
          {isOverdue ? t("checklist.overdue") : t("checklist.soon")}
        </span>
      )}
      <button
        onClick={onEdit}
        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title={t("common.edit")}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title={t("common.delete")}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
});

ChecklistRow.displayName = "ChecklistRow";

function TaskModal({
  eventId,
  item,
  onClose,
  onSubmit,
  suggestions = [],
  prefillSuggestion,
  onSelectSuggestion,
  t,
  tLabel,
}: {
  eventId: string;
  item?: ChecklistItem;
  onClose: () => void;
  onSubmit: (data: { title: string; category: ChecklistCategory; dueDate?: string; description?: string }) => void;
  suggestions?: { title: string; category: ChecklistCategory }[];
  prefillSuggestion?: { title: string; category: ChecklistCategory } | null;
  onSelectSuggestion?: (s: { title: string; category: ChecklistCategory } | null) => void;
  t: (key: string) => string;
  tLabel: (ru: string, kz?: string) => string;
}) {
  const isEditing = !!item;
  const showSuggestions = !isEditing && suggestions.length > 0 && !prefillSuggestion;

  const [mode, setMode] = useState<"suggestions" | "form">(showSuggestions ? "suggestions" : "form");
  const [title, setTitle] = useState(item?.title || prefillSuggestion?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [category, setCategory] = useState<ChecklistCategory>(
    item?.category || prefillSuggestion?.category || "other"
  );
  const [dueDate, setDueDate] = useState(item?.dueDate?.split("T")[0] || "");
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [calendarTime, setCalendarTime] = useState("");
  const [autoCompleteTask, setAutoCompleteTask] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When prefillSuggestion changes, switch to form mode
  useEffect(() => {
    if (prefillSuggestion) {
      setTitle(prefillSuggestion.title);
      setCategory(prefillSuggestion.category);
      setMode("form");
    }
  }, [prefillSuggestion]);

  const handleSelectSuggestion = (suggestion: { title: string; category: ChecklistCategory }) => {
    // Switch to form mode with prefilled data so user can add details
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    } else {
      setTitle(suggestion.title);
      setCategory(suggestion.category);
      setMode("form");
    }
  };

  const handleQuickAdd = (suggestion: { title: string; category: ChecklistCategory }) => {
    // Quick add without details
    onSubmit({ title: suggestion.title, category: suggestion.category });
    setAddedTasks(prev => {
      const newSet = new Set(prev);
      newSet.add(suggestion.title);
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Add/update the task
      onSubmit({
        title: title.trim(),
        category,
        dueDate: dueDate || undefined,
        description: description.trim() || undefined,
      });

      // Create calendar event if checkbox is checked and date is set (only for new tasks)
      if (!isEditing && addToCalendar && dueDate) {
        const calendarData: CreateCalendarEventRequest = {
          title: title.trim(),
          type: "deadline",
          date: dueDate,
          time: calendarTime || undefined,
          autoCompleteTask,
        };
        await calendarApi.create(eventId, calendarData);
        toast.success(t("checklist.calendarEventAdded"));
      }

      onClose();
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      // Task was still added, just calendar event failed
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: ChecklistCategory[] = [
    "venue",
    "attire",
    "decor",
    "food",
    "entertainment",
    "documents",
    "other",
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? t("checklist.editTask") : t("checklist.addTask")}
      size="md"
    >
      {/* Tabs - only show for new tasks with suggestions */}
      {!isEditing && suggestions.length > 0 && (
        <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6">
          <button
            onClick={() => { setMode("suggestions"); onSelectSuggestion?.(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              mode === "suggestions"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-4 h-4" />
            {t("checklist.suggested")}
          </button>
          <button
            onClick={() => setMode("form")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              mode === "form"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="w-4 h-4" />
            {prefillSuggestion ? t("checklist.withDetails") : t("checklist.customTask")}
          </button>
        </div>
      )}

      {mode === "suggestions" && !isEditing ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("checklist.allSuggestionsAdded")}</p>
              <button
                onClick={() => setMode("form")}
                className="text-primary hover:underline mt-2"
              >
                {t("checklist.createCustomTask")}
              </button>
            </div>
          ) : (
            suggestions.map((suggestion) => {
              const isAdded = addedTasks.has(suggestion.title);
              const categoryLabel = checklistCategoryLabels[suggestion.category];
              return (
                <div
                  key={suggestion.title}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    isAdded
                      ? "bg-emerald-50 border-emerald-200"
                      : "border-border hover:border-primary/30 hover:bg-secondary/50"
                  )}
                >
                  <div>
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabel ? tLabel(categoryLabel.ru, categoryLabel.kz) : suggestion.category}
                    </p>
                  </div>
                  {isAdded ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                      <Check className="w-4 h-4" />
                      {t("checklist.added")}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="btn-outline btn-sm text-xs"
                        title={t("checklist.withDetails")}
                      >
                        <Pencil className="w-3 h-3" />
                        {t("checklist.details")}
                      </button>
                      <button
                        onClick={() => handleQuickAdd(suggestion)}
                        className="btn-primary btn-sm text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        {t("checklist.quick")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("checklist.taskRequired")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder={t("checklist.taskPlaceholder")}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("common.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[60px] resize-none"
              placeholder={t("checklist.descriptionPlaceholder")}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("budget.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
              className="input"
            >
              {categories.map((cat) => {
                const label = checklistCategoryLabels[cat];
                return (
                  <option key={cat} value={cat}>
                    {label ? tLabel(label.ru, label.kz) : cat}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("checklist.dueDate")}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Add to Calendar option - only for new tasks */}
          {!isEditing && dueDate && (
            <div className="space-y-3 p-3 bg-secondary/50 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("checklist.addToCalendar")}</span>
              </label>

              {addToCalendar && (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t("checklist.calendarTime")}</label>
                    <TimeInput
                      value={calendarTime}
                      onChange={setCalendarTime}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCompleteTask}
                      onChange={(e) => setAutoCompleteTask(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("checklist.autoCompleteTask")}
                    </span>
                  </label>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-outline btn-md">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={isSubmitting || !title.trim()} className="btn-primary btn-md">
              {isSubmitting ? "..." : isEditing ? t("common.save") : t("common.add")}
            </button>
          </div>
        </form>
      )}

      {mode === "suggestions" && (
        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="btn-outline btn-md">
            {t("common.close")}
          </button>
        </div>
      )}
    </Modal>
  );
}
