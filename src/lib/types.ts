// Event types
export type EventType = "wedding" | "sundet" | "tusau" | "birthday" | "anniversary" | "corporate";
export type EventStatus = "draft" | "active" | "completed" | "archived";
export type RSVPStatus = "pending" | "accepted" | "declined";
export type ExpenseStatus = "planned" | "booked" | "paid";
export type VendorStatus = "contacted" | "booked" | "deposit_paid" | "paid" | "cancelled";
export type Plan = "free" | "standard" | "premium";

// User
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: Plan;
  createdAt: string;
}

// Venue
export interface Venue {
  name?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  twoGisId?: string;
}

// Event
export interface Event {
  id: string;
  userId: string;
  type: EventType;
  title: string;
  slug: string;
  date?: string;
  time?: string;
  venue: Venue;
  totalBudget: number;
  currency: string;
  guestLimit: number;
  coverImage?: string;
  invitation: InvitationConfig;
  status: EventStatus;
  person1?: string;
  person2?: string;
  greetingKz?: string;
  greetingRu?: string;
  hashtag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationConfig {
  templateId?: string;
  rsvpEnabled: boolean;
  config?: Record<string, string>;
  customHtml?: string;
  styleDescription?: string;
}

export interface EventStats {
  totalGuests: number;
  confirmedGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  totalPlusOnes: number;
  plannedBudget: number;
  actualBudget: number;
  paidAmount: number;
  checklistTotal: number;
  checklistDone: number;
}

// Guest
export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone?: string;
  email?: string;
  group?: string;
  plusCount: number;
  personalSlug: string;
  rsvpStatus: RSVPStatus;
  rsvpAt?: string;
  rsvpNote?: string;
  tableNumber?: string;
  notifiedAt?: string;
  createdAt: string;
}

export interface GuestStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  plusOnes: number;
  attending: number;
}

// Expense
export interface Expense {
  id: string;
  eventId: string;
  category: ExpenseCategory;
  title: string;
  description?: string;
  vendorId?: string;
  plannedAmount: number;
  actualAmount: number;
  paidAmount: number;
  status: ExpenseStatus;
  dueDate?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | "venue"
  | "catering"
  | "decoration"
  | "photo"
  | "video"
  | "music"
  | "attire"
  | "transport"
  | "invitation"
  | "gift"
  | "beauty"
  | "other";

export interface ExpenseCategoryInfo {
  key: ExpenseCategory;
  nameRu: string;
  nameKz: string;
  icon: string;
}

export interface BudgetSummary {
  totalPlanned: number;
  totalActual: number;
  totalPaid: number;
  byCategory: CategoryBudget[];
}

export interface CategoryBudget {
  category: ExpenseCategory;
  planned: number;
  actual: number;
  paid: number;
}

// Vendor
export interface Vendor {
  id: string;
  eventId: string;
  category: ExpenseCategory;
  name: string;
  phone?: string;
  instagram?: string;
  totalAmount: number;
  paidAmount: number;
  depositAmount: number;
  status: VendorStatus;
  note?: string;
  createdAt: string;
}

export interface VendorStatusInfo {
  key: VendorStatus;
  nameRu: string;
  nameKz: string;
  color: string;
}

export interface VendorSummary {
  totalVendors: number;
  totalCost: number;
  totalPaid: number;
  totalPending: number;
  byStatus: Record<VendorStatus, number>;
}

// Checklist
export interface ChecklistItem {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  category: ChecklistCategory;
  dueDate?: string;
  relativeDays: number;
  isCompleted: boolean;
  isDefault: boolean;
  order: number;
  createdAt: string;
}

export type ChecklistCategory =
  | "venue"
  | "attire"
  | "decor"
  | "food"
  | "entertainment"
  | "documents"
  | "other";

export interface ChecklistProgress {
  total: number;
  completed: number;
  percent: number;
}

// Template
export interface InvitationTemplate {
  id: string;
  slug: string;
  name: string;
  nameKz: string;
  previewUrl: string;
  htmlTemplate: string;
  cssVariables: CSSVariables;
  blocks: string[];
  isPremium: boolean;
  isAiGenerated: boolean;
}

export interface CSSVariables {
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontDisplay: string;
  fontBody: string;
}

export interface TemplatePreview {
  slug: string;
  name: string;
  nameKz: string;
  previewUrl: string;
  isPremium: boolean;
}

// Invitation Data (public)
export interface InvitationData {
  event: EventPublicData;
  guest?: GuestPublicData;
  template: TemplatePublicData;
}

export interface EventPublicData {
  type: EventType;
  title: string;
  person1: string;
  person2: string;
  date?: string;
  time?: string;
  venue: Venue;
  greetingKz: string;
  greetingRu: string;
  hashtag?: string;
  coverImage?: string;
  rsvpOpen: boolean;
}

export interface GuestPublicData {
  id: string;
  name: string;
  status: RSVPStatus;
  plusCount: number;
  note?: string;
}

export interface TemplatePublicData {
  slug: string;
  name: string;
  htmlTemplate?: string;
  cssVariables: CSSVariables;
  blocks: string[];
}

// API Request types
export interface CreateEventRequest {
  type: EventType;
  title: string;
  person1?: string;
  person2?: string;
  date?: string;
  time?: string;
  guestLimit?: number;
  totalBudget?: number;
}

export interface UpdateEventRequest {
  title?: string;
  person1?: string;
  person2?: string;
  date?: string;
  time?: string;
  venue?: Venue;
  totalBudget?: number;
  greetingKz?: string;
  greetingRu?: string;
  hashtag?: string;
  coverImage?: string;
}

export interface CreateGuestRequest {
  name: string;
  phone?: string;
  email?: string;
  group?: string;
}

export interface UpdateGuestRequest {
  name?: string;
  phone?: string;
  email?: string;
  group?: string;
  tableNumber?: string;
}

export interface ImportGuestsRequest {
  names: string[];
}

export interface RSVPRequest {
  status: RSVPStatus;
  plusCount?: number;
  note?: string;
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  title: string;
  description?: string;
  vendorId?: string;
  plannedAmount?: number;
  actualAmount?: number;
  dueDate?: string;
}

export interface UpdateExpenseRequest {
  category?: ExpenseCategory;
  title?: string;
  description?: string;
  vendorId?: string;
  plannedAmount?: number;
  actualAmount?: number;
  paidAmount?: number;
  status?: ExpenseStatus;
  dueDate?: string;
}

export interface CreateVendorRequest {
  category: ExpenseCategory;
  name: string;
  phone?: string;
  instagram?: string;
  totalAmount?: number;
  depositAmount?: number;
  note?: string;
}

export interface UpdateVendorRequest {
  category?: ExpenseCategory;
  name?: string;
  phone?: string;
  instagram?: string;
  totalAmount?: number;
  paidAmount?: number;
  depositAmount?: number;
  status?: VendorStatus;
  note?: string;
}

export interface CreateChecklistItemRequest {
  title: string;
  description?: string;
  category: ChecklistCategory;
  dueDate?: string;
  relativeDays?: number;
}

export interface UpdateChecklistItemRequest {
  title?: string;
  description?: string;
  category?: ChecklistCategory;
  dueDate?: string;
  relativeDays?: number;
  order?: number;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
