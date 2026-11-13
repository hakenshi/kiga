import { create } from "zustand";
import { EmotionRepository } from "@/repositories/emotion-repository";
import { useToastStore } from "@/stores/toast-store";

type EmotionCategories = Awaited<ReturnType<typeof EmotionRepository.findMany>>;

interface EmotionState {
  categories: EmotionCategories;
  loadEmotions: (userId: number) => Promise<void>;
}

export const useEmotionStore = create<EmotionState>((set) => ({
  categories: [],
  loadEmotions: async (userId) => {
    try {
      const categories = await EmotionRepository.findMany(userId);
      set({ categories });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar emoções.", error);
    }
  },
}));
