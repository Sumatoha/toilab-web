"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Check,
  CheckSquare,
  Trash2,
  Sparkles,
} from "lucide-react";
import { checklist as checklistApi } from "@/lib/api";
import { ChecklistItem, ChecklistProgress, ChecklistCategory } from "@/lib/types";
import { cn, formatShortDate, checklistCategoryLabels } from "@/lib/utils";
import { PageLoader, ConfirmDialog, Modal, ModalFooter, ProgressBar } from "@/components/ui";
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
  const eventId = params.id as string;

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      loadData();
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
      toast.success("Задача добавлена");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить задачу");
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    setIsDeleting(true);
    try {
      await checklistApi.delete(eventId, deleteItemId);
      setItems((prev) => prev.filter((i) => i.id !== deleteItemId));
      setDeleteItemId(null);
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить задачу");
    } finally {
      setIsDeleting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Чек-лист</h1>
          <p className="text-caption mt-1">
            Отслеживайте задачи по подготовке к свадьбе
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          Добавить задачу
        </button>
      </div>

      {/* Progress */}
      {progress && progress.total > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Прогресс</p>
              <p className="text-2xl font-bold">
                {progress.completed} из {progress.total}
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">
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
      <div className="flex gap-2">
        {[
          { key: "all", label: "Все" },
          { key: "pending", label: "Не выполнено" },
          { key: "completed", label: "Выполнено" },
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
          <h3 className="text-lg font-semibold mb-2">Чек-лист пуст</h3>
          <p className="text-muted-foreground mb-6">
            Добавьте первую задачу из предложенных или создайте свою
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Добавить задачу
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-border">
            {filteredItems.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => setDeleteItemId(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          suggestions={availableSuggestions}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        onConfirm={handleDelete}
        title="Удалить задачу?"
        description="Задача будет удалена из чек-листа"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
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
        "flex items-center gap-4 p-4 transition-colors group",
        item.isCompleted
          ? "bg-emerald-50/50"
          : "hover:bg-secondary/50"
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
          <span>{categoryLabel?.ru || item.category}</span>
          {item.dueDate && (
            <>
              <span>•</span>
              <span>{formatShortDate(item.dueDate)}</span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="Удалить"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddTaskModal({
  onClose,
  onAdd,
  suggestions,
}: {
  onClose: () => void;
  onAdd: (data: { title: string; category: ChecklistCategory; dueDate?: string }) => void;
  suggestions: { title: string; category: ChecklistCategory }[];
}) {
  const [mode, setMode] = useState<"suggestions" | "custom">("suggestions");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChecklistCategory>("other");
  const [dueDate, setDueDate] = useState("");
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());

  const handleAddSuggestion = (suggestion: { title: string; category: ChecklistCategory }) => {
    onAdd({ title: suggestion.title, category: suggestion.category });
    setAddedTasks(prev => new Set([...prev, suggestion.title]));
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      category,
      dueDate: dueDate || undefined,
    });
    setTitle("");
    setDueDate("");
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
    <Modal isOpen onClose={onClose} title="Добавить задачу" size="md">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6">
        <button
          onClick={() => setMode("suggestions")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            mode === "suggestions"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Предложенные
        </button>
        <button
          onClick={() => setMode("custom")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
            mode === "custom"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Plus className="w-4 h-4" />
          Своя задача
        </button>
      </div>

      {mode === "suggestions" ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Все предложенные задачи добавлены!</p>
              <button
                onClick={() => setMode("custom")}
                className="text-primary hover:underline mt-2"
              >
                Создать свою задачу
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
                      {categoryLabel?.ru || suggestion.category}
                    </p>
                  </div>
                  {isAdded ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                      <Check className="w-4 h-4" />
                      Добавлено
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddSuggestion(suggestion)}
                      className="btn-outline btn-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmitCustom} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Задача *</label>
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
            <label className="block text-sm font-medium mb-1.5">Категория</label>
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
            <label className="block text-sm font-medium mb-1.5">Срок (опционально)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="btn-primary btn-md">
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
        </form>
      )}

      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <button onClick={onClose} className="btn-outline btn-md">
          Закрыть
        </button>
      </div>
    </Modal>
  );
}
