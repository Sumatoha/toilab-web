"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/api";
import toast from "react-hot-toast";
import { User, CreditCard, Bell } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await auth.updateProfile({ name });
      setUser(updated);
      toast.success("Профиль обновлен");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const planLabels = {
    free: "Бесплатный",
    standard: "Стандарт",
    premium: "Премиум",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом и подпиской</p>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Профиль</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="input w-full bg-secondary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email нельзя изменить
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || name === user?.name}
            className="btn-primary"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Подписка</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div>
            <p className="font-medium">
              {planLabels[user?.plan as keyof typeof planLabels] || "Бесплатный"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.plan === "free"
                ? "1 мероприятие, до 30 гостей"
                : user?.plan === "standard"
                ? "3 мероприятия, до 300 гостей"
                : "10 мероприятий, до 500 гостей"}
            </p>
          </div>
          {user?.plan === "free" && (
            <button className="btn-primary btn-sm">Улучшить</button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Уведомления</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Email о новых RSVP ответах</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Напоминания о задачах</span>
          </label>
        </div>
      </div>
    </div>
  );
}
