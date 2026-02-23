import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Country, CurrencyConfig } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency configurations by country
export const currencyConfigs: Record<Country, CurrencyConfig> = {
  kz: { code: "KZT", symbol: "₸", name: "Тенге" },
  ru: { code: "RUB", symbol: "₽", name: "Рубль" },
  kg: { code: "KGS", symbol: "сом", name: "Сом" },
  uz: { code: "UZS", symbol: "сум", name: "Сум" },
  other: { code: "USD", symbol: "$", name: "Доллар" },
};

// Check if country is Central Asian
export function isCentralAsian(country: Country | undefined): boolean {
  if (!country) return true; // Default to true for backward compatibility
  return ["kz", "kg", "uz"].includes(country);
}

// Get example names by country
export function getExampleNames(country: Country | undefined): { person1: string; person2: string } {
  if (isCentralAsian(country)) {
    return { person1: "Айдар", person2: "Дана" };
  }
  return { person1: "Иван", person2: "Мария" };
}

// Get default city by country
export function getDefaultCity(country: Country | undefined): string {
  const cities: Record<Country, string> = {
    kz: "Алматы",
    ru: "Москва",
    kg: "Бишкек",
    uz: "Ташкент",
    other: "",
  };
  return cities[country || "kz"];
}

export function formatCurrency(amount: number | string | undefined | null, country: Country = "kz"): string {
  // Конвертируем в число
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  // Проверяем на NaN/undefined/null
  if (amount === undefined || amount === null || isNaN(num)) {
    const config = currencyConfigs[country];
    return "0 " + config.symbol;
  }

  // Простое форматирование с разделителями тысяч
  const formatted = Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const config = currencyConfigs[country];
  return formatted + " " + config.symbol;
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

export function formatTableName(number: number, name?: string, isScene?: boolean): string {
  if (isScene) {
    return name || "Сцена";
  }
  if (name) {
    return `Стол ${number}: ${name}`;
  }
  return `Стол ${number}`;
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
  mc: { ru: "Ведущий", kz: "Жүргізуші", icon: "mic" },
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

// Calendar event type labels
export const calendarEventTypeLabels: Record<string, { ru: string; kz: string; icon: string; color: string }> = {
  meeting: { ru: "Встреча", kz: "Кездесу", icon: "Users", color: "blue" },
  deadline: { ru: "Дедлайн", kz: "Мерзім", icon: "AlertCircle", color: "red" },
  reminder: { ru: "Напоминание", kz: "Еске салу", icon: "Bell", color: "amber" },
  other: { ru: "Другое", kz: "Басқа", icon: "Calendar", color: "slate" },
};

// Vendor type labels
export const vendorTypeLabels: Record<string, { ru: string; kz: string; icon: string }> = {
  photographer: { ru: "Фотограф", kz: "Фотограф", icon: "Camera" },
  videographer: { ru: "Видеограф", kz: "Видеограф", icon: "Video" },
  mc: { ru: "Ведущий", kz: "Жүргізуші", icon: "Mic" },
  dj: { ru: "DJ", kz: "DJ", icon: "Music" },
  stylist: { ru: "Стилист", kz: "Стилист", icon: "Sparkles" },
  florist: { ru: "Флорист", kz: "Гүлші", icon: "Flower2" },
  restaurant: { ru: "Ресторан", kz: "Мейрамхана", icon: "UtensilsCrossed" },
  band: { ru: "Музыканты", kz: "Музыканттар", icon: "Guitar" },
  decor: { ru: "Декоратор", kz: "Декоратор", icon: "Palette" },
  transport: { ru: "Транспорт", kz: "Көлік", icon: "Car" },
  other: { ru: "Другое", kz: "Басқа", icon: "MoreHorizontal" },
};

// Vendor status labels
export const vendorStatusLabels: Record<string, { ru: string; kz: string; color: string }> = {
  contacted: { ru: "На связи", kz: "Байланыста", color: "gray" },
  booked: { ru: "Забронирован", kz: "Брондалған", color: "blue" },
  deposit_paid: { ru: "Задаток оплачен", kz: "Алдын ала төлем", color: "amber" },
  paid: { ru: "Оплачен", kz: "Төленді", color: "green" },
  cancelled: { ru: "Отменён", kz: "Болдырылмады", color: "red" },
};
