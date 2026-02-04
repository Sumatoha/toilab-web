"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";
import { events } from "@/lib/api";
import { Event, UpdateEventRequest } from "@/lib/types";
import { PageLoader } from "@/components/ui";
import toast from "react-hot-toast";

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateEventRequest>({});

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
      } catch (error) {
        console.error("Failed to load event:", error);
        toast.error("Не удалось загрузить");
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await events.update(eventId, formData);
      toast.success("Сохранено");
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить мероприятие? Это действие нельзя отменить.")) return;
    try {
      await events.delete(eventId);
      toast.success("Удалено");
      router.push("/dashboard");
    } catch {
      toast.error("Не удалось удалить");
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button onClick={handleDelete} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary btn-md">
          {isSaving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
