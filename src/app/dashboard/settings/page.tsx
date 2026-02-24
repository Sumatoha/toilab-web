"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";
import { User, CreditCard, Bell, Check, Sparkles, Crown, Zap, Gift, Globe } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Plan } from "@/lib/types";

interface PlanInfoDef {
  nameKey: string;
  price: number;
  period?: string;
  descriptionKey: string;
  featureKeys: string[];
  limitationKeys?: string[];
  icon: typeof Zap;
  color: string;
}

const PLANS_DEF: Record<Plan, PlanInfoDef> = {
  free: {
    nameKey: "Toilab",
    price: 0,
    descriptionKey: "settings.plans.free",
    featureKeys: ["settings.planFeatures.oneEvent", "settings.planFeatures.budget", "settings.planFeatures.checklist", "settings.planFeatures.program"],
    limitationKeys: ["settings.planFeatures.noGuests", "settings.planFeatures.noSeating", "settings.planFeatures.noInvitations"],
    icon: Zap,
    color: "slate",
  },
  single: {
    nameKey: "Toilab Pro",
    price: 7990,
    descriptionKey: "settings.plans.single",
    featureKeys: ["settings.planFeatures.allFeatures", "settings.planFeatures.guestList", "settings.planFeatures.seating", "settings.planFeatures.invitations", "settings.planFeatures.gifts", "settings.planFeatures.share"],
    icon: Sparkles,
    color: "primary",
  },
  pro: {
    nameKey: "Toilab Studio",
    price: 24990,
    period: "/мес",
    descriptionKey: "settings.plans.pro",
    featureKeys: ["settings.planFeatures.upTo10Events", "settings.planFeatures.allFeatures", "settings.planFeatures.prioritySupport"],
    icon: Crown,
    color: "amber",
  },
  trial: {
    nameKey: "Toilab Pro",
    price: 0,
    descriptionKey: "settings.plans.trial",
    featureKeys: ["settings.planFeatures.allProFeatures", "settings.planFeatures.limitedTime"],
    icon: Sparkles,
    color: "emerald",
  },
};

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { t, locale, setLocale, canChangeLanguage } = useTranslation();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [activatingPromo, setActivatingPromo] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await auth.updateProfile({ name });
      setUser(updated);
      toast.success(t("settings.profileSaved"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("errors.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleActivatePromo = async () => {
    if (!promoCode.trim()) {
      toast.error(t("errors.required"));
      return;
    }
    setActivatingPromo(true);
    try {
      const updated = await auth.activatePromo(promoCode.trim().toUpperCase());
      setUser(updated);
      setPromoCode("");
      toast.success(t("settings.promoActivated"));
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("settings.promoError"));
    } finally {
      setActivatingPromo(false);
    }
  };

  const currentPlanDef = PLANS_DEF[user?.plan as Plan] || PLANS_DEF.free;
  const isPaid = user?.plan === "single" || user?.plan === "pro" || user?.plan === "trial";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.profileSettings")}</p>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("nav.profile")}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("settings.yourName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("settings.yourEmail")}</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="input w-full bg-secondary"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || name === user?.name}
            className="btn-primary h-10 px-6"
          >
            {saving ? t("common.loading") : t("settings.saveChanges")}
          </button>
        </div>
      </div>

      {/* Language - Only for KZ users */}
      {canChangeLanguage && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("settings.language")}</h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setLocale("kk")}
              className={cn(
                "flex-1 h-12 rounded-lg font-medium transition-colors",
                locale === "kk"
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {t("settings.languageKk")}
            </button>
            <button
              onClick={() => setLocale("ru")}
              className={cn(
                "flex-1 h-12 rounded-lg font-medium transition-colors",
                locale === "ru"
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {t("settings.languageRu")}
            </button>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("settings.plan")}</h2>
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
                <currentPlanDef.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{currentPlanDef.nameKey}</h3>
                <p className="text-sm text-muted-foreground">{t(currentPlanDef.descriptionKey)}</p>
              </div>
            </div>
            {currentPlanDef.price > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentPlanDef.price.toLocaleString()} ₸
                </div>
                {currentPlanDef.period && (
                  <div className="text-sm text-muted-foreground">{currentPlanDef.period}</div>
                )}
              </div>
            )}
          </div>

          {/* Pro plan stats */}
          {(user?.plan === "pro" || user?.plan === "trial") && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("settings.eventsThisMonth")}:</span>
                <span className="font-medium">{user?.monthlyEventsCreated || 0} / 10</span>
              </div>
              {user?.monthlyResetAt && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">{t("settings.limitReset")}:</span>
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
                  {user?.plan === "trial" ? t("settings.trialUntil") : t("settings.subscriptionUntil")}:
                </span>
                <span className="font-medium">{formatDate(user.planExpiresAt)}</span>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              {currentPlanDef.featureKeys.map((featureKey) => (
                <div key={featureKey} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{t(featureKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade options for free users */}
      {user?.plan === "free" && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">{t("pro.upgradeDescription")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("pro.features")}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Pro */}
            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Toilab Pro</h3>
                  <p className="text-xs text-muted-foreground">{t("settings.plans.single")}</p>
                </div>
              </div>
              <div className="text-2xl font-bold mb-3">7 990 ₸</div>
              <ul className="space-y-1.5 mb-4">
                {PLANS_DEF.single.featureKeys.map((fKey) => (
                  <li key={fKey} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {t(fKey)}
                  </li>
                ))}
              </ul>
              <button className="btn-primary w-full h-10">{t("settings.upgrade")}</button>
            </div>

            {/* Studio */}
            <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <h3 className="font-bold">Toilab Studio</h3>
                  <p className="text-xs text-muted-foreground">{t("settings.plans.pro")}</p>
                </div>
              </div>
              <div className="text-2xl font-bold mb-3">
                24 990 ₸<span className="text-sm font-normal text-muted-foreground">/мес</span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {PLANS_DEF.pro.featureKeys.map((fKey) => (
                  <li key={fKey} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {t(fKey)}
                  </li>
                ))}
              </ul>
              <button className="w-full h-10 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold rounded-lg transition-colors">
                {t("settings.upgrade")}
              </button>
            </div>
          </div>

          {/* Promo code */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("settings.promoCode")}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={t("settings.promoCode")}
                className="input flex-1"
              />
              <button
                onClick={handleActivatePromo}
                disabled={activatingPromo || !promoCode.trim()}
                className="btn-primary px-6"
              >
                {activatingPromo ? "..." : t("settings.activatePromo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("settings.notifications")}</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">{t("settings.emailRsvp")}</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">{t("settings.taskReminders")}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
