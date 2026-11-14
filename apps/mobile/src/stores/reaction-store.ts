import { create } from "zustand";
import { ReactionRepository } from "@/repositories/reaction-repository";
import type { ReactionFilterOptions } from "@/repositories/reaction-repository";
import { useToastStore } from "@/stores/toast-store";

type Reactions = Awaited<ReturnType<typeof ReactionRepository.findMany>>;

interface ReactionState {
  reactions: Reactions;
  loadReactions: (userId: number) => Promise<void>;
  searchReactions: (query: string, filters: ReactionFilterOptions) => Promise<void>;
  deleteReactions: (ids: number[], userId: number) => boolean;
  updateReactions: (reactions: Reactions) => void;
}

export const useReactionStore = create<ReactionState>((set) => ({
  reactions: [],
  updateReactions: (reactions) => set({ reactions }),
  loadReactions: async (userId) => {
    try {
      const reactions = await ReactionRepository.findMany(userId);
      set({ reactions });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar reações.", error);
    }
  },
  searchReactions: async (query, filters) => {
    try {
      const reactions = await ReactionRepository.search(query, filters);
      set({ reactions });
    } catch (error) {
      useToastStore.getState().showError("Falha ao buscar reações.", error);
    }
  },
  deleteReactions: (ids, userId) => {
    try {
      ReactionRepository.delete(ids, userId);
      return true;
    } catch (error) {
      useToastStore.getState().showError("Falha ao excluir reações.", error);
      return false;
    }
  },
}));
