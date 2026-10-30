import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { appStorage } from "@/lib/storage";

export type SessionState = {
  user: User | null;
  isAuthenticated: boolean;
};

export type SessionActions = {
  setUser: ({ user, isAuthenticated }: SessionState) => void;
  logout: () => void;
};

export const useAuthStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setUser: ({ user, isAuthenticated }: SessionState) =>
        set({ user, isAuthenticated }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => appStorage),
    }
  )
);
