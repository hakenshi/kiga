import { create } from "zustand";
import { EmotionRepository } from "@/repositories/emotion-repository";
import type { EmotionFilterOptions } from "@/repositories/emotion-repository";
import { useToastStore } from "@/stores/toast-store";

type Emotions = Awaited<ReturnType<typeof EmotionRepository.findMany>>;

interface EmotionState {
  emotions: Emotions;
  loadEmotions: (userId: number) => Promise<void>;
  searchEmotions: (query: string, filters: EmotionFilterOptions) => Promise<void>;
  deleteEmotions: (ids: number[], userId: number) => boolean;
  hasEmotion: (name: string) => boolean;
  updateEmotions: (emotions: Emotions) => void;
}

export const useEmotionStore = create<EmotionState>((set, get) => ({
  emotions: [],
  updateEmotions: (emotions) => set({ emotions }),
  loadEmotions: async (userId) => {
    try {
      const emotions = await EmotionRepository.findMany(userId);
      set({ emotions });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar emoções.", error);
    }
  },
  searchEmotions: async (query, filters) => {
    try {
      const emotions = await EmotionRepository.search(query, filters);
      set({ emotions });
    } catch (error) {
      useToastStore.getState().showError("Falha ao buscar emoções.", error);
    }
  },
  deleteEmotions: (ids, userId) => {
    try {
      EmotionRepository.delete(ids, userId);
      return true;
    } catch (error) {
      useToastStore.getState().showError("Falha ao excluir emoções.", error);
      return false;
    }
  },
  hasEmotion: (name) => {
    const query = name.trim().toLowerCase();
    return get().emotions.some(category =>
      category.emotions.some(emotion => emotion.name.toLowerCase() === query)
    );
  },
}));
