"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Users,
  UserCheck,
  Clock,
  Wallet,
  CheckSquare,
  Calendar,
  MapPin,
  Lock,
  Eye,
  Edit3,
} from "lucide-react";
import { shares } from "@/lib/api";
import { SharedEventData, ShareCheckResponse, ProgramItem } from "@/lib/types";
import { cn, formatCurrency, formatDate, eventTypeLabels } from "@/lib/utils";
import { ProgressBar } from "@/components/ui";

export default function SharedDashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SharedDashboardContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

function SharedDashboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const pinFromUrl = searchParams.get("pin");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkData, setCheckData] = useState<ShareCheckResponse | null>(null);
  const [data, setData] = useState<SharedEventData | null>(null);
  const [pin, setPin] = useState(pinFromUrl || "");
  const [showPinForm, setShowPinForm] = useState(false);

  useEffect(() => {
    checkLink();
  }, [token]);

  async function checkLink() {
    try {
      const check = await shares.check(token);
      setCheckData(check);

      if (check.requiresPin && !pinFromUrl) {
        setShowPinForm(true);
        setIsLoading(false);
      } else {
        loadData(pinFromUrl || "");
      }
    } catch {
      setError("Ссылка не найдена или истекла");
      setIsLoading(false);
    }
  }

  async function loadData(pinCode: string) {
    try {
      const result = await shares.getData(token, pinCode);
      setData(result);
      setShowPinForm(false);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("PIN")) {
        setShowPinForm(true);
        setError("Неверный PIN-код");
      } else {
        setError("Не удалось загрузить данные");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      setIsLoading(true);
      setError(null);
      loadData(pin);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !showPinForm) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Ссылка недоступна</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (showPinForm) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <div className="card p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Введите PIN-код</h1>
            {checkData?.label && (
              <p className="text-muted-foreground mt-1">{checkData.label}</p>
            )}
          </div>
          <form onSubmit={handlePinSubmit}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="input text-center text-2xl tracking-widest mb-4"
              placeholder="____"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="btn-primary btn-md w-full"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { event, guestStats, budgetSummary, checklistStats, program, accessLevel } = data;
  const eventLabel = eventTypeLabels[event.type]?.ru || event.type;
  const programItems = program || [];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span className="badge-info">{eventLabel}</span>
                {accessLevel === "editor" ? (
                  <span className="badge-success flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    Редактор
                  </span>
                ) : (
                  <span className="badge-default flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Просмотр
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold">{event.title}</h1>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {event.date && (
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.date)}
                  {event.time && `, ${event.time}`}
                </div>
              )}
              {event.venue?.name && (
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <MapPin className="w-4 h-4" />
                  {event.venue.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Guests */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{guestStats.total}</div>
                <div className="text-sm text-muted-foreground">гостей</div>
              </div>
            </div>
          </div>

          {/* Confirmed */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{guestStats.accepted}</div>
                <div className="text-sm text-muted-foreground">придут</div>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{guestStats.pending}</div>
                <div className="text-sm text-muted-foreground">ожидают</div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{checklistStats.percent}%</div>
                <div className="text-sm text-muted-foreground">готово</div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget (Editor only) */}
        {budgetSummary && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">Бюджет</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Запланировано</div>
                <div className="text-xl font-bold">{formatCurrency(budgetSummary.totalPlanned)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Фактически</div>
                <div className="text-xl font-bold">{formatCurrency(budgetSummary.totalActual)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Оплачено</div>
                <div className="text-xl font-bold text-emerald-600">{formatCurrency(budgetSummary.totalPaid)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Осталось</div>
                <div className={cn(
                  "text-xl font-bold",
                  budgetSummary.remaining < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {formatCurrency(budgetSummary.remaining)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar
                value={budgetSummary.totalPaid}
                max={budgetSummary.totalPlanned || 1}
                color="success"
              />
            </div>
          </div>
        )}

        {/* Guest Stats Detail */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Гости</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{guestStats.accepted}</div>
              <div className="text-sm text-muted-foreground">подтвердили</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{guestStats.pending}</div>
              <div className="text-sm text-muted-foreground">ожидают</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{guestStats.declined}</div>
              <div className="text-sm text-muted-foreground">отказались</div>
            </div>
          </div>
          {guestStats.total > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Отклик</span>
                <span className="font-medium">
                  {Math.round(((guestStats.accepted + guestStats.declined) / guestStats.total) * 100)}%
                </span>
              </div>
              <ProgressBar
                value={guestStats.accepted + guestStats.declined}
                max={guestStats.total}
                color="primary"
              />
            </div>
          )}
          {guestStats.plusOnes > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                +{guestStats.plusOnes} дополнительных гостей
              </span>
            </div>
          )}
        </div>

        {/* Checklist Progress */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Подготовка</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar
                value={checklistStats.completed}
                max={checklistStats.total || 1}
                color="primary"
                size="lg"
              />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{checklistStats.completed}/{checklistStats.total}</div>
              <div className="text-sm text-muted-foreground">задач выполнено</div>
            </div>
          </div>
        </div>

        {/* Program */}
        {programItems.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Программа</h2>
            </div>
            <div className="space-y-3">
              {programItems.map((item) => (
                <ProgramItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>Создано с помощью Toilab</p>
        </div>
      </footer>
    </div>
  );
}

function ProgramItemCard({ item }: { item: ProgramItem }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border last:border-0">
      <div className="w-16 text-center shrink-0">
        <span className="font-mono text-lg font-semibold text-primary">{item.startTime}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{item.title}</div>
        {item.description && (
          <div className="text-sm text-muted-foreground">{item.description}</div>
        )}
      </div>
      {item.responsible && (
        <div className="text-sm text-muted-foreground shrink-0">{item.responsible}</div>
      )}
      {item.duration > 0 && (
        <div className="text-sm text-muted-foreground shrink-0">{item.duration} мин</div>
      )}
    </div>
  );
}
