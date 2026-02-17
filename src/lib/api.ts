import type {
  User,
  Event,
  EventStats,
  Guest,
  GuestStats,
  Expense,
  BudgetSummary,
  Vendor,
  VendorSummary,
  ChecklistItem,
  ChecklistProgress,
  Gift,
  GiftStats,
  GiftSummary,
  GiftTypeInfo,
  CreateEventRequest,
  UpdateEventRequest,
  CreateGuestRequest,
  UpdateGuestRequest,
  ImportGuestsRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateVendorRequest,
  UpdateVendorRequest,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  CreateGiftRequest,
  CreateGiftWithGuestRequest,
  UpdateGiftRequest,
  ProgramItem,
  ProgramTemplate,
  CreateProgramItemRequest,
  UpdateProgramItemRequest,
  ReorderProgramRequest,
  ShareLink,
  CreateShareLinkRequest,
  SharedEventData,
  ShareCheckResponse,
  ExpenseCategoryInfo,
  VendorStatusInfo,
  ChecklistCategory,
  SeatingTable,
  TableWithGuests,
  SeatingPlan,
  SeatingStats,
  CreateTableRequest,
  UpdateTableRequest,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed - clear tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  } catch {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  return localStorage.getItem("accessToken");
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = await getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
    // Avoid multiple simultaneous refreshes
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken();
    }

    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      // Retry the request with new token
      return fetchApi<T>(endpoint, options, true);
    } else {
      // Refresh failed - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Session expired");
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    fetchApi<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    ),

  register: (email: string, password: string, name: string) =>
    fetchApi<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      }
    ),

  me: () => fetchApi<User>("/auth/me"),

  updateProfile: (data: { name?: string }) =>
    fetchApi<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    fetchApi<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  activatePromo: (code: string) =>
    fetchApi<User>("/auth/promo", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};

// Events
export const events = {
  list: () => fetchApi<Event[]>("/events"),

  get: (id: string) => fetchApi<Event>(`/events/${id}`),

  create: (data: CreateEventRequest) =>
    fetchApi<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateEventRequest) =>
    fetchApi<Event>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/events/${id}`, {
      method: "DELETE",
    }),

  getStats: (id: string) => fetchApi<EventStats>(`/events/${id}/stats`),

  activate: (id: string) =>
    fetchApi<Event>(`/events/${id}/activate`, {
      method: "PUT",
    }),

  updateInvitation: (id: string, data: { externalUrl: string }) =>
    fetchApi<Event>(`/events/${id}/invitation`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Guests
export const guests = {
  list: (eventId: string) => fetchApi<Guest[]>(`/events/${eventId}/guests`),

  get: (eventId: string, guestId: string) =>
    fetchApi<Guest>(`/events/${eventId}/guests/${guestId}`),

  create: (eventId: string, data: CreateGuestRequest) =>
    fetchApi<Guest>(`/events/${eventId}/guests`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  import: (eventId: string, data: ImportGuestsRequest) =>
    fetchApi<{ created: number; guests: Guest[] }>(
      `/events/${eventId}/guests/import`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  update: (eventId: string, guestId: string, data: UpdateGuestRequest) =>
    fetchApi<Guest>(`/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (eventId: string, guestId: string) =>
    fetchApi<void>(`/events/${eventId}/guests/${guestId}`, {
      method: "DELETE",
    }),

  getStats: (eventId: string) =>
    fetchApi<GuestStats>(`/events/${eventId}/guests/stats`),
};

