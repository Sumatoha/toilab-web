import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
  // Конвертируем в число
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  // Проверяем на NaN/undefined/null
  if (amount === undefined || amount === null || isNaN(num)) {
    return "0 ₸";
  }

  // Простое форматирование с разделителями тысяч
  const formatted = Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return formatted + " ₸";
}

export function formatDate(dateString: string | undefined, locale = "ru-KZ"): string {
  if (!dateString) return "Дата не указана";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Дата не указана";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(dateString: string | undefined, locale = "ru-KZ"): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatTime(timeString: string | undefined): string {
  if (!timeString) return "";
  return timeString;
}

export function getDaysUntil(dateString: string | undefined): number | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;

  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

export function formatGuestCount(count: number): string {
  return `${count} ${pluralize(count, "гость", "гостя", "гостей")}`;
}

export function formatDaysCount(count: number): string {
  return `${count} ${pluralize(count, "день", "дня", "дней")}`;
}

// Event type labels
export const eventTypeLabels: Record<string, { ru: string; kz: string }> = {
  wedding: { ru: "Свадьба", kz: "Той" },
  sundet: { ru: "Сүндет той", kz: "Сүндет той" },
  tusau: { ru: "Тұсау кесу", kz: "Тұсау кесу" },
  birthday: { ru: "День рождения", kz: "Туған күн" },
  anniversary: { ru: "Юбилей", kz: "Мерейтой" },
  corporate: { ru: "Корпоратив", kz: "Корпоратив" },
};

// RSVP status labels
export const rsvpStatusLabels: Record<string, { ru: string; kz: string; color: string }> = {
  pending: { ru: "Ожидает", kz: "Күтуде", color: "gray" },
  accepted: { ru: "Придёт", kz: "Келеді", color: "green" },
  declined: { ru: "Не придёт", kz: "Келмейді", color: "red" },
};

// Expense category labels
export const expenseCategoryLabels: Record<string, { ru: string; kz: string; icon: string }> = {
  venue: { ru: "Зал", kz: "Зал", icon: "building" },
  catering: { ru: "Кейтеринг", kz: "Кейтеринг", icon: "utensils" },
  decoration: { ru: "Декор", kz: "Декор", icon: "flower" },
  photo: { ru: "Фото", kz: "Фото", icon: "camera" },
  video: { ru: "Видео", kz: "Бейне", icon: "video" },
  music: { ru: "Музыка", kz: "Музыка", icon: "music" },
  attire: { ru: "Наряды", kz: "Киім", icon: "shirt" },
  transport: { ru: "Транспорт", kz: "Көлік", icon: "car" },
  invitation: { ru: "Приглашения", kz: "Шақыру", icon: "mail" },
  gift: { ru: "Подарки", kz: "Сыйлық", icon: "gift" },
  beauty: { ru: "Красота", kz: "Сұлулық", icon: "sparkles" },
  other: { ru: "Другое", kz: "Басқа", icon: "more-horizontal" },
};

// Checklist category labels
export const checklistCategoryLabels: Record<string, { ru: string; kz: string }> = {
  venue: { ru: "Место", kz: "Орын" },
  attire: { ru: "Наряды", kz: "Киім" },
  decor: { ru: "Декор", kz: "Декор" },
  food: { ru: "Еда", kz: "Тамақ" },
  entertainment: { ru: "Развлечения", kz: "Ойын-сауық" },
  documents: { ru: "Документы", kz: "Құжаттар" },
  other: { ru: "Другое", kz: "Басқа" },
};

// Gift type labels
export const giftTypeLabels: Record<string, { ru: string; kz: string }> = {
  money: { ru: "Деньги", kz: "Ақша" },
  item: { ru: "Подарок", kz: "Сыйлық" },
};
