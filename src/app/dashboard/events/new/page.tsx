"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Globe } from "lucide-react";
import { events } from "@/lib/api";
import { TimeInput } from "@/components/ui";
import { CreateEventRequest, Country } from "@/lib/types";
import { getExampleNames, currencyConfigs } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/hooks/use-translation";
import toast from "react-hot-toast";

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, locale, setLocale, canChangeLanguage } = useTranslation();
  const userCountry: Country = user?.country || "kz";
  const { person1: examplePerson1, person2: examplePerson2 } = getExampleNames(userCountry);
  const currencyName = currencyConfigs[userCountry]?.name?.toLowerCase() || "тенге";

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEventRequest>({
    type: "wedding",
    title: "",
    totalBudget: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error(t("event.enterWeddingTitle"));
      return;
    }

    setIsLoading(true);
    try {
      const event = await events.create(formData);
      toast.success(t("event.weddingCreated"));
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("event.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{t("event.newWedding")}</h1>
            <p className="text-muted-foreground">{t("event.fillBasicInfo")}</p>
          </div>
        </div>
      </div>

      {/* Language Selector for KZ users */}
      {canChangeLanguage && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t("event.selectLanguage")}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocale("kk")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  locale === "kk"
                    ? "bg-primary text-white"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                Қазақша
              </button>
              <button
                type="button"
                onClick={() => setLocale("ru")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  locale === "ru"
                    ? "bg-primary text-white"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                Русский
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("event.titleRequired")}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={locale === "kk"
                ? `${examplePerson1} мен ${examplePerson2} тойы`
                : `Свадьба ${examplePerson1} и ${examplePerson2}`
              }
              className="input"
              required
              autoFocus
            />
          </div>

          {/* Couple names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("event.groomName")}
              </label>
              <input
                type="text"
                value={formData.person1 || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, person1: e.target.value }))
                }
                placeholder={examplePerson1}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("event.brideName")}
              </label>
              <input
                type="text"
                value={formData.person2 || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, person2: e.target.value }))
                }
                placeholder={examplePerson2}
                className="input"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("event.weddingDate")}
              </label>
              <input
                type="date"
                value={formData.date || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("event.startTime")}
              </label>
              <TimeInput
                value={formData.time || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    time: value,
                  }))
                }
              />
            </div>
          </div>

          {/* Guest limit */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("event.guestCount")}
            </label>
            <input
              type="number"
              value={formData.guestLimit || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  guestLimit: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="150"
              className="input"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("event.plannedBudget")} ({currencyName})
            </label>
            <input
              type="number"
              value={formData.totalBudget || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  totalBudget: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="3000000"
              className="input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("event.budgetHint")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <Link href="/dashboard" className="btn-outline btn-md">
            {t("common.cancel")}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-md flex-1"
          >
            {isLoading ? t("event.creating") : t("event.createWeddingButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
