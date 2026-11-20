import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { appStorage } from "@/lib/storage";
import { queryClient } from "@/lib/query-client";

export type SessionState = {
  user: User | null;
  isAuthenticated: boolean;
};

export type SessionActions = {
  setUser: ({ user, isAuthenticated }: SessionState) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
};

export const useAuthStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setUser: ({ user, isAuthenticated }: SessionState) => {
        if (useAuthStore.getState().user?.id !== user?.id) queryClient.clear();
        set({ user, isAuthenticated });
      },
      updateUser: data => set(s => (s.user ? { user: { ...s.user, ...data } } : s)),
      logout: () => {
        queryClient.clear();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => appStorage),
    }
  )
);
