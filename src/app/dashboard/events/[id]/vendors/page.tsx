"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Trash2,
  Phone,
  Instagram,
  Edit2,
  Camera,
  Video,
  Mic,
  Music,
  Sparkles,
  Flower2,
  UtensilsCrossed,
  Car,
  Palette,
  MoreHorizontal,
  Guitar,
  LucideIcon,
} from "lucide-react";
import { vendors, expenses } from "@/lib/api";
import { Vendor, VendorStatus, CreateVendorRequest, ExpenseCategory, Expense } from "@/lib/types";
import { cn, formatCurrency, vendorTypeLabels, vendorStatusLabels } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog } from "@/components/ui";
import toast from "react-hot-toast";

const vendorTypeIcons: Record<string, LucideIcon> = {
  photographer: Camera,
  videographer: Video,
  mc: Mic,
  dj: Music,
  stylist: Sparkles,
  florist: Flower2,
  restaurant: UtensilsCrossed,
  band: Guitar,
  decor: Palette,
  transport: Car,
  other: MoreHorizontal,
};

const vendorTypes: string[] = [
  "photographer",
  "videographer",
  "mc",
  "dj",
  "stylist",
  "florist",
  "restaurant",
  "band",
  "decor",
  "transport",
  "other",
];

const vendorStatuses: VendorStatus[] = [
  "contacted",
  "booked",
  "deposit_paid",
  "paid",
  "cancelled",
];

