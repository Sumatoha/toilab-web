"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Trash2,
  Gift as GiftIcon,
  Banknote,
  Package,
  Download,
  UserPlus,
} from "lucide-react";
import { gifts, guests } from "@/lib/api";
import { Gift, GiftStats, Guest, GiftType, Country } from "@/lib/types";
import { cn, formatCurrency, isCentralAsian, currencyConfigs } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog, Avatar } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export default function GiftsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuthStore();
  const userCountry: Country = user?.country || "kz";
  const { t } = useTranslation();

  const [giftList, setGiftList] = useState<Gift[]>([]);
  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GiftStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "money" | "item">("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteGiftId, setDeleteGiftId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [giftsData, statsData, guestsData] = await Promise.all([
        gifts.list(eventId),
        gifts.getStats(eventId),
        guests.list(eventId),
      ]);
      setGiftList(giftsData || []);
      setStats(statsData || { totalGifts: 0, moneyGifts: 0, itemGifts: 0, totalAmount: 0 });
      setGuestList(guestsData || []);
    } catch (error) {
      console.error("Failed to load gifts:", error);
      toast.error(t("gifts.loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to recalculate stats from gifts list
  const recalculateStats = (giftsList: Gift[]): GiftStats => {
    const moneyGifts = giftsList.filter(g => g.type === "money");
    const itemGifts = giftsList.filter(g => g.type === "item").length;
    const totalAmount = moneyGifts.reduce((sum, g) => sum + (g.amount || 0), 0);

    return {
      totalGifts: giftsList.length,
      moneyGifts: moneyGifts.length,
      itemGifts,
      totalAmount,
    };
  };

  const filteredGifts = giftList.filter((gift) => {
    if (filter !== "all" && gift.type !== filter) return false;
    if (search && !gift.guestName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddGift = async (data: {
    guestId?: string;
    guestName: string;
    type: GiftType;
    amount?: number;
    description?: string;
    note?: string;
    createGuest?: boolean;
  }) => {
    try {
      let newList: Gift[];
      if (data.createGuest) {
        const result = await gifts.createWithGuest(eventId, {
          guestName: data.guestName,
          createGuest: true,
          type: data.type,
          amount: data.amount,
          description: data.description,
          note: data.note,
        });
        newList = [result.gift, ...giftList];
        setGiftList(newList);
        if (result.guest) {
          setGuestList((prev) => [...prev, result.guest!]);
        }
      } else {
        const newGift = await gifts.create(eventId, {
          guestId: data.guestId,
          guestName: data.guestName,
          type: data.type,
          amount: data.amount,
          description: data.description,
          note: data.note,
        });
        newList = [newGift, ...giftList];
        setGiftList(newList);
      }
      setStats(recalculateStats(newList));
      setShowAddModal(false);
      toast.success(t("gifts.giftAdded"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("gifts.addError"));
    }
  };

  const handleDeleteGift = async () => {
    if (!deleteGiftId) return;
    setIsDeleting(true);
    try {
      await gifts.delete(eventId, deleteGiftId);
      const newList = giftList.filter((g) => g.id !== deleteGiftId);
      setGiftList(newList);
      setStats(recalculateStats(newList));
      setDeleteGiftId(null);
      toast.success(t("gifts.giftDeleted"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("gifts.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await gifts.export(eventId);
      toast.success(t("gifts.exportCompleted"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("gifts.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">{t("gifts.title")}</h1>
          <p className="text-caption mt-1">
            {isCentralAsian(userCountry) ? t("gifts.description") : t("gifts.descriptionSimple")}
          </p>
        </div>
        <div className="flex gap-2">
          {giftList.length > 0 && (
            <button onClick={handleExport} disabled={isExporting} className="btn-outline btn-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isExporting ? "..." : t("common.export")}</span>
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatCard
            icon={GiftIcon}
            label={t("gifts.stats.total")}
            value={stats.totalGifts}
            color="indigo"
          />
          <StatCard
            icon={Banknote}
            label={t("gifts.stats.money")}
            value={stats.moneyGifts}
            color="emerald"
          />
          <StatCard
            icon={Package}
            label={t("gifts.stats.items")}
            value={stats.itemGifts}
            color="amber"
          />
          <div className="card p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">{t("gifts.stats.totalAmount")}</div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">
              {formatCurrency(stats.totalAmount, userCountry)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("gifts.searchByGuestName")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: t("gifts.filterAll"), count: stats?.totalGifts },
            { key: "money", label: t("gifts.filterMoney"), count: stats?.moneyGifts },
            { key: "item", label: t("gifts.filterItems"), count: stats?.itemGifts },
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
              {f.count !== undefined && f.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full ml-1",
                  filter === f.key ? "bg-white/20" : "bg-secondary"
                )}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Gift list */}
      <div className="card p-0 overflow-hidden">
        {filteredGifts.length === 0 ? (
          <EmptyState
            icon={GiftIcon}
            title={giftList.length === 0 ? t("gifts.emptyTitle") : t("gifts.noMatchingGifts")}
            description={giftList.length === 0 ? t("gifts.addFirstGift") : t("gifts.tryChangeFilters")}
            action={
              giftList.length === 0 ? (
                <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  {t("gifts.addGift")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredGifts.map((gift, index) => (
              <GiftRow
                key={gift.id}
                gift={gift}
                country={userCountry}
                onDelete={() => setDeleteGiftId(gift.id)}
                className={`animate-in stagger-${Math.min(index + 1, 4)}`}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Gift Modal */}
      {showAddModal && (
        <AddGiftModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddGift}
          guests={guestList}
          country={userCountry}
          t={t}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteGiftId}
        onClose={() => setDeleteGiftId(null)}
        onConfirm={handleDeleteGift}
        title={t("gifts.deleteTitle")}
        description={t("gifts.deleteDescription")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof GiftIcon;
  label: string;
  value: number;
  color: "indigo" | "emerald" | "amber";
}) {
  const colorStyles = {
    indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
  };

  const styles = colorStyles[color];

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0", styles.bg)}>
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", styles.text)} />
        </div>
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-bold">{value}</div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">{label}</div>
        </div>
      </div>
    </div>
  );
}

function GiftRow({ gift, country, onDelete, className, t }: { gift: Gift; country: Country; onDelete: () => void; className?: string; t: (key: string) => string }) {
  const formattedDate = new Date(gift.receivedAt).toLocaleDateString("ru-KZ", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className={cn("flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-secondary/50 transition-colors group", className)}>
      <Avatar name={gift.guestName} size="md" className="hidden sm:flex" />
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-medium truncate">{gift.guestName}</p>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          {gift.description && <span className="truncate">{gift.description}</span>}
          <span className="hidden sm:inline">{formattedDate}</span>
        </div>
      </div>
      <GiftTypeBadge type={gift.type} amount={gift.amount} country={country} t={t} />
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
        title={t("common.delete")}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function GiftTypeBadge({ type, amount, country, t }: { type: string; amount: number; country: Country; t: (key: string) => string }) {
  if (type === "money") {
    return (
      <span className="inline-flex items-center gap-1.5 badge-success">
        <Banknote className="w-3 h-3" />
        {formatCurrency(amount, country)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 badge-info">
      <Package className="w-3 h-3" />
      {t("gifts.types.item")}
    </span>
  );
}

function AddGiftModal({
  onClose,
  onAdd,
  guests,
  country,
  t,
}: {
  onClose: () => void;
  onAdd: (data: {
    guestId?: string;
    guestName: string;
    type: GiftType;
    amount?: number;
    description?: string;
    note?: string;
    createGuest?: boolean;
  }) => void;
  guests: Guest[];
  country: Country;
  t: (key: string) => string;
}) {
  const currencySymbol = currencyConfigs[country]?.symbol || "₸";
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [type, setType] = useState<GiftType>("money");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [createGuest, setCreateGuest] = useState(false);
  const [guestSearch, setGuestSearch] = useState("");

  const filteredGuests = guests.filter((g) =>
    g.name.toLowerCase().includes(guestSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalGuestName = mode === "existing"
      ? guests.find(g => g.id === selectedGuestId)?.name || ""
      : guestName.trim();

    if (!finalGuestName) {
      toast.error(t("gifts.specifyGuestName"));
      return;
    }

    onAdd({
      guestId: mode === "existing" ? selectedGuestId : undefined,
      guestName: finalGuestName,
      type,
      amount: type === "money" ? parseInt(amount) || 0 : undefined,
      description: description.trim() || undefined,
      note: note.trim() || undefined,
      createGuest: mode === "new" && createGuest,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={t("gifts.addGift")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Guest selection mode */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
              mode === "existing"
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {t("gifts.fromGuestList")}
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
              mode === "new"
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="w-4 h-4 inline mr-1" />
            {t("gifts.newGuest")}
          </button>
        </div>

        {/* Guest selection */}
        {mode === "existing" ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("gifts.guestRequired")}</label>
            <input
              type="text"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="input mb-2"
              placeholder={t("gifts.searchGuest")}
            />
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
              {filteredGuests.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {guests.length === 0 ? t("gifts.noGuests") : t("gifts.guestNotFound")}
                </div>
              ) : (
                filteredGuests.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => setSelectedGuestId(guest.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary/50 transition-colors",
                      selectedGuestId === guest.id && "bg-primary/10"
                    )}
                  >
                    <Avatar name={guest.name} size="sm" />
                    <span className="text-sm">{guest.name}</span>
                    {selectedGuestId === guest.id && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("gifts.guestNameRequired")}</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="input"
              placeholder={t("gifts.guestNamePlaceholder")}
              autoFocus
            />
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={createGuest}
                onChange={(e) => setCreateGuest(e.target.checked)}
                className="rounded border-border"
              />
              {t("gifts.addToGuestList")}
            </label>
          </div>
        )}

        {/* Gift type */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("gifts.giftType")}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("money")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                type === "money"
                  ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Banknote className="w-4 h-4" />
              {t("gifts.types.money")}
            </button>
            <button
              type="button"
              onClick={() => setType("item")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                type === "item"
                  ? "bg-amber-100 text-amber-700 ring-2 ring-amber-500"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="w-4 h-4" />
              {t("gifts.types.item")}
            </button>
          </div>
        </div>

        {/* Amount (for money) */}
        {type === "money" && (
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("gifts.amountLabel")} ({currencySymbol})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="50000"
              min="0"
            />
          </div>
        )}

        {/* Description (for item) */}
        {type === "item" && (
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("gifts.giftDescriptionLabel")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder={t("gifts.giftDescriptionPlaceholder")}
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("gifts.noteLabel")}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder={t("gifts.notePlaceholder")}
          />
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary btn-md">
            {t("common.add")}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
