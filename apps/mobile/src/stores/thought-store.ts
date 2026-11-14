import { create } from "zustand";
import { ThoughtRepository } from "@/repositories/thought-repository";
import type { ThoughtFilterOptions } from "@/repositories/thought-repository";
import { useToastStore } from "@/stores/toast-store";

type Thoughts = Awaited<ReturnType<typeof ThoughtRepository.findMany>>;

interface ThoughtState {
  thoughts: Thoughts;
  addThought: (data: ThoughtInsert) => Thought | undefined;
  loadThoughts: (userId: number) => Promise<void>;
  searchThoughts: (query: string, filters: ThoughtFilterOptions) => Promise<void>;
  updateThoughts: (thoughts: Thoughts) => void;
}

export const useThoughtStore = create<ThoughtState>((set) => ({
  thoughts: [],
  updateThoughts: (thoughts) => set({ thoughts }),
  addThought: (data) => {
    try {
      const thought = ThoughtRepository.create(data);
      set((state) => ({ thoughts: [thought, ...state.thoughts] }));
      return thought;
    } catch (error) {
      useToastStore.getState().showError("Falha ao criar pensamento.", error);
    }
  },
  loadThoughts: async (userId) => {
    try {
      const thoughts = await ThoughtRepository.findMany(userId);
      set({ thoughts });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar pensamentos.", error);
    }
  },
  searchThoughts: async (query, filters) => {
    try {
      const thoughts = await ThoughtRepository.search(query, filters);
      set({ thoughts });
    } catch (error) {
      useToastStore.getState().showError("Falha ao buscar pensamentos.", error);
    }
  },
}));
