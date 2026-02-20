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
import { Gift, GiftStats, Guest, GiftType } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog, Avatar } from "@/components/ui";
import toast from "react-hot-toast";

export default function GiftsPage() {
  const params = useParams();
  const eventId = params.id as string;

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
      toast.error("Не удалось загрузить подарки");
    } finally {
      setIsLoading(false);
    }
  }

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
      if (data.createGuest) {
        const result = await gifts.createWithGuest(eventId, {
          guestName: data.guestName,
          createGuest: true,
          type: data.type,
          amount: data.amount,
          description: data.description,
          note: data.note,
        });
        setGiftList((prev) => [result.gift, ...prev]);
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
        setGiftList((prev) => [newGift, ...prev]);
      }
      setShowAddModal(false);
      toast.success("Подарок добавлен");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить подарок");
    }
  };

  const handleDeleteGift = async () => {
    if (!deleteGiftId) return;
    setIsDeleting(true);
    try {
      await gifts.delete(eventId, deleteGiftId);
      setGiftList((prev) => prev.filter((g) => g.id !== deleteGiftId));
      setDeleteGiftId(null);
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить подарок");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const url = gifts.getExportUrl(eventId);
    window.open(url, "_blank");
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">Подарки</h1>
          <p className="text-caption mt-1">
            Учёт подарков и көрімдік
          </p>
        </div>
        <div className="flex gap-2">
          {giftList.length > 0 && (
            <button onClick={handleExport} className="btn-outline btn-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Экспорт</span>
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatCard
            icon={GiftIcon}
            label="Всего"
            value={stats.totalGifts}
            color="indigo"
          />
          <StatCard
            icon={Banknote}
            label="Деньги"
            value={stats.moneyGifts}
            color="emerald"
          />
          <StatCard
            icon={Package}
            label="Подарки"
            value={stats.itemGifts}
            color="amber"
          />
          <div className="card p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Сумма</div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">
              {formatCurrency(stats.totalAmount)}
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
            placeholder="Поиск по имени гостя..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Все", count: stats?.totalGifts },
            { key: "money", label: "Деньги", count: stats?.moneyGifts },
            { key: "item", label: "Подарки", count: stats?.itemGifts },
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
            title={giftList.length === 0 ? "Список подарков пуст" : "Нет подарков по заданным фильтрам"}
            description={giftList.length === 0 ? "Добавьте первый подарок" : "Попробуйте изменить фильтры"}
            action={
              giftList.length === 0 ? (
                <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Добавить подарок
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
                onDelete={() => setDeleteGiftId(gift.id)}
                className={`animate-in stagger-${Math.min(index + 1, 4)}`}
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
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteGiftId}
        onClose={() => setDeleteGiftId(null)}
        onConfirm={handleDeleteGift}
        title="Удалить подарок?"
        description="Запись о подарке будет удалена"
        confirmText="Удалить"
        cancelText="Отмена"
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

function GiftRow({ gift, onDelete, className }: { gift: Gift; onDelete: () => void; className?: string }) {
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
      <GiftTypeBadge type={gift.type} amount={gift.amount} />
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
        title="Удалить"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function GiftTypeBadge({ type, amount }: { type: string; amount: number }) {
  if (type === "money") {
    return (
      <span className="inline-flex items-center gap-1.5 badge-success">
        <Banknote className="w-3 h-3" />
        {formatCurrency(amount)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 badge-info">
      <Package className="w-3 h-3" />
      Подарок
    </span>
  );
}

function AddGiftModal({
  onClose,
  onAdd,
  guests,
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
}) {
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
      toast.error("Укажите имя гостя");
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
    <Modal isOpen onClose={onClose} title="Добавить подарок">
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
            Из списка гостей
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
            Новый гость
          </button>
        </div>

        {/* Guest selection */}
        {mode === "existing" ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">Гость *</label>
            <input
              type="text"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="input mb-2"
              placeholder="Поиск гостя..."
            />
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
              {filteredGuests.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {guests.length === 0 ? "Нет гостей" : "Гость не найден"}
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
            <label className="block text-sm font-medium mb-1.5">Имя гостя *</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="input"
              placeholder="Имя гостя"
              autoFocus
            />
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={createGuest}
                onChange={(e) => setCreateGuest(e.target.checked)}
                className="rounded border-border"
              />
              Добавить в список гостей
            </label>
          </div>
        )}

        {/* Gift type */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Тип подарка</label>
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
              Деньги
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
              Подарок
            </button>
          </div>
        </div>

        {/* Amount (for money) */}
        {type === "money" && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Сумма (₸)</label>
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
            <label className="block text-sm font-medium mb-1.5">Описание подарка</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Набор посуды, бытовая техника..."
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Примечание</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            placeholder="Дополнительная информация"
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
