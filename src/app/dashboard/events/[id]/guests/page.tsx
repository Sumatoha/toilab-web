"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Upload,
  Search,
  MoreHorizontal,
  Check,
  X,
  Clock,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { guests } from "@/lib/api";
import { Guest, GuestStats } from "@/lib/types";
import { cn, rsvpStatusLabels } from "@/lib/utils";
import toast from "react-hot-toast";

export default function GuestsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      const [guestsData, statsData] = await Promise.all([
        guests.list(eventId),
        guests.getStats(eventId),
      ]);
      setGuestList(guestsData);
      setStats(statsData);
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

  const handleAddGuest = async (name: string, phone?: string, email?: string) => {
    try {
      const newGuest = await guests.create(eventId, { name, phone, email });
      setGuestList((prev) => [...prev, newGuest]);
      setShowAddModal(false);
      toast.success("Гость добавлен");
      loadData(); // Reload stats
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось добавить гостя");
    }
  };

  const handleImportGuests = async (names: string[]) => {
    try {
      const result = await guests.import(eventId, { names });
      setGuestList((prev) => [...prev, ...result.guests]);
      setShowImportModal(false);
      toast.success(`Добавлено ${result.created} гостей`);
      loadData(); // Reload stats
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось импортировать гостей");
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Удалить гостя?")) return;

    try {
      await guests.delete(eventId, guestId);
      setGuestList((prev) => prev.filter((g) => g.id !== guestId));
      toast.success("Гость удален");
      loadData(); // Reload stats
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить гостя");
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
          <h1 className="text-2xl font-display font-bold">Гости</h1>
          <p className="text-muted-foreground">
            Управляйте списком гостей и отслеживайте RSVP
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-outline btn-sm">
            <Upload className="w-4 h-4 mr-2" />
            Импорт
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-2" />
            Добавить гостя
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Всего"
            value={stats.total}
            color="gray"
          />
          <StatCard
            icon={UserCheck}
            label="Придут"
            value={stats.accepted}
            subtext={stats.plusOnes > 0 ? `+${stats.plusOnes} сопровождающих` : undefined}
            color="green"
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
            color="yellow"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
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
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {[
            { key: "all", label: "Все" },
            { key: "accepted", label: "Придут" },
            { key: "pending", label: "Ожидание" },
            { key: "declined", label: "Не придут" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                filter === f.key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guest list */}
      <div className="card">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {guestList.length === 0
                ? "Список гостей пуст"
                : "Нет гостей по заданным фильтрам"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredGuests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                onDelete={() => handleDeleteGuest(guest.id)}
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
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportGuests}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtext?: string;
  color: "gray" | "green" | "red" | "yellow";
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

function GuestRow({ guest, onDelete }: { guest: Guest; onDelete: () => void }) {
  const statusConfig = rsvpStatusLabels[guest.rsvpStatus];

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-primary font-medium">
          {guest.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{guest.name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {guest.phone && <span>{guest.phone}</span>}
          {guest.group && <span>• {guest.group}</span>}
          {guest.plusCount > 0 && <span>• +{guest.plusCount}</span>}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          statusConfig.color === "green" && "bg-green-100 text-green-700",
          statusConfig.color === "red" && "bg-red-100 text-red-700",
          statusConfig.color === "gray" && "bg-gray-100 text-gray-700"
        )}
      >
        {statusConfig.color === "green" && <Check className="w-3 h-3" />}
        {statusConfig.color === "red" && <X className="w-3 h-3" />}
        {statusConfig.color === "gray" && <Clock className="w-3 h-3" />}
        {statusConfig.ru}
      </span>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddGuestModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, phone?: string, email?: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), phone.trim() || undefined, email.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Добавить гостя</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Имя *</label>
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
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="email@example.com"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Импорт гостей</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Список имён (по одному на строку)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input min-h-[200px]"
              placeholder="Айдар Сериков&#10;Дана Касымова&#10;Алмас Нурланов"
            />
            {previewCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Будет добавлено: {previewCount} гостей
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline btn-md flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary btn-md flex-1">
              Импортировать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
