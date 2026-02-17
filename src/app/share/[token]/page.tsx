"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
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

// Category labels
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
    <Suspense fallback={<LoadingSkeleton />}>
      <SharedDashboardContent />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="h-16 bg-white border-b animate-pulse" />
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />
        ))}
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

  // Collapsible sections state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    guests: true,
    budget: true,
    checklist: true,
    program: true,
    seating: true,
    gifts: true,
  });

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  if (isLoading) return <LoadingSkeleton />;

  if (error && !showPinForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ссылка недоступна</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (showPinForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Введите PIN-код</h1>
            {checkData?.label && (
              <p className="text-slate-500 mt-2">{checkData.label}</p>
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
              className="w-full h-16 text-center text-3xl font-mono tracking-[0.5em] border-2 border-slate-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              placeholder="• • • •"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm text-center mt-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full mt-6 h-14 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
  const hasWidget = (w: string) => widgets?.includes(w as (typeof widgets)[number]) ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {eventLabel}
                </span>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                  accessLevel === "editor"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                )}>
                  {accessLevel === "editor" ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {accessLevel === "editor" ? "Редактор" : "Просмотр"}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{event.title}</h1>
            </div>
            <div className="text-right text-xs sm:text-sm text-slate-500 shrink-0">
              {event.date && (
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(event.date)}</span>
                  {event.time && <span className="hidden sm:inline">, {event.time}</span>}
                </div>
              )}
              {event.venue?.name && (
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{event.venue.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {hasWidget("guests") && guestStats && (
            <StatCard
              icon={Users}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              value={`${guestStats.accepted}/${guestStats.total}`}
              label="придут"
            />
          )}
          {hasWidget("budget") && budgetSummary && (
            <StatCard
              icon={Wallet}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              value={`${Math.round((budgetSummary.totalPaid / (budgetSummary.totalPlanned || 1)) * 100)}%`}
              label="оплачено"
            />
          )}
          {hasWidget("checklist") && checklistStats && (
            <StatCard
              icon={CheckSquare}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              value={`${checklistStats.percent}%`}
              label="готово"
            />
          )}
          {hasWidget("seating") && seatingStats && (
            <StatCard
              icon={LayoutGrid}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
              value={`${seatingStats.seatedGuests}/${seatingStats.totalCapacity}`}
              label="рассажено"
            />
          )}
          {hasWidget("gifts") && giftStats && (
            <StatCard
              icon={Gift}
              iconBg="bg-pink-100"
              iconColor="text-pink-600"
              value={formatCurrency(giftStats.totalCash)}
              label="подарков"
              small
            />
          )}
        </div>

        {/* Guests */}
        {hasWidget("guests") && guests && guests.length > 0 && (
          <CollapsibleSection
            title="Гости"
            icon={Users}
            iconColor="text-indigo-600"
            badge={`${guestStats?.accepted || 0} из ${guestStats?.total || 0}`}
            expanded={expanded.guests}
            onToggle={() => toggleSection("guests")}
          >
            <GuestList guests={guests} tables={tables || []} />
          </CollapsibleSection>
        )}

        {/* Budget */}
        {hasWidget("budget") && expenses && expenses.length > 0 && (
          <CollapsibleSection
            title="Бюджет"
            icon={Wallet}
            iconColor="text-emerald-600"
            badge={budgetSummary ? formatCurrency(budgetSummary.totalPaid) : undefined}
            expanded={expanded.budget}
            onToggle={() => toggleSection("budget")}
          >
            <ExpenseList expenses={expenses} summary={budgetSummary} />
          </CollapsibleSection>
        )}

        {/* Checklist */}
        {hasWidget("checklist") && checklist && checklist.length > 0 && (
          <CollapsibleSection
            title="Чек-лист"
            icon={CheckSquare}
            iconColor="text-violet-600"
            badge={checklistStats ? `${checklistStats.completed}/${checklistStats.total}` : undefined}
            expanded={expanded.checklist}
            onToggle={() => toggleSection("checklist")}
          >
            <ChecklistList items={checklist} />
          </CollapsibleSection>
        )}

        {/* Program */}
        {hasWidget("program") && program && program.length > 0 && (
          <CollapsibleSection
            title="Программа"
            icon={Clock}
            iconColor="text-amber-600"
            badge={`${program.length} пунктов`}
            expanded={expanded.program}
            onToggle={() => toggleSection("program")}
          >
            <ProgramList items={program} />
          </CollapsibleSection>
        )}

        {/* Seating */}
        {hasWidget("seating") && tables && tables.length > 0 && (
          <CollapsibleSection
            title="Рассадка"
            icon={LayoutGrid}
            iconColor="text-sky-600"
            badge={seatingStats ? `${seatingStats.totalTables} столов` : undefined}
            expanded={expanded.seating}
            onToggle={() => toggleSection("seating")}
          >
            <SeatingView tables={tables} guests={guests || []} />
          </CollapsibleSection>
        )}

        {/* Gifts */}
        {hasWidget("gifts") && gifts && gifts.length > 0 && (
          <CollapsibleSection
            title="Подарки"
            icon={Gift}
            iconColor="text-pink-600"
            badge={giftStats ? `${giftStats.totalGifts} шт` : undefined}
            expanded={expanded.gifts}
            onToggle={() => toggleSection("gifts")}
          >
            <GiftList gifts={gifts} />
          </CollapsibleSection>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/50 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-slate-400">
          Toilab
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  small,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", iconColor)} />
        </div>
        <div className="min-w-0">
          <div className={cn("font-bold text-slate-900 truncate", small ? "text-lg sm:text-xl" : "text-xl sm:text-2xl")}>
            {value}
          </div>
          <div className="text-xs sm:text-sm text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Collapsible Section
function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  badge,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5", iconColor)} />
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h2>
          {badge && (
            <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {expanded && <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>}
    </div>
  );
}

// Guest List
function GuestList({ guests, tables }: { guests: Guest[]; tables: SeatingTable[] }) {
  const getTableName = (tableId?: string) => {
    if (!tableId) return null;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return null;
    return table.name ? `${table.number}: ${table.name}` : `Стол ${table.number}`;
  };

  return (
    <div className="space-y-2">
      {guests.map((guest) => (
        <div
          key={guest.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-colors",
            guest.rsvpStatus === "accepted" && "bg-emerald-50",
            guest.rsvpStatus === "declined" && "bg-red-50",
            guest.rsvpStatus === "pending" && "bg-slate-50"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            guest.rsvpStatus === "accepted" && "bg-emerald-500",
            guest.rsvpStatus === "declined" && "bg-red-400",
            guest.rsvpStatus === "pending" && "bg-slate-300"
          )}>
            {guest.rsvpStatus === "accepted" && <UserCheck className="w-4 h-4 text-white" />}
            {guest.rsvpStatus === "declined" && <UserX className="w-4 h-4 text-white" />}
            {guest.rsvpStatus === "pending" && <Clock className="w-4 h-4 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 truncate">{guest.name}</span>
              {guest.plusCount > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                  +{guest.plusCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              {guest.group && <span>{guest.group}</span>}
              {guest.group && getTableName(guest.tableId) && <span>•</span>}
              {getTableName(guest.tableId) && <span>{getTableName(guest.tableId)}</span>}
            </div>
          </div>
          {guest.phone && <Phone className="w-4 h-4 text-slate-400 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// Expense List
function ExpenseList({ expenses, summary }: { expenses: Expense[]; summary?: { totalPlanned: number; totalActual: number; totalPaid: number; remaining: number } }) {
  // Group by category
  const byCategory = useMemo(() => {
    const grouped: Record<string, { expenses: Expense[]; total: number; paid: number }> = {};
    expenses.forEach((exp) => {
      if (!grouped[exp.category]) {
        grouped[exp.category] = { expenses: [], total: 0, paid: 0 };
      }
      grouped[exp.category].expenses.push(exp);
      grouped[exp.category].total += exp.actualAmount || exp.plannedAmount;
      grouped[exp.category].paid += exp.paidAmount;
    });
    return grouped;
  }, [expenses]);

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl">
          <div>
            <div className="text-xs text-slate-500">План</div>
            <div className="font-semibold text-slate-900">{formatCurrency(summary.totalPlanned)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Факт</div>
            <div className="font-semibold text-slate-900">{formatCurrency(summary.totalActual)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Оплачено</div>
            <div className="font-semibold text-emerald-600">{formatCurrency(summary.totalPaid)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Осталось</div>
            <div className={cn("font-semibold", summary.remaining < 0 ? "text-red-600" : "text-slate-900")}>
              {formatCurrency(Math.abs(summary.remaining))}
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Object.entries(byCategory).map(([category, { expenses: catExp, total, paid }]) => (
          <div key={category} className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-slate-50">
              <span className="font-medium text-slate-700">{expenseCategoryLabels[category] || category}</span>
              <div className="text-sm">
                <span className="text-emerald-600 font-medium">{formatCurrency(paid)}</span>
                <span className="text-slate-400"> / {formatCurrency(total)}</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {catExp.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-slate-700">{exp.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      exp.status === "paid" && "bg-emerald-100 text-emerald-700",
                      exp.status === "booked" && "bg-amber-100 text-amber-700",
                      exp.status === "planned" && "bg-slate-100 text-slate-600"
                    )}>
                      {exp.status === "paid" ? "Оплачено" : exp.status === "booked" ? "Забронировано" : "План"}
                    </span>
                    <span className="font-medium text-slate-900">{formatCurrency(exp.actualAmount || exp.plannedAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Checklist
function ChecklistList({ items }: { items: ChecklistItem[] }) {
  const completed = items.filter((i) => i.isCompleted);
  const pending = items.filter((i) => !i.isCompleted);

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Осталось ({pending.length})</div>
          {pending.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
      )}
      {completed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Выполнено ({completed.length})</div>
          {completed.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl",
      item.isCompleted ? "bg-emerald-50" : "bg-white border border-slate-200"
    )}>
      <div className={cn(
        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
        item.isCompleted ? "bg-emerald-500" : "border-2 border-slate-300"
      )}>
        {item.isCompleted && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm", item.isCompleted && "line-through text-slate-500")}>
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
        )}
      </div>
      <span className="text-xs text-slate-400 shrink-0">
        {checklistCategoryLabels[item.category] || item.category}
      </span>
    </div>
  );
}

// Program
function ProgramList({ items }: { items: ProgramItem[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative flex gap-4 pl-4">
            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" style={{ top: "0.5rem" }} />
            <div className="flex-1 pb-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-bold text-primary font-mono">{item.startTime}</span>
                {item.duration > 0 && (
                  <span className="text-xs text-slate-400">{item.duration} мин</span>
                )}
              </div>
              <div className="font-medium text-slate-900 mt-1">{item.title}</div>
              {item.description && (
                <div className="text-sm text-slate-500 mt-0.5">{item.description}</div>
              )}
              {item.responsible && (
                <div className="text-xs text-slate-400 mt-1">Ответственный: {item.responsible}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Seating View
function SeatingView({ tables, guests }: { tables: SeatingTable[]; guests: Guest[] }) {
  const padding = 40;
  const bounds = useMemo(() => {
    let maxX = 600, maxY = 400;
    tables.forEach((t) => {
      maxX = Math.max(maxX, t.positionX + t.width + padding);
      maxY = Math.max(maxY, t.positionY + t.height + padding);
    });
    return { width: maxX, height: maxY };
  }, [tables]);

  const getGuestCount = (tableId: string) => guests.filter((g) => g.tableId === tableId).length;

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="relative" style={{ width: bounds.width, height: bounds.height, minWidth: "100%" }}>
        {tables.map((table) => {
          const isScene = table.shape === "scene";
          const guestCount = getGuestCount(table.id);
          const isFull = guestCount >= table.capacity;

          return (
            <div
              key={table.id}
              className={cn(
                "absolute flex flex-col items-center justify-center border-2 shadow-sm",
                isScene
                  ? "bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400"
                  : isFull
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-400"
                    : "bg-white border-slate-300"
              )}
              style={{
                left: table.positionX,
                top: table.positionY,
                width: table.width,
                height: table.height,
                borderRadius: table.shape === "round" || table.shape === "oval" ? "50%" : "12px",
                transform: `rotate(${table.rotation || 0}deg)`,
              }}
            >
              <span className="text-xs font-bold text-slate-700">
                {isScene ? (table.name || "Сцена") : table.name || table.number}
              </span>
              {!isScene && (
                <span className="text-[10px] text-slate-500">
                  {guestCount}/{table.capacity}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Gift List
function GiftList({ gifts }: { gifts: GiftType[] }) {
  return (
    <div className="space-y-2">
      {gifts.map((gift) => (
        <div key={gift.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            gift.type === "money" ? "bg-emerald-100" : "bg-pink-100"
          )}>
            {gift.type === "money" ? (
              <Wallet className="w-5 h-5 text-emerald-600" />
            ) : (
              <Gift className="w-5 h-5 text-pink-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">{gift.guestName}</div>
            {gift.description && (
              <div className="text-xs text-slate-500 truncate">{gift.description}</div>
            )}
          </div>
          {gift.type === "money" && (
            <span className="font-bold text-emerald-600 shrink-0">{formatCurrency(gift.amount)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
