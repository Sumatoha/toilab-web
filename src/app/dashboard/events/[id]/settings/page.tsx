"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Calendar, MapPin, Wallet } from "lucide-react";
import { events } from "@/lib/api";
import { Event, UpdateEventRequest } from "@/lib/types";
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
    loadEvent();
  }, [eventId]);

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
        greetingKz: data.greetingKz || "",
        hashtag: data.hashtag || "",
      });
    } catch (error) {
      console.error("Failed to load event:", error);
      toast.error("Не удалось загрузить мероприятие");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await events.update(eventId, formData);
      toast.success("Изменения сохранены");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Вы уверены? Это действие нельзя отменить.")) return;

    try {
      await events.delete(eventId);
      toast.success("Мероприятие удалено");
      router.push("/dashboard");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось удалить");
    }
  }

  async function handleActivate() {
    try {
      await events.activate(eventId);
      toast.success("Мероприятие активировано!");
      loadEvent();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось активировать");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold mb-2">Мероприятие не найдено</h2>
        <Link href="/dashboard" className="text-primary hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к мероприятию
        </Link>
        <h1 className="text-2xl font-display font-bold">Настройки</h1>
        <p className="text-muted-foreground">Редактирование мероприятия</p>
      </div>

      {/* Status */}
      {event.status === "draft" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            Мероприятие в черновике. Активируйте его, чтобы гости могли видеть приглашение.
          </p>
          <button onClick={handleActivate} className="btn-primary btn-sm mt-3">
            Активировать мероприятие
          </button>
        </div>
      )}

      {/* Basic Info */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg">Основная информация</h2>

        <div>
          <label className="block text-sm font-medium mb-2">Название</label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Имя 1</label>
            <input
              type="text"
              value={formData.person1 || ""}
              onChange={(e) => setFormData({ ...formData, person1: e.target.value })}
              className="input"
              placeholder="Айдар"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Имя 2</label>
            <input
              type="text"
              value={formData.person2 || ""}
              onChange={(e) => setFormData({ ...formData, person2: e.target.value })}
              className="input"
              placeholder="Дана"
            />
          </div>
        </div>
      </section>

      {/* Date & Time */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Дата и время
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Дата</label>
            <input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Время</label>
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
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Место проведения
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2">Название места</label>
          <input
            type="text"
            value={formData.venue?.name || ""}
            onChange={(e) => setFormData({
              ...formData,
              venue: { ...formData.venue, name: e.target.value }
            })}
            className="input"
            placeholder="Ресторан Достар"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Адрес</label>
          <input
            type="text"
            value={formData.venue?.address || ""}
            onChange={(e) => setFormData({
              ...formData,
              venue: { ...formData.venue, address: e.target.value }
            })}
            className="input"
            placeholder="ул. Абая 150"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Город</label>
          <input
            type="text"
            value={formData.venue?.city || ""}
            onChange={(e) => setFormData({
              ...formData,
              venue: { ...formData.venue, city: e.target.value }
            })}
            className="input"
            placeholder="Алматы"
          />
        </div>
      </section>

      {/* Budget */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Бюджет
        </h2>

        <div>
          <label className="block text-sm font-medium mb-2">Общий бюджет (тенге)</label>
          <input
            type="number"
            value={formData.totalBudget || ""}
            onChange={(e) => setFormData({ ...formData, totalBudget: parseInt(e.target.value) || 0 })}
            className="input"
            placeholder="1000000"
          />
        </div>
      </section>

      {/* Invitation Text */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg">Текст приглашения</h2>

        <div>
          <label className="block text-sm font-medium mb-2">Приветствие (русский)</label>
          <textarea
            value={formData.greetingRu || ""}
            onChange={(e) => setFormData({ ...formData, greetingRu: e.target.value })}
            className="input min-h-[100px]"
            placeholder="Дорогие друзья! Приглашаем вас на наше торжество..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Приветствие (казахский)</label>
          <textarea
            value={formData.greetingKz || ""}
            onChange={(e) => setFormData({ ...formData, greetingKz: e.target.value })}
            className="input min-h-[100px]"
            placeholder="Құрметті достар! Сіздерді біздің тойға шақырамыз..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Хэштег</label>
          <input
            type="text"
            value={formData.hashtag || ""}
            onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
            className="input"
            placeholder="#AidarDana2024"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleDelete}
          className="btn-ghost text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить мероприятие
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary btn-md"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}
