import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "./types";
import { auth } from "./api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const user = await auth.me();
          set({ user, isLoading: false, isAuthenticated: true });
        } catch {
          // Try to refresh token
          const refreshed = await get().refreshTokens();
          if (!refreshed) {
            get().logout();
          }
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          return false;
        }

        try {
          const result = await auth.refresh(refreshToken);
          localStorage.setItem("accessToken", result.accessToken);
          set({ accessToken: result.accessToken });

          // Fetch user after refreshing tokens
          const user = await auth.me();
          set({ user, isLoading: false, isAuthenticated: true });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "toilab-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      skipHydration: true,
    }
  )
);

// Event store for current event context
interface EventState {
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
}

export const useEventStore = create<EventState>()((set) => ({
  currentEventId: null,
  setCurrentEventId: (id) => set({ currentEventId: id }),
}));