// Expenses
export const expenses = {
  list: (eventId: string, category?: string) => {
    const params = category ? `?category=${category}` : "";
    return fetchApi<Expense[]>(`/events/${eventId}/expenses${params}`);
  },

  get: (eventId: string, expenseId: string) =>
    fetchApi<Expense>(`/events/${eventId}/expenses/${expenseId}`),

  create: (eventId: string, data: CreateExpenseRequest) =>
    fetchApi<Expense>(`/events/${eventId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (eventId: string, expenseId: string, data: UpdateExpenseRequest) =>
    fetchApi<Expense>(`/events/${eventId}/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (eventId: string, expenseId: string) =>
    fetchApi<void>(`/events/${eventId}/expenses/${expenseId}`, {
      method: "DELETE",
    }),

  getBudgetSummary: (eventId: string) =>
    fetchApi<BudgetSummary>(`/events/${eventId}/budget-summary`),

  getCategories: () => fetchApi<ExpenseCategoryInfo[]>("/expense-categories"),
};

// Vendors
export const vendors = {
  list: (eventId: string) => fetchApi<Vendor[]>(`/events/${eventId}/vendors`),

  get: (eventId: string, vendorId: string) =>
    fetchApi<Vendor>(`/events/${eventId}/vendors/${vendorId}`),

  create: (eventId: string, data: CreateVendorRequest) =>
    fetchApi<Vendor>(`/events/${eventId}/vendors`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (eventId: string, vendorId: string, data: UpdateVendorRequest) =>
    fetchApi<Vendor>(`/events/${eventId}/vendors/${vendorId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (eventId: string, vendorId: string) =>
    fetchApi<void>(`/events/${eventId}/vendors/${vendorId}`, {
      method: "DELETE",
    }),

  getSummary: (eventId: string) =>
    fetchApi<VendorSummary>(`/events/${eventId}/vendors/summary`),

  getStatuses: () => fetchApi<VendorStatusInfo[]>("/vendor-statuses"),
};

// Checklist
export const checklist = {
  list: (eventId: string) =>
    fetchApi<ChecklistItem[]>(`/events/${eventId}/checklist`),

  get: (eventId: string, itemId: string) =>
    fetchApi<ChecklistItem>(`/events/${eventId}/checklist/${itemId}`),

  create: (eventId: string, data: CreateChecklistItemRequest) =>
    fetchApi<ChecklistItem>(`/events/${eventId}/checklist`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (eventId: string, itemId: string, data: UpdateChecklistItemRequest) =>
    fetchApi<ChecklistItem>(`/events/${eventId}/checklist/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  toggle: (eventId: string, itemId: string, completed: boolean) =>
    fetchApi<{ completed: boolean }>(
      `/events/${eventId}/checklist/${itemId}/toggle`,
      {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      }
    ),

  delete: (eventId: string, itemId: string) =>
    fetchApi<void>(`/events/${eventId}/checklist/${itemId}`, {
      method: "DELETE",
    }),

  getProgress: (eventId: string) =>
    fetchApi<ChecklistProgress>(`/events/${eventId}/checklist/progress`),

  getCategories: () => fetchApi<ChecklistCategory[]>("/checklist-categories"),
};

// Gifts
export const gifts = {
  list: (eventId: string, type?: string) => {
    const params = type ? `?type=${type}` : "";
    return fetchApi<Gift[]>(`/events/${eventId}/gifts${params}`);
  },

  get: (eventId: string, giftId: string) =>
    fetchApi<Gift>(`/events/${eventId}/gifts/${giftId}`),

  create: (eventId: string, data: CreateGiftRequest) =>
    fetchApi<Gift>(`/events/${eventId}/gifts`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createWithGuest: (eventId: string, data: CreateGiftWithGuestRequest) =>
    fetchApi<{ gift: Gift; guest: Guest | null }>(
      `/events/${eventId}/gifts/with-guest`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  update: (eventId: string, giftId: string, data: UpdateGiftRequest) =>
    fetchApi<Gift>(`/events/${eventId}/gifts/${giftId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (eventId: string, giftId: string) =>
    fetchApi<void>(`/events/${eventId}/gifts/${giftId}`, {
      method: "DELETE",
    }),

  getStats: (eventId: string) =>
    fetchApi<GiftStats>(`/events/${eventId}/gifts/stats`),

  getSummary: (eventId: string) =>
    fetchApi<GiftSummary>(`/events/${eventId}/gifts/summary`),

  search: (eventId: string, query: string) =>
    fetchApi<Gift[]>(`/events/${eventId}/gifts/search?q=${encodeURIComponent(query)}`),

  getExportUrl: (eventId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/events/${eventId}/gifts/export?token=${token}`;
  },

  getTypes: () => fetchApi<GiftTypeInfo[]>("/gift-types"),
};

// Program
export const program = {
  list: (eventId: string) =>
    fetchApi<ProgramItem[]>(`/events/${eventId}/program`),

  get: (eventId: string, itemId: string) =>
    fetchApi<ProgramItem>(`/events/${eventId}/program/${itemId}`),

  create: (eventId: string, data: CreateProgramItemRequest) =>
    fetchApi<ProgramItem>(`/events/${eventId}/program`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (eventId: string, itemId: string, data: UpdateProgramItemRequest) =>
    fetchApi<ProgramItem>(`/events/${eventId}/program/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (eventId: string, itemId: string) =>
    fetchApi<void>(`/events/${eventId}/program/${itemId}`, {
      method: "DELETE",
    }),

  reorder: (eventId: string, data: ReorderProgramRequest) =>
    fetchApi<ProgramItem[]>(`/events/${eventId}/program/reorder`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  applyTemplate: (eventId: string, eventType: string) =>
    fetchApi<ProgramItem[]>(`/events/${eventId}/program/apply-template`, {
      method: "POST",
      body: JSON.stringify({ eventType }),
    }),

  getTemplates: () => fetchApi<ProgramTemplate[]>("/program-templates"),
};

// Shares
export const shares = {
  list: (eventId: string) =>
    fetchApi<ShareLink[]>(`/events/${eventId}/shares`),

  create: (eventId: string, data: CreateShareLinkRequest) =>
    fetchApi<ShareLink>(`/events/${eventId}/shares`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deactivate: (eventId: string, shareId: string) =>
    fetchApi<{ message: string }>(`/events/${eventId}/shares/${shareId}/deactivate`, {
      method: "PUT",
    }),

  regenerate: (eventId: string, shareId: string) =>
    fetchApi<ShareLink>(`/events/${eventId}/shares/${shareId}/regenerate`, {
      method: "PUT",
    }),

  delete: (eventId: string, shareId: string) =>
    fetchApi<void>(`/events/${eventId}/shares/${shareId}`, {
      method: "DELETE",
    }),

  // Public share endpoints (no auth required)
  check: (token: string) =>
    fetchApi<ShareCheckResponse>(`/share/${token}/check`),

  getData: (token: string, pin?: string) => {
    const params = pin ? `?pin=${pin}` : "";
    return fetchApi<SharedEventData>(`/share/${token}${params}`);
  },
};

// Seating
export const seating = {
  getTables: (eventId: string) =>
    fetchApi<SeatingTable[]>(`/events/${eventId}/seating/tables`),

  getSeatingPlan: (eventId: string) =>
    fetchApi<SeatingPlan>(`/events/${eventId}/seating/plan`),

  getTablesWithGuests: (eventId: string) =>
    fetchApi<TableWithGuests[]>(`/events/${eventId}/seating/tables-with-guests`),

  getStats: (eventId: string) =>
    fetchApi<SeatingStats>(`/events/${eventId}/seating/stats`),

  createTable: (eventId: string, data: CreateTableRequest) =>
    fetchApi<SeatingTable>(`/events/${eventId}/seating/tables`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTable: (eventId: string, tableId: string, data: UpdateTableRequest) =>
    fetchApi<SeatingTable>(`/events/${eventId}/seating/tables/${tableId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTable: (eventId: string, tableId: string) =>
    fetchApi<void>(`/events/${eventId}/seating/tables/${tableId}`, {
      method: "DELETE",
    }),

  assignGuest: (eventId: string, tableId: string, guestId: string) =>
    fetchApi<{ message: string }>(`/events/${eventId}/seating/tables/${tableId}/guests`, {
      method: "POST",
      body: JSON.stringify({ guestId }),
    }),

  removeGuest: (eventId: string, tableId: string, guestId: string) =>
    fetchApi<{ message: string }>(`/events/${eventId}/seating/tables/${tableId}/guests/${guestId}`, {
      method: "DELETE",
    }),
};

export { ApiError };
