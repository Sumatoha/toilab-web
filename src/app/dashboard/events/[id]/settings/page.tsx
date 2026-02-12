"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Check, Link2, Plus, Copy, RefreshCw, Eye, Edit3, Lock, X } from "lucide-react";
import { events, shares } from "@/lib/api";
import { Event, UpdateEventRequest, ShareLink, ShareAccessLevel } from "@/lib/types";
import { PageLoader, ConfirmDialog, SuccessDialog, Modal, ModalFooter } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateEventRequest>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sharing state
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await events.get(eventId);
        setEvent(data);
        setFormData({
          title: data.title,
          person1: data.person1 || "",
          person2: data.person2 || "",
          date: data.date || "",
          time: data.time || "",
          totalBudget: data.totalBudget,
          venue: data.venue || {},
          greetingRu: data.greetingRu || "",
          hashtag: data.hashtag || "",
        });
        // Load share links
        loadShareLinks();
      } catch (error) {
        console.error("Failed to load event:", error);
        toast.error("Не удалось загрузить");
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  async function loadShareLinks() {
    setIsLoadingShares(true);
    try {
      const links = await shares.list(eventId);
      setShareLinks(links || []);
    } catch (error) {
      console.error("Failed to load share links:", error);
    } finally {
      setIsLoadingShares(false);
    }
  }

  async function handleCreateShare(data: { accessLevel: ShareAccessLevel; pinCode?: string; label?: string }) {
    try {
      const link = await shares.create(eventId, data);
      setShareLinks((prev) => [link, ...prev]);
      setShowShareModal(false);
      toast.success("Ссылка создана");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось создать ссылку");
    }
  }

  async function handleDeactivateShare(shareId: string) {
    try {
      await shares.deactivate(eventId, shareId);
      setShareLinks((prev) => prev.map((l) => (l.id === shareId ? { ...l, isActive: false } : l)));
      toast.success("Ссылка деактивирована");
    } catch {
      toast.error("Не удалось деактивировать");
    }
  }

  async function handleRegenerateShare(shareId: string) {
    try {
      const link = await shares.regenerate(eventId, shareId);
      setShareLinks((prev) => prev.map((l) => (l.id === shareId ? link : l)));
      toast.success("Ссылка обновлена");
    } catch {
      toast.error("Не удалось обновить");
    }
  }

  async function handleDeleteShare(shareId: string) {
    try {
      await shares.delete(eventId, shareId);
      setShareLinks((prev) => prev.filter((l) => l.id !== shareId));
      toast.success("Ссылка удалена");
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  function getShareUrl(token: string) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/share/${token}`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано");
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await events.update(eventId, formData);
      setShowSuccessModal(true);
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await events.delete(eventId);
      router.push("/dashboard");
    } catch {
      toast.error("Не удалось удалить");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleActivate() {
    try {
      await events.activate(eventId);
      toast.success("Активировано");
      const data = await events.get(eventId);
      setEvent(data);
    } catch {
      toast.error("Не удалось активировать");
    }
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (!event) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-muted-foreground">Редактирование мероприятия</p>
      </div>

      {event.status === "draft" && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">Мероприятие в черновике</p>
          <button onClick={handleActivate} className="btn-primary btn-sm">
            <Check className="w-4 h-4" />
            Активировать
          </button>
        </div>
      )}

      {/* Basic */}
      <section className="space-y-4">
        <h2 className="font-medium">Основное</h2>
        <div>
          <label className="block text-sm mb-1.5">Название</label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1.5">Имя 1</label>
            <input
              type="text"
              value={formData.person1 || ""}
              onChange={(e) => setFormData({ ...formData, person1: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Имя 2</label>
            <input
              type="text"
              value={formData.person2 || ""}
              onChange={(e) => setFormData({ ...formData, person2: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </section>

      {/* Date & Time */}
      <section className="space-y-4">
        <h2 className="font-medium">Дата и время</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1.5">Дата</label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Время</label>
            <input
              type="time"
              value={formData.time || ""}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="space-y-4">
        <h2 className="font-medium">Место</h2>
        <div>
          <label className="block text-sm mb-1.5">Название</label>
          <input
            type="text"
            value={formData.venue?.name || ""}
            onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, name: e.target.value } })}
            className="input"
            placeholder="Ресторан"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Адрес</label>
          <input
            type="text"
            value={formData.venue?.address || ""}
            onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })}
            className="input"
            placeholder="ул. Абая 150"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Город</label>
          <input
            type="text"
            value={formData.venue?.city || ""}
            onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, city: e.target.value } })}
            className="input"
            placeholder="Алматы"
          />
        </div>
      </section>

      {/* Budget */}
      <section className="space-y-4">
        <h2 className="font-medium">Бюджет</h2>
        <div>
          <label className="block text-sm mb-1.5">Общий бюджет (тенге)</label>
          <input
            type="number"
            value={formData.totalBudget || ""}
            onChange={(e) => setFormData({ ...formData, totalBudget: parseInt(e.target.value) || 0 })}
            className="input"
          />
        </div>
      </section>

      {/* Invitation text */}
      <section className="space-y-4">
        <h2 className="font-medium">Приглашение</h2>
        <div>
          <label className="block text-sm mb-1.5">Приветствие</label>
          <textarea
            value={formData.greetingRu || ""}
            onChange={(e) => setFormData({ ...formData, greetingRu: e.target.value })}
            className="input min-h-[80px]"
            placeholder="Приглашаем вас..."
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Хэштег</label>
          <input
            type="text"
            value={formData.hashtag || ""}
            onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
            className="input"
            placeholder="#НашаСвадьба"
          />
        </div>
      </section>

      {/* Sharing */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Доступ по ссылке
            </h2>
            <p className="text-sm text-muted-foreground">Поделитесь дашбордом с партнёром или координатором</p>
          </div>
          <button onClick={() => setShowShareModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Создать ссылку
          </button>
        </div>

        {isLoadingShares ? (
          <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
        ) : shareLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Нет активных ссылок</p>
            <p className="text-sm">Создайте ссылку для доступа к дашборду</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shareLinks.map((link) => (
              <div
                key={link.id}
                className={cn(
                  "p-4 rounded-lg border",
                  link.isActive ? "border-border bg-white" : "border-border/50 bg-secondary/30 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {link.accessLevel === "editor" ? (
                        <span className="badge-success flex items-center gap-1 text-xs">
                          <Edit3 className="w-3 h-3" />
                          Редактор
                        </span>
                      ) : (
                        <span className="badge-default flex items-center gap-1 text-xs">
                          <Eye className="w-3 h-3" />
                          Просмотр
                        </span>
                      )}
                      {link.pinCode && (
                        <span className="badge-warning flex items-center gap-1 text-xs">
                          <Lock className="w-3 h-3" />
                          PIN
                        </span>
                      )}
                      {!link.isActive && (
                        <span className="badge-default text-xs">Неактивна</span>
                      )}
                    </div>
                    {link.label && (
                      <p className="font-medium text-sm">{link.label}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {getShareUrl(link.token)}
                    </p>
                  </div>
                  {link.isActive && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(getShareUrl(link.token))}
                        className="btn-ghost btn-sm"
                        title="Копировать ссылку"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRegenerateShare(link.id)}
                        className="btn-ghost btn-sm"
                        title="Обновить токен"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivateShare(link.id)}
                        className="btn-ghost btn-sm text-amber-600"
                        title="Деактивировать"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShare(link.id)}
                        className="btn-ghost btn-sm text-red-600"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button onClick={() => setShowDeleteModal(true)} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary btn-md">
          {isSaving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Success Modal */}
      <SuccessDialog
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Сохранено"
        description="Настройки мероприятия успешно обновлены"
        buttonText="К мероприятию"
        onButtonClick={() => router.push(`/dashboard/events/${eventId}`)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Удалить мероприятие?"
        description="Это действие нельзя отменить. Все данные мероприятия будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Create Share Modal */}
      <CreateShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSubmit={handleCreateShare}
      />
    </div>
  );
}

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { accessLevel: ShareAccessLevel; pinCode?: string; label?: string }) => void;
}

function CreateShareModal({ isOpen, onClose, onSubmit }: CreateShareModalProps) {
  const [accessLevel, setAccessLevel] = useState<ShareAccessLevel>("view");
  const [usePin, setUsePin] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usePin && pinCode.length !== 4) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        accessLevel,
        pinCode: usePin ? pinCode : undefined,
        label: label || undefined,
      });
      // Reset form
      setAccessLevel("view");
      setUsePin(false);
      setPinCode("");
      setLabel("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать ссылку доступа">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Уровень доступа</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccessLevel("view")}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-colors",
                accessLevel === "view"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4" />
                <span className="font-medium">Просмотр</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Только просмотр статистики
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAccessLevel("editor")}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-colors",
                accessLevel === "editor"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Edit3 className="w-4 h-4" />
                <span className="font-medium">Редактор</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Просмотр и редактирование
              </p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Название (опционально)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
            placeholder="Для координатора"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={usePin}
              onChange={(e) => {
                setUsePin(e.target.checked);
                if (!e.target.checked) setPinCode("");
              }}
              className="rounded border-border"
            />
            <span className="text-sm">Защитить PIN-кодом</span>
          </label>

          {usePin && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                4-значный PIN-код
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                className="input text-center text-xl tracking-widest w-32"
                placeholder="____"
              />
            </div>
          )}
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-ghost btn-md">
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (usePin && pinCode.length !== 4)}
            className="btn-primary btn-md"
          >
            {isSubmitting ? "Создание..." : "Создать"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
