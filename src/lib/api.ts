import {
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
  InvitationTemplate,
  TemplatePreview,
  InvitationData,
  CreateEventRequest,
  UpdateEventRequest,
  CreateGuestRequest,
  UpdateGuestRequest,
  ImportGuestsRequest,
  RSVPRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateVendorRequest,
  UpdateVendorRequest,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  ExpenseCategoryInfo,
  VendorStatusInfo,
  ChecklistCategory,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const FUNCTION_URL = process.env.NEXT_PUBLIC_FUNCTION_URL || API_URL;

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

// Templates
export const templates = {
  list: () => fetchApi<InvitationTemplate[]>("/templates"),

  get: (slug: string) => fetchApi<InvitationTemplate>(`/templates/${slug}`),

  listPreviews: () => fetchApi<TemplatePreview[]>("/templates/previews"),
};

// Invitation (public)
export const invitation = {
  get: (slug: string) => fetchApi<InvitationData>(`/i/${slug}`),

  getPersonalized: (slug: string, link: string) =>
    fetchApi<InvitationData>(`/i/${slug}/${link}`),

  submitRSVP: (slug: string, link: string, data: RSVPRequest) =>
    fetchApi<{ message: string }>(`/i/${slug}/${link}/rsvp`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPreview: (eventId: string) =>
    fetchApi<InvitationData>(`/events/${eventId}/invitation/preview`),

  updateConfig: (eventId: string, data: { templateId?: string; rsvpEnabled?: boolean; customHtml?: string; styleDescription?: string }) =>
    fetchApi<Event>(`/events/${eventId}/invitation`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// AI Generation
export interface GenerateInvitationRequest {
  greetingRu: string;
  greetingKz: string;
  styleDescription: string;
}

export interface GenerateInvitationResponse {
  html: string;
  generationsLeft: number;
  generationsTotal: number;
}

export interface GenerationsRemaining {
  remaining: number;
  total: number;
}

// Fetch with Function URL (for long-running operations like AI generation)
async function fetchFunctionApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${FUNCTION_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `Request failed: ${response.status}`
    );
  }

  return response.json();
}

export const ai = {
  generate: (eventId: string, data: GenerateInvitationRequest) =>
    fetchFunctionApi<GenerateInvitationResponse>(`/events/${eventId}/ai/generate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getGenerationsRemaining: () =>
    fetchApi<GenerationsRemaining>("/ai/generations"),
};

export { ApiError };
