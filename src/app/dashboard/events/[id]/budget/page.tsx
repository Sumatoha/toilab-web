"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Wallet,
  PieChart,
  Trash2,
  Pencil,
  Check,
  Target,
  CreditCard,
} from "lucide-react";
import { expenses as expensesApi } from "@/lib/api";
import { Expense, BudgetSummary, ExpenseCategory, ExpenseStatus, UpdateExpenseRequest } from "@/lib/types";
import { cn, formatCurrency, expenseCategoryLabels } from "@/lib/utils";
import { PageLoader, ConfirmDialog, Modal, ModalFooter, ProgressBar, CircularProgress } from "@/components/ui";
import toast from "react-hot-toast";

const categoryColors: Record<ExpenseCategory, { bg: string; text: string; accent: string }> = {
  venue: { bg: "bg-blue-100", text: "text-blue-700", accent: "bg-blue-500" },
  catering: { bg: "bg-orange-100", text: "text-orange-700", accent: "bg-orange-500" },
  decoration: { bg: "bg-pink-100", text: "text-pink-700", accent: "bg-pink-500" },
  photo: { bg: "bg-purple-100", text: "text-purple-700", accent: "bg-purple-500" },
  video: { bg: "bg-indigo-100", text: "text-indigo-700", accent: "bg-indigo-500" },
  music: { bg: "bg-cyan-100", text: "text-cyan-700", accent: "bg-cyan-500" },
  attire: { bg: "bg-rose-100", text: "text-rose-700", accent: "bg-rose-500" },
  transport: { bg: "bg-slate-100", text: "text-slate-700", accent: "bg-slate-500" },
  invitation: { bg: "bg-teal-100", text: "text-teal-700", accent: "bg-teal-500" },
  gift: { bg: "bg-amber-100", text: "text-amber-700", accent: "bg-amber-500" },
  beauty: { bg: "bg-fuchsia-100", text: "text-fuchsia-700", accent: "bg-fuchsia-500" },
  other: { bg: "bg-gray-100", text: "text-gray-700", accent: "bg-gray-500" },
};

