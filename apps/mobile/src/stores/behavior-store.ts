import { create } from "zustand";
import { BehaviorRepository } from "@/repositories/behavior-repository";
import type { BehaviorFilterOptions } from "@/repositories/behavior-repository";
import { useToastStore } from "@/stores/toast-store";

type Behaviors = Awaited<ReturnType<typeof BehaviorRepository.findMany>>;

interface BehaviorState {
  behaviors: Behaviors;
  loadBehaviors: (userId: number) => Promise<void>;
  searchBehaviors: (query: string, filters: BehaviorFilterOptions) => Promise<void>;
  deleteBehaviors: (ids: number[], userId: number) => boolean;
  updateBehaviors: (behaviors: Behaviors) => void;
}

export const useBehaviorStore = create<BehaviorState>((set) => ({
  behaviors: [],
  updateBehaviors: (behaviors) => set({ behaviors }),
  loadBehaviors: async (userId) => {
    try {
      const behaviors = await BehaviorRepository.findMany(userId);
      set({ behaviors });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar comportamentos.", error);
    }
  },
  searchBehaviors: async (query, filters) => {
    try {
      const behaviors = await BehaviorRepository.search(query, filters);
      set({ behaviors });
    } catch (error) {
      useToastStore.getState().showError("Falha ao buscar comportamentos.", error);
    }
  },
  deleteBehaviors: (ids, userId) => {
    try {
      BehaviorRepository.delete(ids, userId);
      return true;
    } catch (error) {
      useToastStore.getState().showError("Falha ao excluir comportamentos.", error);
      return false;
    }
  },
}));
