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
import { guests, seating } from "@/lib/api";
import { Guest, GuestStats, SeatingTable } from "@/lib/types";
import { cn, rsvpStatusLabels, formatTableName } from "@/lib/utils";
import { PageLoader, Modal, ModalFooter, EmptyState, ConfirmDialog, Avatar, ProgressBar } from "@/components/ui";
import toast from "react-hot-toast";

export default function GuestsPage() {
  const params = useParams();
  const eventId = params.id as string;

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

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [guestsData, statsData, tablesData] = await Promise.all([
        guests.list(eventId),
        guests.getStats(eventId),
        seating.getTables(eventId).catch(() => []), // Tables might not exist yet
      ]);
      setGuestList(guestsData || []);
      setStats(statsData || { total: 0, accepted: 0, declined: 0, pending: 0, plusOnes: 0, attending: 0 });
      // Filter out scene elements
      setTables((tablesData || []).filter(t => t.shape !== "scene"));
    } catch (error) {
      console.error("Failed to load guests:", error);
      toast.error("Не удалось загрузить гостей");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredGuests = guestList.filter((guest) => {
    if (filter !== "all" && guest.rsvpStatus !== filter) return false;
    if (search && !guest.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddGuest = async (data: { name: string; phone?: string; email?: string; tableId?: string }) => {
    try {
      const newGuest = await guests.create(eventId, { name: data.name, phone: data.phone, email: data.email });

      // If tableId provided, assign guest to table
      if (data.tableId) {
        await seating.assignGuest(eventId, data.tableId, newGuest.id);
      }

      setGuestList((prev) => [...prev, newGuest]);
      setShowAddModal(false);
      toast.success("Гость добавлен");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить гостя");
    }
  };

  const handleUpdateGuest = async (guestId: string, data: { name?: string; phone?: string; email?: string; tableId?: string | null }) => {
    try {
      // Update guest info
      await guests.update(eventId, guestId, {
        name: data.name,
        phone: data.phone,
        email: data.email,
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
      }

      setEditingGuest(null);
      toast.success("Гость обновлён");
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось обновить гостя");
    }
  };

  const handleImportGuests = async (names: string[]) => {
    try {
      const result = await guests.import(eventId, { names });
      setGuestList((prev) => [...prev, ...result.guests]);
      setShowImportModal(false);
      toast.success(`Добавлено ${result.created} гостей`);
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось импортировать гостей");
    }
  };

  const handleDeleteGuest = async () => {
    if (!deleteGuestId) return;
    setIsDeleting(true);
    try {
      await guests.delete(eventId, deleteGuestId);
      setGuestList((prev) => prev.filter((g) => g.id !== deleteGuestId));
      setDeleteGuestId(null);
      loadData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить гостя");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Гости</h1>
          <p className="text-caption mt-1">
            Управляйте списком гостей и отслеживайте RSVP
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-outline btn-sm">
            <Upload className="w-4 h-4" />
            Импорт
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Добавить гостя
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            icon={Users}
            label="Всего"
            value={stats.total}
            color="slate"
          />
          <StatCard
            icon={UserCheck}
            label="Придут"
            value={stats.accepted}
            sublabel={stats.plusOnes > 0 ? `+${stats.plusOnes}` : undefined}
            color="emerald"
          />
          <StatCard
            icon={UserX}
            label="Не придут"
            value={stats.declined}
            color="red"
          />
          <StatCard
            icon={Clock}
            label="Ожидание"
            value={stats.pending}
            color="amber"
          />
          <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-2">Отклик</div>
            <div className="text-2xl font-bold mb-2">{responseRate}%</div>
            <ProgressBar
              value={stats.accepted + stats.declined}
              max={stats.total || 1}
              color="primary"
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск гостей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Все", count: stats?.total },
            { key: "accepted", label: "Придут", count: stats?.accepted },
            { key: "pending", label: "Ожидание", count: stats?.pending },
            { key: "declined", label: "Не придут", count: stats?.declined },
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

      {/* Guest list */}
      <div className="card p-0 overflow-hidden">
        {filteredGuests.length === 0 ? (
          <EmptyState
            icon={Users}
            title={guestList.length === 0 ? "Список гостей пуст" : "Нет гостей по заданным фильтрам"}
            description={guestList.length === 0 ? "Добавьте первого гостя" : "Попробуйте изменить фильтры"}
            action={
              guestList.length === 0 ? (
                <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Добавить гостя
                </button>
              ) : undefined
            }
          />
        ) : (
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
        )}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <AddGuestModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddGuest}
          tables={tables}
        />
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <EditGuestModal
          guest={editingGuest}
          tables={tables}
          onClose={() => setEditingGuest(null)}
          onSave={(data) => handleUpdateGuest(editingGuest.id, data)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportGuests}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteGuestId}
        onClose={() => setDeleteGuestId(null)}
        onConfirm={handleDeleteGuest}
        title="Удалить гостя?"
        description="Гость будет удалён из списка"
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
  sublabel,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sublabel?: string;
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
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", styles.bg)}>
          <Icon className={cn("w-5 h-5", styles.text)} />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            {sublabel && (
              <span className="text-sm text-emerald-600 font-medium">{sublabel}</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      <RsvpBadge status={guest.rsvpStatus} label={statusConfig.ru} />
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

function RsvpBadge({ status, label }: { status: string; label: string }) {
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
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function AddGuestModal({
  onClose,
  onAdd,
  tables,
}: {
  onClose: () => void;
  onAdd: (data: { name: string; phone?: string; email?: string; tableId?: string }) => void;
  tables: SeatingTable[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tableId, setTableId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      tableId: tableId || undefined,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Добавить гостя">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Имя *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Имя гостя"
            autoFocus
          />
        </div>
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
                Стол
              </span>
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="input"
            >
              <option value="">Не назначен</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {formatTableName(table.number, table.name)} ({table.guestIds.length}/{table.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
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

function EditGuestModal({
  guest,
  tables,
  onClose,
  onSave,
}: {
  guest: Guest;
  tables: SeatingTable[];
  onClose: () => void;
  onSave: (data: { name?: string; phone?: string; email?: string; tableId?: string | null }) => void;
}) {
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone || "");
  const [email, setEmail] = useState(guest.email || "");
  const [tableId, setTableId] = useState(guest.tableId || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      tableId: tableId || null,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Редактировать гостя">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Имя *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Имя гостя"
            autoFocus
          />
        </div>
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
                Стол
              </span>
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="input"
            >
              <option value="">Не назначен</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {formatTableName(table.number, table.name)} ({table.guestIds.length}/{table.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
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

function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (names: string[]) => void;
}) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;
    onImport(names);
  };

  const previewCount = text
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n.length > 0).length;

  return (
    <Modal isOpen onClose={onClose} title="Импорт гостей" description="Добавьте имена гостей, по одному на строку">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input min-h-[200px]"
            placeholder="Айдар Сериков&#10;Дана Касымова&#10;Алмас Нурланов"
            autoFocus
          />
          {previewCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Будет добавлено: <span className="font-medium text-foreground">{previewCount}</span> гостей
            </p>
          )}
        </div>
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-outline btn-md">
            Отмена
          </button>
          <button type="submit" className="btn-primary btn-md">
            Импортировать
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
