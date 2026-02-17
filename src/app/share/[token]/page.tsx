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
  LayoutGrid,
  Gift,
  Check,
  Phone,
  UserX,
} from "lucide-react";
import { shares } from "@/lib/api";
import {
  SharedEventData,
  ShareCheckResponse,
  ProgramItem,
  Guest,
  Expense,
  ChecklistItem,
  SeatingTable,
  Gift as GiftType,
} from "@/lib/types";
import { cn, formatCurrency, formatDate, eventTypeLabels } from "@/lib/utils";
import { ProgressBar } from "@/components/ui";

// Expense category labels
const expenseCategoryLabels: Record<string, string> = {
  venue: "Площадка",
  catering: "Кейтеринг",
  decoration: "Декор",
  photo: "Фото",
  video: "Видео",
  music: "Музыка",
  attire: "Наряды",
  transport: "Транспорт",
  invitation: "Приглашения",
  gift: "Подарки",
  beauty: "Красота",
  other: "Другое",
};

// Checklist category labels
const checklistCategoryLabels: Record<string, string> = {
  venue: "Площадка",
  attire: "Наряды",
  decor: "Декор",
  food: "Питание",
  entertainment: "Развлечения",
  documents: "Документы",
  other: "Другое",
};

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
    return <LoadingState />;
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

  const {
    event,
    widgets,
    accessLevel,
    guestStats,
    guests,
    budgetSummary,
    expenses,
    checklistStats,
    checklist,
    program,
    seatingStats,
    tables,
    giftStats,
    gifts,
  } = data;
  const eventLabel = eventTypeLabels[event.type]?.ru || event.type;
  const programItems = program || [];
  const guestList = guests || [];
  const expenseList = expenses || [];
  const checklistItems = checklist || [];
  const tableList = tables || [];
  const giftList = gifts || [];

  const hasWidget = (widget: string) =>
    widgets?.includes(widget as (typeof widgets)[number]) ?? false;

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
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hasWidget("guests") && guestStats && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {guestStats.accepted}/{guestStats.total}
                  </div>
                  <div className="text-sm text-muted-foreground">придут</div>
                </div>
              </div>
            </div>
          )}

          {hasWidget("budget") && budgetSummary && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      (budgetSummary.totalPaid / (budgetSummary.totalPlanned || 1)) * 100
                    )}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">оплачено</div>
                </div>
              </div>
            </div>
          )}

          {hasWidget("checklist") && checklistStats && (
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
          )}

          {hasWidget("seating") && seatingStats && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {seatingStats.seatedGuests}/{seatingStats.totalCapacity}
                  </div>
                  <div className="text-sm text-muted-foreground">рассажено</div>
                </div>
              </div>
            </div>
          )}

          {hasWidget("gifts") && giftStats && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(giftStats.totalCash)}</div>
                  <div className="text-sm text-muted-foreground">подарков</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guests Detail */}
        {hasWidget("guests") && guestList.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Гости</h2>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600">{guestStats?.accepted || 0} придут</span>
                <span className="text-amber-600">{guestStats?.pending || 0} ожидают</span>
                <span className="text-red-600">{guestStats?.declined || 0} отказ</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Имя</th>
                    <th className="text-left py-2 font-medium">Статус</th>
                    <th className="text-left py-2 font-medium">Группа</th>
                    <th className="text-left py-2 font-medium">+</th>
                    <th className="text-left py-2 font-medium">Стол</th>
                  </tr>
                </thead>
                <tbody>
                  {guestList.map((guest) => (
                    <GuestRow key={guest.id} guest={guest} tables={tableList} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Budget Detail */}
        {hasWidget("budget") && expenseList.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Бюджет</h2>
              </div>
              {budgetSummary && (
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(budgetSummary.totalPaid)} из {formatCurrency(budgetSummary.totalPlanned)}
                </div>
              )}
            </div>
            {budgetSummary && (
              <div className="mb-4">
                <ProgressBar
                  value={budgetSummary.totalPaid}
                  max={budgetSummary.totalPlanned || 1}
                  color="success"
                />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Категория</th>
                    <th className="text-left py-2 font-medium">Название</th>
                    <th className="text-right py-2 font-medium">План</th>
                    <th className="text-right py-2 font-medium">Факт</th>
                    <th className="text-right py-2 font-medium">Оплачено</th>
                    <th className="text-left py-2 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseList.map((expense) => (
                    <ExpenseRow key={expense.id} expense={expense} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Checklist Detail */}
        {hasWidget("checklist") && checklistItems.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Чек-лист</h2>
              </div>
              {checklistStats && (
                <div className="text-sm text-muted-foreground">
                  {checklistStats.completed} из {checklistStats.total} выполнено
                </div>
              )}
            </div>
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Program */}
        {hasWidget("program") && programItems.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Программа</h2>
            </div>
            <div className="space-y-0">
              {programItems.map((item) => (
                <ProgramItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Seating Layout */}
        {hasWidget("seating") && tableList.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Рассадка</h2>
              </div>
              {seatingStats && (
                <div className="text-sm text-muted-foreground">
                  {seatingStats.seatedGuests} из {seatingStats.totalCapacity} мест занято
                </div>
              )}
            </div>
            <SeatingCanvas tables={tableList} guests={guestList} />
          </div>
        )}

        {/* Gifts List */}
        {hasWidget("gifts") && giftList.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-600" />
                <h2 className="text-lg font-semibold">Подарки</h2>
              </div>
              {giftStats && (
                <div className="text-sm text-muted-foreground">
                  Всего: {formatCurrency(giftStats.totalCash)} + {giftStats.totalItems} предметов
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">От кого</th>
                    <th className="text-left py-2 font-medium">Тип</th>
                    <th className="text-right py-2 font-medium">Сумма</th>
                    <th className="text-left py-2 font-medium">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {giftList.map((gift) => (
                    <GiftRow key={gift.id} gift={gift} />
                  ))}
                </tbody>
              </table>
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

// Guest Row Component
function GuestRow({ guest, tables }: { guest: Guest; tables: SeatingTable[] }) {
  const table = tables.find((t) => t.id === guest.tableId);
  const tableName = table
    ? table.name
      ? `Стол ${table.number}: ${table.name}`
      : `Стол ${table.number}`
    : "-";

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{guest.name}</span>
          {guest.phone && (
            <Phone className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </td>
      <td className="py-2">
        {guest.rsvpStatus === "accepted" && (
          <span className="badge-success text-xs flex items-center gap-1 w-fit">
            <UserCheck className="w-3 h-3" />
            Придёт
          </span>
        )}
        {guest.rsvpStatus === "declined" && (
          <span className="badge-danger text-xs flex items-center gap-1 w-fit">
            <UserX className="w-3 h-3" />
            Отказ
          </span>
        )}
        {guest.rsvpStatus === "pending" && (
          <span className="badge-warning text-xs flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Ожидает
          </span>
        )}
      </td>
      <td className="py-2 text-muted-foreground">{guest.group || "-"}</td>
      <td className="py-2">{guest.plusCount > 0 ? `+${guest.plusCount}` : "-"}</td>
      <td className="py-2 text-muted-foreground">{tableName}</td>
    </tr>
  );
}

// Expense Row Component
function ExpenseRow({ expense }: { expense: Expense }) {
  const statusColors: Record<string, string> = {
    planned: "badge-default",
    booked: "badge-warning",
    paid: "badge-success",
  };
  const statusLabels: Record<string, string> = {
    planned: "Запланировано",
    booked: "Забронировано",
    paid: "Оплачено",
  };

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2 text-muted-foreground">
        {expenseCategoryLabels[expense.category] || expense.category}
      </td>
      <td className="py-2 font-medium">{expense.title}</td>
      <td className="py-2 text-right">{formatCurrency(expense.plannedAmount)}</td>
      <td className="py-2 text-right">{formatCurrency(expense.actualAmount)}</td>
      <td className="py-2 text-right text-emerald-600">{formatCurrency(expense.paidAmount)}</td>
      <td className="py-2">
        <span className={cn("text-xs", statusColors[expense.status])}>
          {statusLabels[expense.status] || expense.status}
        </span>
      </td>
    </tr>
  );
}

// Checklist Item Row Component
function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-lg",
        item.isCompleted ? "bg-emerald-50" : "bg-white border border-border"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded flex items-center justify-center shrink-0",
          item.isCompleted ? "bg-emerald-500 text-white" : "border border-border"
        )}
      >
        {item.isCompleted && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm", item.isCompleted && "line-through text-muted-foreground")}>
          {item.title}
        </span>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {checklistCategoryLabels[item.category] || item.category}
      </span>
      {item.dueDate && (
        <span className="text-xs text-muted-foreground shrink-0">{formatDate(item.dueDate)}</span>
      )}
    </div>
  );
}

// Program Item Card
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

// Gift Row Component
function GiftRow({ gift }: { gift: GiftType }) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2 font-medium">{gift.guestName}</td>
      <td className="py-2">
        {gift.type === "money" ? (
          <span className="badge-success text-xs">Деньги</span>
        ) : (
          <span className="badge-info text-xs">Предмет</span>
        )}
      </td>
      <td className="py-2 text-right">
        {gift.type === "money" ? formatCurrency(gift.amount) : "-"}
      </td>
      <td className="py-2 text-muted-foreground">{gift.description || "-"}</td>
    </tr>
  );
}

// Seating Canvas Component
function SeatingCanvas({
  tables,
  guests,
}: {
  tables: SeatingTable[];
  guests: Guest[];
}) {
  // Calculate canvas bounds
  const padding = 50;
  let maxX = 800;
  let maxY = 600;

  tables.forEach((t) => {
    maxX = Math.max(maxX, t.positionX + t.width + padding);
    maxY = Math.max(maxY, t.positionY + t.height + padding);
  });

  const formatTableName = (table: SeatingTable) => {
    if (table.shape === "scene") return table.name || "Сцена";
    return table.name ? `${table.number}: ${table.name}` : `${table.number}`;
  };

  const getGuestsForTable = (tableId: string) => {
    return guests.filter((g) => g.tableId === tableId);
  };

  return (
    <div className="overflow-auto border border-border rounded-lg bg-secondary/30">
      <div
        className="relative"
        style={{ width: maxX, height: maxY, minWidth: "100%" }}
      >
        {tables.map((table) => {
          const tableGuests = getGuestsForTable(table.id);
          const isScene = table.shape === "scene";

          return (
            <div
              key={table.id}
              className={cn(
                "absolute flex flex-col items-center justify-center border-2 text-center",
                isScene
                  ? "bg-amber-100 border-amber-400"
                  : "bg-white border-primary/30"
              )}
              style={{
                left: table.positionX,
                top: table.positionY,
                width: table.width,
                height: table.height,
                borderRadius:
                  table.shape === "round"
                    ? "50%"
                    : table.shape === "oval"
                    ? "50%"
                    : "8px",
                transform: `rotate(${table.rotation || 0}deg)`,
              }}
            >
              <span className="text-xs font-medium">{formatTableName(table)}</span>
              {!isScene && (
                <span className="text-xs text-muted-foreground">
                  {tableGuests.length}/{table.capacity}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
