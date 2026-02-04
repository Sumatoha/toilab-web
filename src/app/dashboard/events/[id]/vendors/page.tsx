"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Building,
  Phone,
  Instagram,
} from "lucide-react";
import { vendors as vendorsApi } from "@/lib/api";
import { Vendor, VendorSummary, ExpenseCategory, VendorStatus } from "@/lib/types";
import { cn, formatCurrency, expenseCategoryLabels } from "@/lib/utils";
import toast from "react-hot-toast";

const vendorStatusLabels: Record<VendorStatus, { ru: string; color: string }> = {
  contacted: { ru: "На связи", color: "gray" },
  booked: { ru: "Забронирован", color: "blue" },
  deposit_paid: { ru: "Предоплата", color: "yellow" },
  paid: { ru: "Оплачен", color: "green" },
  cancelled: { ru: "Отменен", color: "red" },
};

export default function VendorsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [vendorsData, summaryData] = await Promise.all([
        vendorsApi.list(eventId),
        vendorsApi.getSummary(eventId),
      ]);
      setVendorsList(vendorsData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      toast.error("Не удалось загрузить подрядчиков");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAdd = async (data: {
    category: ExpenseCategory;
    name: string;
    phone?: string;
    instagram?: string;
    totalAmount?: number;
  }) => {
    try {
      const newVendor = await vendorsApi.create(eventId, data);
      setVendorsList((prev) => [...prev, newVendor]);
      setShowAddModal(false);
      toast.success("Подрядчик добавлен");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить подрядчика");
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm("Удалить подрядчика?")) return;

    try {
      await vendorsApi.delete(eventId, vendorId);
      setVendorsList((prev) => prev.filter((v) => v.id !== vendorId));
      toast.success("Подрядчик удален");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить подрядчика");
    }
  };

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
          <h1 className="text-2xl font-display font-bold">Подрядчики</h1>
          <p className="text-muted-foreground">
            Управляйте контактами и оплатами подрядчиков
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4 mr-2" />
          Добавить подрядчика
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-muted-foreground">Всего</p>
            <p className="text-2xl font-bold">{summary.totalVendors}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Общая сумма</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Оплачено</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">К оплате</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
          </div>
        </div>
      )}

      {/* Vendors list */}
      <div className="card">
        {vendorsList.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Нет подрядчиков</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-outline btn-sm mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить первого подрядчика
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {vendorsList.map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
                onDelete={() => handleDelete(vendor.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddVendorModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}

function VendorRow({ vendor, onDelete }: { vendor: Vendor; onDelete: () => void }) {
  const categoryLabel = expenseCategoryLabels[vendor.category];
  const statusLabel = vendorStatusLabels[vendor.status];
  const paidPercent =
    vendor.totalAmount > 0
      ? Math.round((vendor.paidAmount / vendor.totalAmount) * 100)
      : 0;

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Building className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{vendor.name}</p>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              statusLabel.color === "gray" && "bg-gray-100 text-gray-700",
              statusLabel.color === "blue" && "bg-blue-100 text-blue-700",
              statusLabel.color === "yellow" && "bg-yellow-100 text-yellow-700",
              statusLabel.color === "green" && "bg-green-100 text-green-700",
              statusLabel.color === "red" && "bg-red-100 text-red-700"
            )}
          >
            {statusLabel.ru}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {categoryLabel?.ru || vendor.category}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              {vendor.phone}
            </a>
          )}
          {vendor.instagram && (
            <a
              href={`https://instagram.com/${vendor.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Instagram className="w-3 h-3" />
              @{vendor.instagram}
            </a>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatCurrency(vendor.totalAmount)}</p>
        <p className="text-sm text-muted-foreground">{paidPercent}% оплачено</p>
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

function AddVendorModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: {
    category: ExpenseCategory;
    name: string;
    phone?: string;
    instagram?: string;
    totalAmount?: number;
  }) => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>("venue");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      category,
      name: name.trim(),
      phone: phone.trim() || undefined,
      instagram: instagram.trim() || undefined,
      totalAmount: parseInt(amount) || undefined,
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
    "beauty",
    "other",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Добавить подрядчика</h2>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Название компании или имя"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+7 777 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="input"
              placeholder="username"
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