export default function VendorsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [vendorData, expenseData] = await Promise.all([
        vendors.list(eventId),
        expenses.list(eventId),
      ]);
      setVendorList(vendorData || []);
      setAllExpenses(expenseData || []);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      toast.error("Не удалось загрузить подрядчиков");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredVendors = vendorList.filter((v) => {
    if (filterType !== "all" && v.category !== filterType) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddVendor = async (data: CreateVendorRequest) => {
    try {
      const newVendor = await vendors.create(eventId, data);
      setVendorList((prev) => [newVendor, ...prev]);

      // Auto-create expense if vendor has totalAmount
      if (data.totalAmount && data.totalAmount > 0) {
        try {
          const newExpense = await expenses.create(eventId, {
            category: data.category,
            title: data.name,
            vendorId: newVendor.id,
            plannedAmount: data.totalAmount,
            actualAmount: data.totalAmount,
          });
          setAllExpenses((prev) => [newExpense, ...prev]);
        } catch (expenseError) {
          console.error("Failed to create expense for vendor:", expenseError);
          // Don't fail the whole operation, vendor was created successfully
        }
      }

      setShowAddModal(false);
      toast.success(data.totalAmount && data.totalAmount > 0
        ? "Подрядчик добавлен и создан расход"
        : "Подрядчик добавлен"
      );
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить подрядчика");
    }
  };

  const handleUpdateVendor = async (vendorId: string, data: Partial<Vendor>) => {
    try {
      const updated = await vendors.update(eventId, vendorId, data);
      setVendorList((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
      setEditingVendor(null);
      toast.success("Подрядчик обновлён");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить подрядчика");
    }
  };

  const handleDeleteVendor = async () => {
    if (!deleteVendorId) return;
    setIsDeleting(true);
    try {
      // Find and delete associated expenses first
      const linkedExpenses = allExpenses.filter((e) => e.vendorId === deleteVendorId);
      for (const expense of linkedExpenses) {
        await expenses.delete(eventId, expense.id);
      }

      await vendors.delete(eventId, deleteVendorId);
      setVendorList((prev) => prev.filter((v) => v.id !== deleteVendorId));
      setAllExpenses((prev) => prev.filter((e) => e.vendorId !== deleteVendorId));
      setDeleteVendorId(null);
      toast.success(linkedExpenses.length > 0
        ? "Подрядчик и связанные расходы удалены"
        : "Подрядчик удалён"
      );
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить подрядчика");
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const totalCost = vendorList.reduce((sum, v) => sum + (v.totalAmount || 0), 0);
  const totalPaid = vendorList.reduce((sum, v) => sum + (v.paidAmount || 0), 0);
  const totalPending = totalCost - totalPaid;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">Подрядчики</h1>
          <p className="text-caption mt-1">
            Фотографы, ведущие, музыканты и другие
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Stats */}
      {vendorList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">Подрядчиков</div>
            <div className="text-2xl font-bold">{vendorList.length}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">Общая сумма</div>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">Оплачено</div>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">К оплате</div>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">Все типы</option>
          {vendorTypes.map((type) => (
            <option key={type} value={type}>
              {vendorTypeLabels[type]?.ru || type}
            </option>
          ))}
        </select>
      </div>

      {/* Vendor list */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Camera}
              title={vendorList.length === 0 ? "Нет подрядчиков" : "Не найдено"}
              description={vendorList.length === 0 ? "Добавьте фотографа, ведущего или других подрядчиков" : "Попробуйте изменить фильтры"}
              action={
                vendorList.length === 0 ? (
                  <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                    <Plus className="w-4 h-4" /> Добавить подрядчика
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onEdit={() => setEditingVendor(vendor)}
              onDelete={() => setDeleteVendorId(vendor.id)}
            />
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <VendorModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddVendor}
        />
      )}

      {/* Edit Modal */}
      {editingVendor && (
        <VendorModal
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSubmit={(data) => handleUpdateVendor(editingVendor.id, data)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteVendorId}
        onClose={() => setDeleteVendorId(null)}
        onConfirm={handleDeleteVendor}
        title="Удалить подрядчика?"
        description={
          deleteVendorId && allExpenses.filter((e) => e.vendorId === deleteVendorId).length > 0
            ? `Подрядчик и ${allExpenses.filter((e) => e.vendorId === deleteVendorId).length} связанный расход будут удалены`
            : "Подрядчик будет удалён из списка"
        }
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function VendorCard({
  vendor,
  onEdit,
  onDelete,
}: {
  vendor: Vendor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = vendorTypeIcons[vendor.category] || MoreHorizontal;
  const typeLabel = vendorTypeLabels[vendor.category]?.ru || vendor.category;
  const statusLabel = vendorStatusLabels[vendor.status];
  const progress = vendor.totalAmount > 0 ? (vendor.paidAmount / vendor.totalAmount) * 100 : 0;

  const statusColors: Record<VendorStatus, string> = {
    contacted: "bg-gray-100 text-gray-700",
    booked: "bg-blue-100 text-blue-700",
    deposit_paid: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="card p-4 hover:shadow-md hover:border-primary/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{vendor.name}</h3>
            <p className="text-sm text-muted-foreground">{typeLabel}</p>
          </div>
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", statusColors[vendor.status])}>
          {statusLabel?.ru || vendor.status}
        </span>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-3">
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <Phone className="w-3.5 h-3.5" />
            {vendor.phone}
          </a>
        )}
        {vendor.instagram && (
          <a
            href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <Instagram className="w-3.5 h-3.5" />
            {vendor.instagram}
          </a>
        )}
      </div>

      {/* Amount and progress */}
      {vendor.totalAmount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Оплачено</span>
            <span className="font-medium">{formatCurrency(vendor.paidAmount)} / {formatCurrency(vendor.totalAmount)}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Note */}
      {vendor.note && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.note}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          onClick={onEdit}
          className="flex-1 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4 inline mr-1" />
          Изменить
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function VendorModal({
  vendor,
  onClose,
  onSubmit,
}: {
  vendor?: Vendor;
  onClose: () => void;
  onSubmit: (data: CreateVendorRequest) => void;
}) {
  const [category, setCategory] = useState<string>(vendor?.category || "photographer");
  const [name, setName] = useState(vendor?.name || "");
  const [phone, setPhone] = useState(vendor?.phone || "");
  const [instagram, setInstagram] = useState(vendor?.instagram || "");
  const [totalAmount, setTotalAmount] = useState(vendor?.totalAmount?.toString() || "");
  const [paidAmount, setPaidAmount] = useState(vendor?.paidAmount?.toString() || "");
  const [depositAmount, setDepositAmount] = useState(vendor?.depositAmount?.toString() || "");
  const [status, setStatus] = useState<VendorStatus>(vendor?.status || "contacted");
  const [note, setNote] = useState(vendor?.note || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Введите название");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        category: category as ExpenseCategory,
        name: name.trim(),
        phone: phone.trim() || undefined,
        instagram: instagram.trim() || undefined,
        totalAmount: parseInt(totalAmount) || 0,
        depositAmount: parseInt(depositAmount) || 0,
        note: note.trim() || undefined,
        ...(vendor && {
          paidAmount: parseInt(paidAmount) || 0,
          status,
        }),
      } as CreateVendorRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={vendor ? "Редактировать" : "Новый подрядчик"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Тип</label>
          <div className="flex flex-wrap gap-2">
            {vendorTypes.slice(0, 6).map((type) => {
              const Icon = vendorTypeIcons[type];
              const label = vendorTypeLabels[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCategory(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                    category === type
                      ? "bg-primary text-white"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label?.ru}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {vendorTypes.slice(6).map((type) => {
              const Icon = vendorTypeIcons[type];
              const label = vendorTypeLabels[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCategory(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                    category === type
                      ? "bg-primary text-white"
                      : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label?.ru}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Название / Имя *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Studio Photo, Асхат Ведущий..."
            autoFocus
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+7 777 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="input"
              placeholder="@username"
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Сумма (₸)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="input"
              placeholder="150000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Задаток (₸)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="input"
              placeholder="50000"
            />
          </div>
        </div>

        {/* Edit-only fields */}
        {vendor && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">Оплачено (₸)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Статус</label>
              <div className="flex flex-wrap gap-2">
                {vendorStatuses.map((s) => {
                  const label = vendorStatusLabels[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-all",
                        status === s
                          ? "bg-primary text-white"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      )}
                    >
                      {label?.ru}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Заметка</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input min-h-[60px] resize-none"
            placeholder="Дополнительная информация..."
            rows={2}
          />
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            Отмена
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary btn-md">
            {isSubmitting ? "..." : vendor ? "Сохранить" : "Добавить"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