export default function BudgetPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [expensesData, summaryData] = await Promise.all([
        expensesApi.list(eventId),
        expensesApi.getBudgetSummary(eventId),
      ]);
      setExpensesList(expensesData || []);
      setSummary(summaryData || { totalPlanned: 0, totalActual: 0, totalPaid: 0, byCategory: [] });
    } catch (error) {
      console.error("Failed to load budget:", error);
      toast.error("Не удалось загрузить бюджет");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddExpense = async (data: {
    category: ExpenseCategory;
    title: string;
    plannedAmount: number;
  }) => {
    try {
      const newExpense = await expensesApi.create(eventId, data);
      setExpensesList((prev) => [...prev, newExpense]);
      setShowAddModal(false);
      toast.success("Расход добавлен");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить расход");
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    setIsDeleting(true);
    try {
      await expensesApi.delete(eventId, deleteExpenseId);
      setExpensesList((prev) => prev.filter((e) => e.id !== deleteExpenseId));
      setDeleteExpenseId(null);
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить расход");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateExpense = async (data: UpdateExpenseRequest) => {
    if (!editingExpense) return;
    try {
      const updated = await expensesApi.update(eventId, editingExpense.id, data);
      setExpensesList((prev) =>
        prev.map((e) => (e.id === editingExpense.id ? updated : e))
      );
      setEditingExpense(null);
      toast.success("Расход обновлён");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить расход");
    }
  };

  const filteredExpenses = selectedCategory
    ? expensesList.filter((e) => e.category === selectedCategory)
    : expensesList;

  if (isLoading) {
    return <PageLoader />;
  }

  const budgetProgress = summary && summary.totalPlanned > 0
    ? (summary.totalPaid / summary.totalPlanned) * 100
    : 0;
  const remaining = (summary?.totalPlanned || 0) - (summary?.totalPaid || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Бюджет</h1>
          <p className="text-caption mt-1">
            Отслеживайте расходы по категориям
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          Добавить расход
        </button>
      </div>

      {/* Budget Overview */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Budget Card */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Обзор бюджета</h2>
                <p className="text-sm text-muted-foreground">
                  {Math.round(budgetProgress)}% от запланированного бюджета использовано
                </p>
              </div>
              <CircularProgress
                value={summary.totalPaid}
                max={summary.totalPlanned || 1}
                size={80}
                color={budgetProgress > 90 ? "warning" : "success"}
              />
            </div>

            <ProgressBar
              value={summary.totalPaid}
              max={summary.totalPlanned || 1}
              color={budgetProgress > 90 ? "warning" : "success"}
              size="lg"
              className="mb-6"
            />

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">Запланировано</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(summary.totalPlanned)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600 font-medium">Оплачено</span>
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(summary.totalPaid)}
                </div>
              </div>
              <div className={cn(
                "p-4 rounded-xl",
                remaining >= 0 ? "bg-amber-50" : "bg-red-50"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className={cn("w-4 h-4", remaining >= 0 ? "text-amber-600" : "text-red-600")} />
                  <span className={cn("text-sm font-medium", remaining >= 0 ? "text-amber-600" : "text-red-600")}>
                    {remaining >= 0 ? "Осталось" : "Перерасход"}
                  </span>
                </div>
                <div className={cn("text-2xl font-bold", remaining >= 0 ? "text-amber-700" : "text-red-700")}>
                  {formatCurrency(Math.abs(remaining))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Статистика</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Всего расходов</span>
                <span className="font-semibold">{expensesList.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Категорий</span>
                <span className="font-semibold">{summary.byCategory.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Оплачено позиций</span>
                <span className="font-semibold">
                  {expensesList.filter(e => e.status === 'paid').length}
                </span>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Средний расход</span>
                  <span className="font-semibold">
                    {expensesList.length > 0
                      ? formatCurrency(Math.round(summary.totalPlanned / expensesList.length))
                      : "—"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">По категориям</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all duration-150",
              selectedCategory === null
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent bg-secondary hover:bg-secondary/80"
            )}
          >
            <p className="font-semibold">Все</p>
            <p className="text-sm text-muted-foreground">
              {expensesList.length} расходов
            </p>
          </button>
          {summary?.byCategory.map((cat) => {
            const label = expenseCategoryLabels[cat.category];
            const colors = categoryColors[cat.category] || categoryColors.other;
            const catProgress = cat.planned > 0 ? (cat.paid / cat.planned) * 100 : 0;

            return (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all duration-150 relative overflow-hidden",
                  selectedCategory === cat.category
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent bg-secondary hover:bg-secondary/80"
                )}
              >
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                  colors.accent
                )} />
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs", colors.bg, colors.text)}>
                    {(label?.ru || cat.category).charAt(0)}
                  </div>
                  <p className="font-medium text-sm">{label?.ru || cat.category}</p>
                </div>
                <p className="text-lg font-bold">
                  {formatCurrency(cat.planned)}
                </p>
                <ProgressBar
                  value={cat.paid}
                  max={cat.planned || 1}
                  size="sm"
                  color={catProgress > 100 ? "error" : "primary"}
                  className="mt-2"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses list */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {selectedCategory
              ? expenseCategoryLabels[selectedCategory]?.ru || selectedCategory
              : "Все расходы"}
          </h2>
        </div>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Нет расходов</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" />
              Добавить расход
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={() => setEditingExpense(expense)}
                onDelete={() => setDeleteExpenseId(expense.id)}
                className={`animate-in stagger-${Math.min(index + 1, 4)}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddExpense}
        />
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleUpdateExpense}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={handleDeleteExpense}
        title="Удалить расход?"
        description="Расход будет удалён из бюджета"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function ExpenseRow({
  expense,
  onEdit,
  onDelete,
  className,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const label = expenseCategoryLabels[expense.category];
  const colors = categoryColors[expense.category] || categoryColors.other;
  const plannedAmount = Number(expense.plannedAmount) || 0;
  const paidAmount = Number(expense.paidAmount) || 0;
  const paidPercent =
    plannedAmount > 0
      ? Math.round((paidAmount / plannedAmount) * 100)
      : 0;

  const statusLabels: Record<ExpenseStatus, { text: string; class: string; icon: typeof Check }> = {
    planned: { text: "Запланировано", class: "badge-default", icon: Target },
    booked: { text: "Забронировано", class: "badge-info", icon: CreditCard },
    paid: { text: "Оплачено", class: "badge-success", icon: Check },
  };

  const status = statusLabels[expense.status] || statusLabels.planned;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors cursor-pointer group",
        className
      )}
      onClick={onEdit}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        colors.bg
      )}>
        <span className={cn("text-sm font-bold", colors.text)}>
          {(label?.ru || expense.category).charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{expense.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {label?.ru || expense.category}
          </span>
          <span className={cn("inline-flex items-center gap-1", status.class)}>
            <StatusIcon className="w-3 h-3" />
            {status.text}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(plannedAmount)}</p>
        {paidAmount > 0 && (
          <p className="text-sm text-emerald-600">
            {formatCurrency(paidAmount)} оплачено
          </p>
        )}
        {paidAmount === 0 && plannedAmount > 0 && (
          <p className="text-sm text-muted-foreground">
            {paidPercent}% оплачено
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Редактировать"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddExpenseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { category: ExpenseCategory; title: string; plannedAmount: number }) => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>("venue");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      category,
      title: title.trim(),
      plannedAmount: parseInt(amount) || 0,
    });
  };

  const categories: ExpenseCategory[] = [
    "venue",
    "catering",
    "decoration",
    "photo",
    "video",
    "music",
    "attire",
    "transport",
    "invitation",
    "gift",
    "beauty",
    "other",
  ];

  return (
    <Modal isOpen onClose={onClose} title="Добавить расход">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Категория</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const colors = categoryColors[cat];
              const label = expenseCategoryLabels[cat]?.ru || cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "p-2 rounded-lg text-xs font-medium transition-all",
                    category === cat
                      ? cn(colors.bg, colors.text, "ring-2 ring-primary ring-offset-1")
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Название *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Например: Зал на 200 человек"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Сумма (тенге)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            placeholder="500000"
          />
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            Отмена
          </button>
          <button type="submit" className="btn-primary btn-md">
            Добавить
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function EditExpenseModal({
  expense,
  onClose,
  onSave,
}: {
  expense: Expense;
  onClose: () => void;
  onSave: (data: UpdateExpenseRequest) => void;
}) {
  const [title, setTitle] = useState(expense.title);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [plannedAmount, setPlannedAmount] = useState(expense.plannedAmount.toString());
  const [actualAmount, setActualAmount] = useState(expense.actualAmount.toString());
  const [paidAmount, setPaidAmount] = useState(expense.paidAmount.toString());
  const [status, setStatus] = useState<ExpenseStatus>(expense.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      category,
      plannedAmount: parseInt(plannedAmount) || 0,
      actualAmount: parseInt(actualAmount) || 0,
      paidAmount: parseInt(paidAmount) || 0,
      status,
    });
  };

  const handleMarkPaid = () => {
    const amount = parseInt(plannedAmount) || 0;
    setPaidAmount(amount.toString());
    setActualAmount(amount.toString());
    setStatus("paid");
  };

  const categories: ExpenseCategory[] = [
    "venue", "catering", "decoration", "photo", "video",
    "music", "attire", "transport", "invitation", "gift", "beauty", "other",
  ];

  return (
    <Modal isOpen onClose={onClose} title="Редактировать расход" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1.5">Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1.5">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {expenseCategoryLabels[cat]?.ru || cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-3">Суммы (тенге)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Планировали</label>
              <input
                type="number"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Фактически</label>
              <input
                type="number"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Оплачено</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className="block text-sm font-medium mb-2">Статус</label>
          <div className="flex gap-2">
            {[
              { value: "planned", label: "Запланировано", icon: Target },
              { value: "booked", label: "Забронировано", icon: CreditCard },
              { value: "paid", label: "Оплачено", icon: Check },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value as ExpenseStatus)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all",
                    status === s.value
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={handleMarkPaid}
            className="btn-outline btn-sm w-full"
          >
            <Check className="w-4 h-4" />
            Отметить как полностью оплачено
          </button>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            Отмена
          </button>
          <button type="submit" className="btn-primary btn-md">
            Сохранить
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
