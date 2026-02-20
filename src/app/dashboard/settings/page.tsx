"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/api";
import toast from "react-hot-toast";
import { User, CreditCard, Bell, Check, Sparkles, Crown, Zap, Gift } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Plan } from "@/lib/types";

interface PlanInfo {
  name: string;
  price: number;
  period?: string;
  description: string;
  features: string[];
  limitations?: string[];
  icon: typeof Zap;
  color: string;
}

const PLANS: Record<Plan, PlanInfo> = {
  free: {
    name: "Toilab",
    price: 0,
    description: "Бесплатный доступ",
    features: ["1 мероприятие", "Бюджет", "Чек-лист", "Программа"],
    limitations: ["Без гостей", "Без рассадки", "Без приглашений"],
    icon: Zap,
    color: "slate",
  },
  single: {
    name: "Toilab Pro",
    price: 7990,
    description: "Для вашего мероприятия",
    features: ["Все функции", "Список гостей", "Рассадка", "Приглашения", "Подарки", "Поделиться"],
    icon: Sparkles,
    color: "primary",
  },
  pro: {
    name: "Toilab Studio",
    price: 24990,
    period: "/мес",
    description: "Для вашего агентства",
    features: ["До 10 мероприятий", "Все функции", "Приоритетная поддержка"],
    icon: Crown,
    color: "amber",
  },
  trial: {
    name: "Toilab Pro (пробный)",
    price: 0,
    description: "Полный доступ",
    features: ["Все функции Pro", "Ограниченный срок"],
    icon: Sparkles,
    color: "emerald",
  },
};

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [activatingPromo, setActivatingPromo] = useState(false);

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

  const handleActivatePromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Введите промокод");
      return;
    }
    setActivatingPromo(true);
    try {
      const updated = await auth.activatePromo(promoCode.trim().toUpperCase());
      setUser(updated);
      setPromoCode("");
      toast.success("Пробный период активирован!");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Неверный промокод");
    } finally {
      setActivatingPromo(false);
    }
  };

  const currentPlan = PLANS[user?.plan as Plan] || PLANS.free;
  const isPaid = user?.plan === "single" || user?.plan === "pro" || user?.plan === "trial";

  return (
    <div className="max-w-3xl space-y-6">
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

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Ваш тариф</h2>
        </div>

        <div className={cn(
          "p-4 rounded-xl border-2",
          isPaid ? "border-primary bg-primary/5" : "border-border bg-secondary/50"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isPaid ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
              )}>
                <currentPlan.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{currentPlan.name}</h3>
                <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
              </div>
            </div>
            {currentPlan.price > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentPlan.price.toLocaleString()} ₸
                </div>
                {currentPlan.period && (
                  <div className="text-sm text-muted-foreground">{currentPlan.period}</div>
                )}
              </div>
            )}
          </div>

          {/* Pro plan stats */}
          {(user?.plan === "pro" || user?.plan === "trial") && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Мероприятий в этом месяце:</span>
                <span className="font-medium">{user?.monthlyEventsCreated || 0} / 10</span>
              </div>
              {user?.monthlyResetAt && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Обновление лимита:</span>
                  <span className="font-medium">{formatDate(user.monthlyResetAt)}</span>
                </div>
              )}
            </div>
          )}

          {/* Plan expires */}
          {user?.planExpiresAt && (user?.plan === "pro" || user?.plan === "trial") && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {user?.plan === "trial" ? "Пробный период до:" : "Подписка активна до:"}
                </span>
                <span className="font-medium">{formatDate(user.planExpiresAt)}</span>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              {currentPlan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade options for free users */}
      {user?.plan === "free" && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Откройте все возможности</h2>
          <p className="text-sm text-muted-foreground mb-4">Создайте мероприятие мечты с полным набором инструментов</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Pro */}
            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Toilab Pro</h3>
                  <p className="text-xs text-muted-foreground">Для вашего мероприятия</p>
                </div>
              </div>
              <div className="text-2xl font-bold mb-3">7 990 ₸</div>
              <ul className="space-y-1.5 mb-4">
                {PLANS.single.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="btn-primary w-full h-10">Выбрать Pro</button>
            </div>

            {/* Studio */}
            <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <h3 className="font-bold">Toilab Studio</h3>
                  <p className="text-xs text-muted-foreground">Для вашего агентства</p>
                </div>
              </div>
              <div className="text-2xl font-bold mb-3">
                24 990 ₸<span className="text-sm font-normal text-muted-foreground">/мес</span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {PLANS.pro.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full h-10 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold rounded-lg transition-colors">
                Выбрать Studio
              </button>
            </div>
          </div>

          {/* Promo code */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Есть промокод?</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Введите промокод"
                className="input flex-1"
              />
              <button
                onClick={handleActivatePromo}
                disabled={activatingPromo || !promoCode.trim()}
                className="btn-primary px-6"
              >
                {activatingPromo ? "..." : "Применить"}
              </button>
            </div>
          </div>
        </div>
      )}

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
