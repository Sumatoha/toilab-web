// Event types
export type EventType = "wedding" | "sundet" | "tusau" | "birthday" | "anniversary" | "corporate";
export type EventStatus = "draft" | "active" | "completed" | "archived";
export type RSVPStatus = "pending" | "accepted" | "declined";
export type ExpenseStatus = "planned" | "booked" | "paid";
export type VendorStatus = "contacted" | "booked" | "deposit_paid" | "paid" | "cancelled";
export type VendorType = "photographer" | "videographer" | "mc" | "dj" | "stylist" | "florist" | "restaurant" | "band" | "decor" | "transport" | "other";
export type Plan = "free" | "single" | "pro" | "trial";

// User
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: Plan;
  planExpiresAt?: string;
  monthlyEventsCreated?: number;
  monthlyResetAt?: string;
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
  externalUrl?: string;
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
  tableId?: string;
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
  plannedTotal: number;
  actualTotal: number;
  paidTotal: number;
  expenseCount: number;
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

// Calendar
export type CalendarEventType = "meeting" | "deadline" | "reminder" | "other";

export interface CalendarEvent {
  id: string;
  eventId: string;
  checklistItemId?: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  autoCompleteTask: boolean;
  isCompleted: boolean;
  createdAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  checklistItemId?: string;
  autoCompleteTask?: boolean;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  type?: CalendarEventType;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  isCompleted?: boolean;
  autoCompleteTask?: boolean;
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

// Gift
export type GiftType = "money" | "item";

export interface Gift {
  id: string;
  eventId: string;
  guestId?: string;
  guestName: string;
  type: GiftType;
  amount: number;
  description?: string;
  note?: string;
  receivedAt: string;
  createdAt: string;
}

export interface GiftStats {
  totalGifts: number;
  moneyGifts: number;
  itemGifts: number;
  totalAmount: number;
}

export interface GiftSummary {
  totalGifts: number;
  totalAmount: number;
  moneyCount: number;
  itemCount: number;
  moneyTotal: number;
}

export interface CreateGiftRequest {
  guestId?: string;
  guestName: string;
  type: GiftType;
  amount?: number;
  description?: string;
  note?: string;
  receivedAt?: string;
}

export interface CreateGiftWithGuestRequest {
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  createGuest: boolean;
  type: GiftType;
  amount?: number;
  description?: string;
  note?: string;
  receivedAt?: string;
}

export interface UpdateGiftRequest {
  guestName?: string;
  type?: GiftType;
  amount?: number;
  description?: string;
  note?: string;
  receivedAt?: string;
}

export interface GiftTypeInfo {
  key: GiftType;
  nameRu: string;
  nameKz: string;
}

// Program
export interface ProgramItem {
  id: string;
  eventId: string;
  startTime: string;
  endTime?: string;
  title: string;
  description?: string;
  responsible?: string;
  duration: number;
  order: number;
  createdAt: string;
}

export interface CreateProgramItemRequest {
  startTime: string;
  endTime?: string;
  title: string;
  description?: string;
  responsible?: string;
  duration?: number;
}

export interface UpdateProgramItemRequest {
  startTime?: string;
  endTime?: string;
  title?: string;
  description?: string;
  responsible?: string;
  duration?: number;
  order?: number;
}

export interface ReorderProgramRequest {
  items: { id: string; order: number }[];
}

export interface ProgramTemplate {
  eventType: string;
  nameRu: string;
  nameKz: string;
  itemCount: number;
}

// Share
export type ShareAccessLevel = "view" | "editor";

export type ShareWidget = "guests" | "budget" | "checklist" | "program" | "seating" | "gifts";

export interface ShareLink {
  id: string;
  eventId: string;
  token: string;
  accessLevel: ShareAccessLevel;
  widgets: ShareWidget[];
  pinCode?: string;
  label?: string;
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateShareLinkRequest {
  accessLevel: ShareAccessLevel;
  widgets?: ShareWidget[];
  pinCode?: string;
  label?: string;
  expiresIn?: number;
}

export interface SharedEventData {
  event: Event;
  widgets: ShareWidget[];
  accessLevel: ShareAccessLevel;
  // Guests
  guestStats?: GuestStats;
  guests?: Guest[];
  // Budget
  budgetSummary?: {
    totalPlanned: number;
    totalActual: number;
    totalPaid: number;
    remaining: number;
  };
  expenses?: Expense[];
  // Checklist
  checklistStats?: {
    total: number;
    completed: number;
    percent: number;
  };
  checklist?: ChecklistItem[];
  // Program
  program?: ProgramItem[];
  // Seating
  seatingStats?: {
    totalTables: number;
    totalCapacity: number;
    seatedGuests: number;
    unseatedGuests: number;
  };
  tables?: SeatingTable[];
  // Gifts
  giftStats?: {
    totalGifts: number;
    totalCash: number;
    totalItems: number;
  };
  gifts?: Gift[];
}

export interface ShareCheckResponse {
  requiresPin: boolean;
  label?: string;
}

// Seating
export type TableShape = "round" | "rect" | "square" | "oval" | "scene";

export interface SeatingTable {
  id: string;
  eventId: string;
  number: number;
  name?: string;
  shape: TableShape;
  capacity: number;
  guestIds: string[];
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  order: number;
  createdAt: string;
}

export interface TableWithGuests extends SeatingTable {
  guests: Guest[];
}

export interface SeatingPlan {
  tables: SeatingTable[];
  unseatedGuests: Guest[];
  seatedCount: number;
  totalCapacity: number;
}

export interface SeatingStats {
  totalTables: number;
  totalCapacity: number;
  seatedGuests: number;
  unseatedGuests: number;
}

export interface CreateTableRequest {
  name?: string;
  shape?: TableShape;
  capacity?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface UpdateTableRequest {
  name?: string;
  shape?: TableShape;
  capacity?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Activity Log
export type ActivityAction =
  | "guest_added" | "guest_updated" | "guest_deleted" | "guest_rsvp"
  | "expense_added" | "expense_updated" | "expense_paid" | "expense_deleted"
  | "task_completed" | "task_added" | "task_updated" | "task_deleted"
  | "program_item_added" | "program_item_updated" | "program_item_deleted"
  | "vendor_added" | "vendor_updated" | "vendor_paid" | "vendor_deleted"
  | "table_added" | "table_updated" | "table_deleted" | "guest_seated"
  | "gift_added" | "gift_deleted"
  | "calendar_event_added" | "calendar_event_completed"
  | "event_updated" | "share_link_created";

export interface ActivityLog {
  id: string;
  eventId: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
