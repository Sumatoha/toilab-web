"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { events } from "@/lib/api";
import { TimeInput } from "@/components/ui";
import { CreateEventRequest } from "@/lib/types";
import toast from "react-hot-toast";

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEventRequest>({
    type: "wedding",
    title: "",
    totalBudget: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Введите название свадьбы");
      return;
    }

    setIsLoading(true);
    try {
      const event = await events.create(formData);
      toast.success("Свадьба создана!");
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось создать свадьбу");
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
          Назад
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Новая свадьба</h1>
            <p className="text-muted-foreground">Заполните основную информацию</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Свадьба Айдара и Даны"
              className="input"
              required
              autoFocus
            />
          </div>

          {/* Couple names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Имя жениха
              </label>
              <input
                type="text"
                value={formData.person1 || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, person1: e.target.value }))
                }
                placeholder="Айдар"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Имя невесты
              </label>
              <input
                type="text"
                value={formData.person2 || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, person2: e.target.value }))
                }
                placeholder="Дана"
                className="input"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Дата свадьбы
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
                Время начала
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
              Количество гостей
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
              Планируемый бюджет (тенге)
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
              Можно изменить позже
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <Link href="/dashboard" className="btn-outline btn-md">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-md flex-1"
          >
            {isLoading ? "Создание..." : "Создать свадьбу"}
          </button>
        </div>
      </form>
    </div>
  );
}
