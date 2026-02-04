import { create } from "zustand";
import { User } from "./types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;

  hydrate: () => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    if (get().isHydrated) return;

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isLoading: false, isHydrated: true });
    }
  },

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => {
    set({ user, isLoading: false });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

// Event store for current event context
interface EventState {
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
}

export const useEventStore = create<EventState>()((set) => ({
  currentEventId: null,
  setCurrentEventId: (id) => set({ currentEventId: id }),
}));
