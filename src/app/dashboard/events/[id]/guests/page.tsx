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
} from "lucide-react";
import { guests } from "@/lib/api";
import { Guest, GuestStats } from "@/lib/types";
import { cn, rsvpStatusLabels } from "@/lib/utils";
import { PageLoader, StatCard, Modal, ModalFooter, EmptyState } from "@/components/ui";
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
      setGuestList(guestsData || []);
      setStats(statsData || { total: 0, accepted: 0, declined: 0, pending: 0, plusOnes: 0 });
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
    return <PageLoader />;
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Всего"
            value={stats.total}
            iconColor="default"
          />
          <StatCard
            icon={UserCheck}
            label="Придут"
            value={stats.accepted}
            sublabel={stats.plusOnes > 0 ? `+${stats.plusOnes} сопровождающих` : undefined}
            iconColor="success"
          />
          <StatCard
            icon={UserX}
            label="Не придут"
            value={stats.declined}
            iconColor="error"
          />
          <StatCard
            icon={Clock}
            label="Ожидание"
            value={stats.pending}
            iconColor="warning"
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
      <div className="card p-0">
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

function GuestRow({ guest, onDelete }: { guest: Guest; onDelete: () => void }) {
  const statusConfig = rsvpStatusLabels[guest.rsvpStatus] || { ru: "Неизвестно", color: "gray" };

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors">
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
          statusConfig.color === "green" && "badge-success",
          statusConfig.color === "red" && "badge-error",
          statusConfig.color === "gray" && "badge-warning"
        )}
      >
        {statusConfig.color === "green" && <Check className="w-3 h-3 mr-1" />}
        {statusConfig.color === "red" && <X className="w-3 h-3 mr-1" />}
        {statusConfig.color === "gray" && <Clock className="w-3 h-3 mr-1" />}
        {statusConfig.ru}
      </span>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        title="Удалить"
      >
        <Trash2 className="w-4 h-4" />
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
