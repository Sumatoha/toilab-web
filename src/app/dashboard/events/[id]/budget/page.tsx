"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
} from "lucide-react";
import { expenses as expensesApi } from "@/lib/api";
import { Expense, BudgetSummary, ExpenseCategory } from "@/lib/types";
import { cn, formatCurrency, expenseCategoryLabels } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BudgetPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [expensesData, summaryData] = await Promise.all([
        expensesApi.list(eventId),
        expensesApi.getBudgetSummary(eventId),
      ]);
      setExpensesList(expensesData);
      setSummary(summaryData);
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
      loadData(); // Reload summary
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить расход");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Удалить расход?")) return;

    try {
      await expensesApi.delete(eventId, expenseId);
      setExpensesList((prev) => prev.filter((e) => e.id !== expenseId));
      toast.success("Расход удален");
      loadData(); // Reload summary
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить расход");
    }
  };

  const filteredExpenses = selectedCategory
    ? expensesList.filter((e) => e.category === selectedCategory)
    : expensesList;

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
          <h1 className="text-2xl font-display font-bold">Бюджет</h1>
          <p className="text-muted-foreground">
            Отслеживайте расходы по категориям
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4 mr-2" />
          Добавить расход
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Запланировано</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalPlanned)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Фактически</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalActual)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Оплачено</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">По категориям</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "p-3 rounded-lg border text-left transition-colors",
              selectedCategory === null
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <p className="font-medium">Все</p>
            <p className="text-sm text-muted-foreground">
              {expensesList.length} расходов
            </p>
          </button>
          {summary?.byCategory.map((cat) => {
            const label = expenseCategoryLabels[cat.category];
            return (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  selectedCategory === cat.category
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <p className="font-medium">{label?.ru || cat.category}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(cat.planned)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses list */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          {selectedCategory
            ? expenseCategoryLabels[selectedCategory]?.ru || selectedCategory
            : "Все расходы"}
        </h2>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет расходов</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onDelete={() => handleDeleteExpense(expense.id)}
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
    </div>
  );
}

function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  const label = expenseCategoryLabels[expense.category];
  const paidPercent =
    expense.plannedAmount > 0
      ? Math.round((expense.paidAmount / expense.plannedAmount) * 100)
      : 0;

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{expense.title}</p>
        <p className="text-sm text-muted-foreground">
          {label?.ru || expense.category}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatCurrency(expense.plannedAmount)}</p>
        <p className="text-sm text-muted-foreground">
          {paidPercent}% оплачено
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
      >
        ×
      </button>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Добавить расход</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Категория</label>
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
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
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
            <label className="block text-sm font-medium mb-1">Сумма (тенге)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="500000"
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
