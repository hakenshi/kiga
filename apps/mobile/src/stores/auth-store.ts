import { create } from "zustand";

export type SessionState = {
  user: User | null;
  isAuthenticated: boolean
};

type SessionActions = {
  setUser: ({ user, isAuthenticated }: SessionState) => void;
  logout: () => void;
};

export const useAuthStore = create<SessionState & SessionActions>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: ({ user, isAuthenticated }: SessionState) => set({ user, isAuthenticated }),
  logout: () => set({ user: null, isAuthenticated: false })
}));

