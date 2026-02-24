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
  Clock,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";
import { vendors, expenses, program as programApi } from "@/lib/api";
import { Vendor, VendorStatus, CreateVendorRequest, ExpenseCategory, Expense, Country, ProgramItem } from "@/lib/types";
import { cn, formatCurrency, vendorTypeLabels, vendorStatusLabels, currencyConfigs } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/hooks/use-translation";
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
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const userCountry: Country = user?.country || "kz";

  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [vendorData, expenseData, programData] = await Promise.all([
        vendors.list(eventId),
        expenses.list(eventId),
        programApi.list(eventId),
      ]);
      setVendorList(vendorData || []);
      setAllExpenses(expenseData || []);
      setProgramItems(programData || []);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      toast.error(t("vendors.loadError"));
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
        ? t("vendors.vendorAddedWithExpense")
        : t("vendors.vendorAdded")
      );
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("vendors.addError"));
    }
  };

  const handleUpdateVendor = async (vendorId: string, data: Partial<Vendor>) => {
    try {
      const updated = await vendors.update(eventId, vendorId, data);
      setVendorList((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
      setEditingVendor(null);
      toast.success(t("vendors.vendorUpdated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("vendors.updateError"));
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
        ? t("vendors.vendorDeletedWithExpenses")
        : t("vendors.vendorDeleted")
      );
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("vendors.deleteError"));
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
          <h1 className="text-h1">{t("vendors.title")}</h1>
          <p className="text-caption mt-1">
            {t("vendors.description")}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          {t("common.add")}
        </button>
      </div>

      {/* Stats */}
      {vendorList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("vendors.summary.total")}</div>
            <div className="text-2xl font-bold">{vendorList.length}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("vendors.totalAmount")}</div>
            <div className="text-2xl font-bold">{formatCurrency(totalCost, userCountry)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("vendors.paidAmount")}</div>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid, userCountry)}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">{t("vendors.toPay")}</div>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending, userCountry)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("vendors.searchPlaceholder")}
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
          <option value="all">{t("vendors.allTypes")}</option>
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
              title={vendorList.length === 0 ? t("vendors.noVendors") : t("vendors.notFound")}
              description={vendorList.length === 0 ? t("vendors.addDescription") : t("vendors.changeFilters")}
              action={
                vendorList.length === 0 ? (
                  <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                    <Plus className="w-4 h-4" /> {t("vendors.addVendor")}
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
              country={userCountry}
              programItems={programItems.filter(p =>
                p.responsible?.toLowerCase().includes(vendor.name.toLowerCase())
              )}
              onView={() => setViewingVendor(vendor)}
              onEdit={() => setEditingVendor(vendor)}
              onDelete={() => setDeleteVendorId(vendor.id)}
              t={t}
            />
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <VendorModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddVendor}
          country={userCountry}
          t={t}
        />
      )}

      {/* Edit Modal */}
      {editingVendor && (
        <VendorModal
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSubmit={(data) => handleUpdateVendor(editingVendor.id, data)}
          country={userCountry}
          t={t}
        />
      )}

      {/* Detail Modal */}
      {viewingVendor && (
        <VendorDetailModal
          vendor={viewingVendor}
          country={userCountry}
          programItems={programItems.filter(p =>
            p.responsible?.toLowerCase().includes(viewingVendor.name.toLowerCase())
          )}
          linkedExpenses={allExpenses.filter(e => e.vendorId === viewingVendor.id)}
          onClose={() => setViewingVendor(null)}
          onEdit={() => { setViewingVendor(null); setEditingVendor(viewingVendor); }}
          t={t}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteVendorId}
        onClose={() => setDeleteVendorId(null)}
        onConfirm={handleDeleteVendor}
        title={t("vendors.deleteConfirm")}
        description={
          deleteVendorId && allExpenses.filter((e) => e.vendorId === deleteVendorId).length > 0
            ? t("vendors.deleteWithExpenses").replace("{count}", allExpenses.filter((e) => e.vendorId === deleteVendorId).length.toString())
            : t("vendors.deleteDescription")
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function VendorCard({
  vendor,
  country,
  programItems,
  onView,
  onEdit,
  onDelete,
  t,
}: {
  vendor: Vendor;
  country: Country;
  programItems: ProgramItem[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
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

  const getProgramItemsText = (count: number) => {
    if (count === 1) return t("vendors.programItems");
    if (count >= 2 && count <= 4) return t("vendors.programItems2to4");
    return t("vendors.programItems5plus");
  };

  return (
    <div
      onClick={onView}
      className="card p-4 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
    >
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
            <span className="text-muted-foreground">{t("vendors.paidAmount")}</span>
            <span className="font-medium">{formatCurrency(vendor.paidAmount, country)} / {formatCurrency(vendor.totalAmount, country)}</span>
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

      {/* Program responsibilities indicator */}
      {programItems.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-primary mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>{programItems.length} {getProgramItemsText(programItems.length)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex-1 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          {t("vendors.details")}
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
  country,
  t,
}: {
  vendor?: Vendor;
  onClose: () => void;
  onSubmit: (data: CreateVendorRequest) => void;
  country: Country;
  t: (key: string) => string;
}) {
  const currencySymbol = currencyConfigs[country]?.symbol || "₸";
  const [category, setCategory] = useState<string>(vendor?.category || "photographer");
  const [name, setName] = useState(vendor?.name || "");
  const [phone, setPhone] = useState(vendor?.phone || "");
  const [instagram, setInstagram] = useState(vendor?.instagram || "");
  const [totalAmount, setTotalAmount] = useState(vendor?.totalAmount?.toString() || "");
  const [paidAmount, setPaidAmount] = useState(vendor?.paidAmount?.toString() || "");
  const [status, setStatus] = useState<VendorStatus>(vendor?.status || "contacted");
  const [note, setNote] = useState(vendor?.note || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("vendors.enterName"));
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
    <Modal isOpen onClose={onClose} title={vendor ? t("vendors.editVendor") : t("vendors.newVendor")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selection */}
        <div>
          <label className="block text-sm font-medium mb-2">{t("vendors.type")}</label>
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
          <label className="block text-sm font-medium mb-1.5">{t("vendors.nameRequired")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={t("vendors.namePlaceholder")}
            autoFocus
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("vendors.phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="+7 777 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("vendors.instagram")}</label>
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
            <label className="block text-sm font-medium mb-1.5">{t("vendors.amount")} ({currencySymbol})</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="input"
              placeholder="150000"
            />
          </div>
        </div>

        {/* Edit-only fields */}
        {vendor && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("vendors.paidAmount")} ({currencySymbol})</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("common.status")}</label>
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
          <label className="block text-sm font-medium mb-1.5">{t("vendors.notes")}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input min-h-[60px] resize-none"
            placeholder={t("vendors.notesPlaceholder")}
            rows={2}
          />
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary btn-md">
            {isSubmitting ? "..." : vendor ? t("common.save") : t("common.add")}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function VendorDetailModal({
  vendor,
  country,
  programItems,
  linkedExpenses,
  onClose,
  onEdit,
  t,
}: {
  vendor: Vendor;
  country: Country;
  programItems: ProgramItem[];
  linkedExpenses: Expense[];
  onClose: () => void;
  onEdit: () => void;
  t: (key: string) => string;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{vendor.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{typeLabel}</span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[vendor.status])}>
                  {statusLabel?.ru || vendor.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          {/* Contact */}
          {(vendor.phone || vendor.instagram) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("vendors.contacts")}</h3>
              <div className="space-y-1.5">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {vendor.phone}
                  </a>
                )}
                {vendor.instagram && (
                  <a
                    href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                    {vendor.instagram}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Payment */}
          {vendor.totalAmount > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("vendors.payment")}</h3>
              <div className="card p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t("vendors.amount")}</span>
                  <span className="font-semibold">{formatCurrency(vendor.totalAmount, country)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{t("vendors.paidAmount")}</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(vendor.paidAmount, country)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{t("vendors.remainingAmount")}</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(vendor.totalAmount - vendor.paidAmount, country)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Program responsibilities */}
          {programItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("vendors.responsibleFor")} ({programItems.length})</h3>
              <div className="space-y-2">
                {programItems.sort((a, b) => {
                  if (!a.startTime || !b.startTime) return 0;
                  return a.startTime.localeCompare(b.startTime);
                }).map((item) => (
                  <div key={item.id} className="card p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.startTime}
                        {item.endTime && ` - ${item.endTime}`}
                        {item.duration && item.duration > 0 && ` (${item.duration} ${t("program.minutes")})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked expenses */}
          {linkedExpenses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("vendors.linkedExpenses")} ({linkedExpenses.length})</h3>
              <div className="space-y-2">
                {linkedExpenses.map((expense) => (
                  <div key={expense.id} className="card p-3 flex items-center justify-between">
                    <span className="text-sm">{expense.title}</span>
                    <span className="text-sm font-medium">{formatCurrency(expense.actualAmount || expense.plannedAmount, country)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {vendor.note && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("vendors.notes")}</h3>
              <p className="text-sm">{vendor.note}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline btn-md">{t("common.close")}</button>
          <button onClick={onEdit} className="btn-primary btn-md">
            <Edit2 className="w-4 h-4" />
            {t("common.edit")}
          </button>
        </div>
      </div>
    </div>
  );
}
