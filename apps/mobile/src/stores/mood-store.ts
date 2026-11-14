import { create } from "zustand";
import { MoodRepository } from "@/repositories/mood-repository";
import type { MoodFilterOptions } from "@/repositories/mood-repository";
import { useToastStore } from "@/stores/toast-store";

type Moods = Awaited<ReturnType<typeof MoodRepository.findMany>>;

interface MoodState {
  moods: Moods;
  loadMoods: (userId: number) => Promise<void>;
  searchMoods: (query: string, filters: MoodFilterOptions) => Promise<void>;
  updateMoods: (moods: Moods) => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  moods: [],
  updateMoods: (moods) => set({ moods }),
  loadMoods: async (userId) => {
    try {
      const moods = await MoodRepository.findMany(userId);
      set({ moods });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar humores.", error);
    }
  },
  searchMoods: async (query, filters) => {
    try {
      const moods = await MoodRepository.search(query, filters);
      set({ moods });
    } catch (error) {
      useToastStore.getState().showError("Falha ao buscar humores.", error);
    }
  },
}));
