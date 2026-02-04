"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Baby, Cake, PartyPopper, Building2, Gift } from "lucide-react";
import { events } from "@/lib/api";
import { EventType, CreateEventRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const eventTypes: {
  type: EventType;
  label: string;
  labelKz: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: "wedding",
    label: "Свадьба",
    labelKz: "Той",
    description: "Торжественная церемония бракосочетания",
    icon: Heart,
  },
  {
    type: "sundet",
    label: "Сүндет той",
    labelKz: "Сүндет той",
    description: "Традиционное казахское торжество",
    icon: Baby,
  },
  {
    type: "tusau",
    label: "Тұсау кесу",
    labelKz: "Тұсау кесу",
    description: "Первые шаги малыша",
    icon: Gift,
  },
  {
    type: "birthday",
    label: "День рождения",
    labelKz: "Туған күн",
    description: "Празднование дня рождения",
    icon: Cake,
  },
  {
    type: "anniversary",
    label: "Юбилей",
    labelKz: "Мерейтой",
    description: "Юбилей или годовщина",
    icon: PartyPopper,
  },
  {
    type: "corporate",
    label: "Корпоратив",
    labelKz: "Корпоратив",
    description: "Корпоративное мероприятие",
    icon: Building2,
  },
];

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEventRequest>({
    type: "wedding",
    title: "",
    totalBudget: 0,
  });

  const selectedType = eventTypes.find((t) => t.type === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Введите название мероприятия");
      return;
    }

    setIsLoading(true);
    try {
      const event = await events.create(formData);
      toast.success("Мероприятие создано!");
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Не удалось создать мероприятие");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
        <h1 className="text-2xl font-display font-bold">Новое мероприятие</h1>
        <p className="text-muted-foreground">
          {step === 1
            ? "Выберите тип мероприятия"
            : "Заполните основную информацию"}
        </p>
      </div>

      {/* Step 1: Select event type */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {eventTypes.map((type) => (
              <button
                key={type.type}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, type: type.type }));
                  setStep(2);
                }}
                className={cn(
                  "card text-left hover:border-primary/50 transition-colors",
                  formData.type === type.type && "border-primary"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Event details */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="card">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            {selectedType && (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <selectedType.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedType.label}</h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-primary hover:underline"
                  >
                    Изменить тип
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Название мероприятия *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Например: Свадьба Айдара и Даны"
                className="input"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Дата мероприятия
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
                <input
                  type="time"
                  value={formData.time || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  className="input"
                />
              </div>
            </div>

            {/* Guest limit */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ожидаемое количество гостей
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
                placeholder="100"
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
                placeholder="1000000"
                className="input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Можно изменить позже
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-outline btn-md"
            >
              Назад
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-md flex-1"
            >
              {isLoading ? "Создание..." : "Создать мероприятие"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
