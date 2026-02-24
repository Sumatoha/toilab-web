"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Upload,
  Search,
  Trash2,
  Check,
  X,
  Clock,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Pencil,
  LayoutGrid,
} from "lucide-react";
import { guests, seating, gifts } from "@/lib/api";
import { Guest, GuestStats, SeatingTable, Gift } from "@/lib/types";
import { cn, rsvpStatusLabels, formatTableName } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog, Avatar, ProgressBar } from "@/components/ui";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export default function GuestsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { t } = useTranslation();

  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteGuestId, setDeleteGuestId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allGifts, setAllGifts] = useState<Gift[]>([]);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [guestsData, statsData, tablesData, giftsData] = await Promise.all([
        guests.list(eventId),
        guests.getStats(eventId),
        seating.getTables(eventId).catch(() => []), // Tables might not exist yet
        gifts.list(eventId).catch(() => []), // Load gifts to track relationships
      ]);
      setGuestList(guestsData || []);
      setStats(statsData || { total: 0, accepted: 0, declined: 0, pending: 0, plusOnes: 0, attending: 0 });
      // Filter out scene elements
      setTables((tablesData || []).filter(t => t.shape !== "scene"));
      setAllGifts(giftsData || []);
    } catch (error) {
      console.error("Failed to load guests:", error);
      toast.error(t("errors.loadError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to recalculate stats from guests list
  const recalculateStats = (guests: Guest[]): GuestStats => {
    const accepted = guests.filter(g => g.rsvpStatus === "accepted");
    const declined = guests.filter(g => g.rsvpStatus === "declined").length;
    const pending = guests.filter(g => g.rsvpStatus === "pending").length;
    const plusOnes = accepted.reduce((sum, g) => sum + (g.plusCount || 0), 0);

    return {
      total: guests.length,
      accepted: accepted.length,
      declined,
      pending,
      plusOnes,
      attending: accepted.length + plusOnes,
    };
  };

  const filteredGuests = guestList.filter((guest) => {
    if (filter !== "all" && guest.rsvpStatus !== filter) return false;
    if (search && !guest.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddGuest = async (data: { name: string; phone?: string; email?: string; tableId?: string; rsvpStatus?: string; plusCount?: number }) => {
    try {
      const newGuest = await guests.create(eventId, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        rsvpStatus: data.rsvpStatus,
        plusCount: data.plusCount,
      });

      // If tableId provided, assign guest to table
      if (data.tableId) {
        await seating.assignGuest(eventId, data.tableId, newGuest.id);
        newGuest.tableId = data.tableId;
        // Update table's guestIds locally
        setTables(prev => prev.map(t =>
          t.id === data.tableId
            ? { ...t, guestIds: [...t.guestIds, newGuest.id] }
            : t
        ));
      }

      const newList = [...guestList, newGuest];
      setGuestList(newList);
      setStats(recalculateStats(newList));
      setShowAddModal(false);
      toast.success(t("guests.guestAdded"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("guests.addError"));
    }
  };

  const handleUpdateGuest = async (guestId: string, data: { name?: string; phone?: string; email?: string; tableId?: string | null; rsvpStatus?: string; plusCount?: number }) => {
    try {
      // Update guest info
      await guests.update(eventId, guestId, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        rsvpStatus: data.rsvpStatus,
        plusCount: data.plusCount,
      });

      // Handle table assignment
      const currentGuest = guestList.find(g => g.id === guestId);
      const currentTableId = currentGuest?.tableId;

      if (data.tableId !== undefined && data.tableId !== currentTableId) {
        // Remove from current table if exists
        if (currentTableId) {
          await seating.removeGuest(eventId, currentTableId, guestId).catch(() => {});
        }
        // Add to new table if selected
        if (data.tableId) {
          await seating.assignGuest(eventId, data.tableId, guestId);
        }

        // Update tables state locally
        setTables(prev => prev.map(t => {
          if (t.id === currentTableId) {
            return { ...t, guestIds: t.guestIds.filter(id => id !== guestId) };
          }
          if (t.id === data.tableId) {
            return { ...t, guestIds: [...t.guestIds, guestId] };
          }
          return t;
        }));
      }

      // Update guest list locally
      const newList = guestList.map(g =>
        g.id === guestId
          ? {
              ...g,
              name: data.name ?? g.name,
              phone: data.phone ?? g.phone,
              email: data.email ?? g.email,
              rsvpStatus: (data.rsvpStatus ?? g.rsvpStatus) as "pending" | "accepted" | "declined",
              tableId: data.tableId !== undefined ? (data.tableId || undefined) : g.tableId,
              plusCount: data.plusCount ?? g.plusCount,
            }
          : g
      );
      setGuestList(newList);
      setStats(recalculateStats(newList));
      setEditingGuest(null);
      toast.success(t("guests.guestUpdated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("guests.updateError"));
    }
  };

  const handleImportGuests = async (guestsData: { name: string; plusCount: number }[]) => {
    try {
      const result = await guests.importWithPlusCount(eventId, { guests: guestsData });
      const newList = [...guestList, ...result.guests];
      setGuestList(newList);
      setStats(recalculateStats(newList));
      setShowImportModal(false);
      const totalPeople = guestsData.reduce((sum, g) => sum + 1 + g.plusCount, 0);
      toast.success(t("guests.importSuccess", { count: result.created, total: totalPeople }));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("guests.importError"));
    }
  };

  const handleDeleteGuest = async () => {
    if (!deleteGuestId) return;
    setIsDeleting(true);
    try {
      const guest = guestList.find(g => g.id === deleteGuestId);

      // Remove guest from their table if assigned
      if (guest?.tableId) {
        await seating.removeGuest(eventId, guest.tableId, deleteGuestId).catch(() => {});
        // Update tables state locally
        setTables(prev => prev.map(t =>
          t.id === guest.tableId
            ? { ...t, guestIds: t.guestIds.filter(id => id !== deleteGuestId) }
            : t
        ));
      }

      // Update associated gifts to clear guestId (backend should handle, but ensure frontend state is correct)
      const linkedGifts = allGifts.filter(g => g.guestId === deleteGuestId);
      for (const gift of linkedGifts) {
        await gifts.update(eventId, gift.id, { guestName: gift.guestName }).catch(() => {});
      }

      await guests.delete(eventId, deleteGuestId);
      const newList = guestList.filter((g) => g.id !== deleteGuestId);
      setGuestList(newList);
      setStats(recalculateStats(newList));
      // Also update gifts state to unlink
      setAllGifts(prev => prev.map(g =>
        g.guestId === deleteGuestId ? { ...g, guestId: undefined } : g
      ));
      setDeleteGuestId(null);
      toast.success(linkedGifts.length > 0
        ? t("guests.deletedWithGifts")
        : t("guests.deleted")
      );
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("guests.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Create a map of tableId -> formatted table name
  const tableNameMap = new Map<string, string>();
  tables.forEach(t => tableNameMap.set(t.id, formatTableName(t.number, t.name)));

  if (isLoading) {
    return <PageLoader />;
  }

  const responseRate = stats && stats.total > 0
    ? Math.round(((stats.accepted + stats.declined) / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">{t("nav.guests")}</h1>
          <p className="text-caption mt-1">
            {t("guests.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-outline btn-sm">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t("guests.import")}</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("guests.addGuest")}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (() => {
        // Calculate total companions from all guests
        const allPlusOnes = guestList.reduce((sum, g) => sum + (g.plusCount || 0), 0);
        const totalPeople = stats.total + allPlusOnes;

        return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <StatCard
            icon={Users}
            label={t("common.total")}
            value={totalPeople}
            description={allPlusOnes > 0 ? `${stats.total} ${t("guests.guests")} + ${allPlusOnes} ${t("guests.companions")}` : undefined}
            color="slate"
          />
          <StatCard
            icon={UserCheck}
            label={t("guests.willCome")}
            value={stats.accepted}
            sublabel={stats.plusOnes > 0 ? `+${stats.plusOnes}` : undefined}
            color="emerald"
          />
          <StatCard
            icon={UserX}
            label={t("guests.wontCome")}
            value={stats.declined}
            color="red"
          />
          <StatCard
            icon={Clock}
            label={t("guests.waiting")}
            value={stats.pending}
            color="amber"
          />
          <div className="card p-3 sm:p-4 col-span-2 sm:col-span-1">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{t("guests.responseRate")}</div>
            <div className="text-xl sm:text-2xl font-bold mb-2">{responseRate}%</div>
            <ProgressBar
              value={stats.accepted + stats.declined}
              max={stats.total || 1}
              color="primary"
              size="sm"
            />
          </div>
        </div>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("guests.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:overflow-x-visible">
          {[
            { key: "all", label: t("common.all"), count: stats?.total },
            { key: "accepted", label: t("guests.willCome"), count: stats?.accepted },
            { key: "pending", label: t("guests.waiting"), count: stats?.pending },
            { key: "declined", label: t("guests.wontCome"), count: stats?.declined },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={cn(
                "chip whitespace-nowrap",
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

      {/* Guest list */}
      {filteredGuests.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={guestList.length === 0 ? t("guests.emptyTitle") : t("guests.noFilterResults")}
            description={guestList.length === 0 ? t("guests.emptyDescription") : t("guests.changeFilters")}
            action={
              guestList.length === 0 ? (
                <button onClick={() => setShowAddModal(true)} className="btn-primary btn-md">
                  <Plus className="w-4 h-4" />
                  {t("guests.addGuest")}
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-3">
            {filteredGuests.map((guest, index) => (
              <GuestCard
                key={guest.id}
                guest={guest}
                tableName={guest.tableId ? tableNameMap.get(guest.tableId) : undefined}
                onEdit={() => setEditingGuest(guest)}
                onDelete={() => setDeleteGuestId(guest.id)}
                className={`animate-in stagger-${Math.min(index + 1, 4)}`}
              />
            ))}
          </div>

          {/* Desktop: Row layout */}
          <div className="hidden sm:block card p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {filteredGuests.map((guest, index) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  tableName={guest.tableId ? tableNameMap.get(guest.tableId) : undefined}
                  onEdit={() => setEditingGuest(guest)}
                  onDelete={() => setDeleteGuestId(guest.id)}
                  className={`animate-in stagger-${Math.min(index + 1, 4)}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Guest Modal */}
      {showAddModal && (
        <AddGuestModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddGuest}
          tables={tables}
          guestList={guestList}
          t={t}
        />
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <EditGuestModal
          guest={editingGuest}
          tables={tables}
          guestList={guestList}
          onClose={() => setEditingGuest(null)}
          onSave={(data) => handleUpdateGuest(editingGuest.id, data)}
          t={t}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportGuests}
          t={t}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteGuestId}
        onClose={() => setDeleteGuestId(null)}
        onConfirm={handleDeleteGuest}
        title={t("guests.deleteTitle")}
        description={(() => {
          if (!deleteGuestId) return t("guests.deleteDescription");
          const guest = guestList.find(g => g.id === deleteGuestId);
          const linkedGifts = allGifts.filter(g => g.guestId === deleteGuestId).length;
          const parts = [t("guests.deleteDescription")];
          if (guest?.tableId) parts.push(t("guests.removedFromTable"));
          if (linkedGifts > 0) parts.push(t("guests.giftsKept", { count: linkedGifts }));
          return parts.join(", ");
        })()}
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
  sublabel,
  description,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sublabel?: string;
  description?: string;
  color: "slate" | "emerald" | "red" | "amber";
}) {
  const colorStyles = {
    slate: { bg: "bg-slate-100", text: "text-slate-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
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
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold">{value}</span>
            {sublabel && (
              <span className="text-xs sm:text-sm text-emerald-600 font-medium">{sublabel}</span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">{label}</div>
          {description && (
            <div className="text-[10px] sm:text-xs text-muted-foreground/70 truncate">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile card component
function GuestCard({
  guest,
  tableName,
  onEdit,
  onDelete,
  className
}: {
  guest: Guest;
  tableName?: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const statusConfig = rsvpStatusLabels[guest.rsvpStatus] || { ru: "Неизвестно", color: "gray" };

  return (
    <div
      className={cn("card p-4 active:scale-[0.99] transition-transform touch-manipulation", className)}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={guest.name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{guest.name}</p>
            {guest.phone && (
              <p className="text-sm text-muted-foreground truncate">{guest.phone}</p>
            )}
          </div>
        </div>
        <RsvpBadge status={guest.rsvpStatus} label={statusConfig.ru} showLabel />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {guest.plusCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
              <UserPlus className="w-3.5 h-3.5" />
              +{guest.plusCount}
            </span>
          )}
          {tableName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
              <LayoutGrid className="w-3.5 h-3.5" />
              {tableName}
            </span>
          )}
          {guest.group && (
            <span className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-lg text-xs">
              {guest.group}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2.5 text-muted-foreground hover:text-primary active:bg-primary/10 rounded-xl transition-colors"
            aria-label="Редактировать"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2.5 text-muted-foreground hover:text-red-500 active:bg-red-50 rounded-xl transition-colors"
            aria-label="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Desktop row component
function GuestRow({
  guest,
  tableName,
  onEdit,
  onDelete,
  className
}: {
  guest: Guest;
  tableName?: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const statusConfig = rsvpStatusLabels[guest.rsvpStatus] || { ru: "Неизвестно", color: "gray" };

  return (
    <div
      className={cn("flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors group cursor-pointer", className)}
      onClick={onEdit}
    >
      <Avatar name={guest.name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{guest.name}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {guest.phone && <span>{guest.phone}</span>}
          {guest.group && <span>• {guest.group}</span>}
          {guest.plusCount > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <UserPlus className="w-3 h-3" />
              +{guest.plusCount}
            </span>
          )}
          {tableName && (
            <span className="inline-flex items-center gap-1 text-indigo-600">
              <LayoutGrid className="w-3 h-3" />
              {tableName}
            </span>
          )}
        </div>
      </div>
      <RsvpBadge status={guest.rsvpStatus} label={statusConfig.ru} showLabel />
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

function RsvpBadge({ status, label, showLabel = false }: { status: string; label: string; showLabel?: boolean }) {
  const config = {
    accepted: {
      className: "badge-success",
      icon: Check,
    },
    declined: {
      className: "badge-error",
      icon: X,
    },
    pending: {
      className: "badge-warning",
      icon: Clock,
    },
  };

  const { className, icon: Icon } = config[status as keyof typeof config] || config.pending;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs flex-shrink-0", className)}>
      <Icon className="w-3 h-3" />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

function AddGuestModal({
  onClose,
  onAdd,
  tables,
  guestList,
  t,
}: {
  onClose: () => void;
  onAdd: (data: { name: string; phone?: string; email?: string; tableId?: string; rsvpStatus?: string; plusCount?: number }) => void;
  tables: SeatingTable[];
  guestList: Guest[];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tableId, setTableId] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState("pending");
  const [plusCount, setPlusCount] = useState(0);

  // Calculate occupied seats at a table (including plusCount)
  const getOccupied = (table: SeatingTable): number => {
    return table.guestIds.reduce((sum, gid) => {
      const guest = guestList.find(g => g.id === gid);
      return sum + 1 + (guest?.plusCount || 0);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      tableId: tableId || undefined,
      rsvpStatus,
      plusCount: plusCount > 0 ? plusCount : undefined,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={t("guests.addGuest")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("guests.name")} *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={t("guests.namePlaceholder")}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("common.status")}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRsvpStatus("accepted")}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                rsvpStatus === "accepted"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-border hover:bg-secondary"
              )}
            >
              <Check className="w-4 h-4 inline mr-1.5" />
              {t("guests.willCome")}
            </button>
            <button
              type="button"
              onClick={() => setRsvpStatus("pending")}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                rsvpStatus === "pending"
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "border-border hover:bg-secondary"
              )}
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              {t("guests.waitingAnswer")}
            </button>
            <button
              type="button"
              onClick={() => setRsvpStatus("declined")}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                rsvpStatus === "declined"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "border-border hover:bg-secondary"
              )}
            >
              <X className="w-4 h-4 inline mr-1.5" />
              {t("guests.wontCome")}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              {t("guests.additionalGuests")}
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlusCount(Math.max(0, plusCount - 1))}
              className="w-10 h-10 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-lg font-medium disabled:opacity-50"
              disabled={plusCount === 0}
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold">{plusCount}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {plusCount === 0 ? t("guests.comesAlone") : `+${plusCount} (${t("common.total")} ${plusCount + 1})`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlusCount(plusCount + 1)}
              className="w-10 h-10 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("guests.phone")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="+7 777 123 4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="email@example.com"
          />
        </div>
        {tables.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4" />
                {t("seating.table")}
              </span>
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="input"
            >
              <option value="">{t("guests.notAssigned")}</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {formatTableName(table.number, table.name)} ({getOccupied(table)}/{table.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
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

function EditGuestModal({
  guest,
  tables,
  guestList,
  onClose,
  onSave,
  t,
}: {
  guest: Guest;
  tables: SeatingTable[];
  guestList: Guest[];
  onClose: () => void;
  onSave: (data: { name?: string; phone?: string; email?: string; tableId?: string | null; rsvpStatus?: string; plusCount?: number }) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone || "");
  const [email, setEmail] = useState(guest.email || "");
  const [plusCount, setPlusCount] = useState(guest.plusCount || 0);
  const [tableId, setTableId] = useState(guest.tableId || "");

  // Calculate occupied seats at a table (including plusCount)
  const getOccupied = (table: SeatingTable): number => {
    return table.guestIds.reduce((sum, gid) => {
      const g = guestList.find(gl => gl.id === gid);
      return sum + 1 + (g?.plusCount || 0);
    }, 0);
  };
  const [rsvpStatus, setRsvpStatus] = useState(guest.rsvpStatus || "pending");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      tableId: tableId || null,
      rsvpStatus,
      plusCount,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={t("guests.editGuest")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("guests.name")} *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={t("guests.namePlaceholder")}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("common.status")}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRsvpStatus("accepted")}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                rsvpStatus === "accepted"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-border hover:bg-secondary"
              )}
            >
              <Check className="w-4 h-4 inline mr-1.5" />
              {t("guests.willCome")}
            </button>
            <button
              type="button"
              onClick={() => setRsvpStatus("pending")}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                rsvpStatus === "pending"
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "border-border hover:bg-secondary"
              )}
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              {t("guests.waitingAnswer")}
            </button>
            <button
              type="button"
              onClick={() => setRsvpStatus("declined")}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors",
                rsvpStatus === "declined"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "border-border hover:bg-secondary"
              )}
            >
              <X className="w-4 h-4 inline mr-1.5" />
              {t("guests.wontCome")}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              {t("guests.additionalGuests")}
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlusCount(Math.max(0, plusCount - 1))}
              className="w-10 h-10 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-lg font-medium disabled:opacity-50"
              disabled={plusCount === 0}
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold">{plusCount}</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {plusCount === 0 ? t("guests.comesAlone") : `+${plusCount} (${t("common.total")} ${plusCount + 1})`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlusCount(plusCount + 1)}
              className="w-10 h-10 rounded-lg border border-border hover:bg-secondary flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t("guests.phone")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="+7 777 123 4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="email@example.com"
          />
        </div>
        {tables.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4" />
                {t("seating.table")}
              </span>
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="input"
            >
              <option value="">{t("guests.notAssigned")}</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {formatTableName(table.number, table.name)} ({getOccupied(table)}/{table.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary btn-md">
            {t("common.save")}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// Parse guest name with optional +N suffix
// Examples: "Арман +1" -> { name: "Арман", plusCount: 1 }
//           "Дана+2" -> { name: "Дана", plusCount: 2 }
//           "Алмас" -> { name: "Алмас", plusCount: 0 }
function parseGuestName(input: string): { name: string; plusCount: number } {
  const trimmed = input.trim();
  // Match +N at the end (with or without space before +)
  const match = trimmed.match(/^(.+?)\s*\+(\d+)$/);
  if (match) {
    return {
      name: match[1].trim(),
      plusCount: parseInt(match[2], 10),
    };
  }
  return { name: trimmed, plusCount: 0 };
}

function ImportModal({
  onClose,
  onImport,
  t,
}: {
  onClose: () => void;
  onImport: (guests: { name: string; plusCount: number }[]) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [text, setText] = useState("");

  // Parse input: split by newlines and commas, then parse each name
  const parseInput = (input: string) => {
    return input
      .split(/[\n,]/) // Split by newline or comma
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map(parseGuestName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guests = parseInput(text);
    if (guests.length === 0) return;
    onImport(guests);
  };

  const parsed = parseInput(text);
  const withPlusOnes = parsed.filter(g => g.plusCount > 0);
  const totalPeople = parsed.reduce((sum, g) => sum + 1 + g.plusCount, 0);

  return (
    <Modal isOpen onClose={onClose} title={t("guests.importGuests")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {t("guests.importHint")}
            <br />
            <span className="text-primary font-medium">{t("guests.importTip")}</span>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input min-h-[200px]"
            placeholder="Айдар Сериков +1&#10;Дана Касымова&#10;Алмас Нурланов +2, Болат Жумабеков"
            autoFocus
          />
          {parsed.length > 0 && (
            <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">{t("guests.guests")}:</span>{" "}
                <span className="font-medium">{parsed.length}</span>
              </p>
              {withPlusOnes.length > 0 && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t("guests.withCompanions")}:</span>{" "}
                  <span className="font-medium text-emerald-600">{withPlusOnes.length}</span>
                  <span className="text-muted-foreground"> (</span>
                  {withPlusOnes.slice(0, 3).map((g, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      {g.name} <span className="text-emerald-600">+{g.plusCount}</span>
                    </span>
                  ))}
                  {withPlusOnes.length > 3 && <span className="text-muted-foreground"> {t("guests.andMore", { count: withPlusOnes.length - 3 })}</span>}
                  <span className="text-muted-foreground">)</span>
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">{t("guests.totalWillCome")}:</span>{" "}
                <span className="font-bold">{totalPeople}</span> {t("guests.people")}
              </p>
            </div>
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary btn-md" disabled={parsed.length === 0}>
            {t("guests.importAction")} {parsed.length > 0 && `(${parsed.length})`}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
