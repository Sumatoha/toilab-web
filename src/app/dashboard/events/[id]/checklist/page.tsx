"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Check,
  CheckSquare,
} from "lucide-react";
import { checklist as checklistApi } from "@/lib/api";
import { ChecklistItem, ChecklistProgress, ChecklistCategory } from "@/lib/types";
import { cn, formatShortDate, checklistCategoryLabels } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ChecklistPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    loadData();
  }, [eventId]);

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
      toast.error("Не удалось загрузить чек-лист");
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggle = async (item: ChecklistItem) => {
    try {
      await checklistApi.toggle(eventId, item.id, !item.isCompleted);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i
        )
      );
      loadData(); // Reload progress
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить задачу");
    }
  };

  const handleAdd = async (data: {
    title: string;
    category: ChecklistCategory;
    dueDate?: string;
  }) => {
    try {
      const newItem = await checklistApi.create(eventId, data);
      setItems((prev) => [...prev, newItem]);
      setShowAddModal(false);
      toast.success("Задача добавлена");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить задачу");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Удалить задачу?")) return;

    try {
      await checklistApi.delete(eventId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Задача удалена");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить задачу");
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "pending" && item.isCompleted) return false;
    if (filter === "completed" && !item.isCompleted) return false;
    return true;
  });

  // Group by relative days
  const groupedItems = filteredItems.reduce((acc, item) => {
    const key = item.relativeDays;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<number, ChecklistItem[]>);

  const sortedGroups = Object.keys(groupedItems)
    .map(Number)
    .sort((a, b) => b - a);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Чек-лист</h1>
          <p className="text-muted-foreground">
            Отслеживайте задачи по подготовке
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4 mr-2" />
          Добавить задачу
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Прогресс</p>
              <p className="text-2xl font-bold">
                {progress.completed} / {progress.total}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {Math.round(progress.percent)}%
              </p>
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {[
          { key: "all", label: "Все" },
          { key: "pending", label: "Не выполнено" },
          { key: "completed", label: "Выполнено" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              filter === f.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Checklist */}
      {sortedGroups.length === 0 ? (
        <div className="card text-center py-12">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет задач</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map((days) => (
            <div key={days} className="card">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                {days === 0
                  ? "В день мероприятия"
                  : days === -1
                  ? "За 1 день"
                  : days === -7
                  ? "За неделю"
                  : days === -30
                  ? "За месяц"
                  : days === -60
                  ? "За 2 месяца"
                  : days === -90
                  ? "За 3 месяца"
                  : `За ${Math.abs(days)} дней`}
              </h3>
              <div className="space-y-2">
                {groupedItems[days].map((item) => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}

function ChecklistRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const categoryLabel = checklistCategoryLabels[item.category];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        item.isCompleted
          ? "bg-green-50/50 border-green-200"
          : "bg-white border-border hover:border-primary/30"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          item.isCompleted
            ? "bg-green-500 border-green-500 text-white"
            : "border-muted-foreground/30 hover:border-primary"
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
        <p className="text-sm text-muted-foreground">
          {categoryLabel?.ru || item.category}
          {item.dueDate && ` • ${formatShortDate(item.dueDate)}`}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

function AddTaskModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { title: string; category: ChecklistCategory; dueDate?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChecklistCategory>("other");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      category,
      dueDate: dueDate || undefined,
    });
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Добавить задачу</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Задача *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {checklistCategoryLabels[cat]?.ru || cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Срок</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline btn-md flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary btn-md flex-1">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
