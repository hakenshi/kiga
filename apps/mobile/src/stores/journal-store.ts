import { create } from "zustand";
import { getJournalEntries } from "@/lib/db/entries";

const PAGE_SIZE = 20;

interface JournalEntryState {
  entries: JournalEntryWithRelations[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
}

interface JournalEntryActions {
  loadInitial: (userId: number) => Promise<void>;
  loadMore: (userId: number) => Promise<void>;
  addEntry: (newEntry: JournalEntryWithRelations) => void;
  reset: () => void;
}

export const useJournalEntryStore = create<
  JournalEntryState & JournalEntryActions
>()((set, get) => ({
  isLoading: false,
  hasMore: true,
  entries: [],
  page: 0,

  loadInitial: async (userId: number) => {
    set({ isLoading: true, page: 0, hasMore: true });
    try {
      const data = await getJournalEntries(userId, {
        limit: PAGE_SIZE,
        offset: 0,
      });
      set({
        entries: data as JournalEntryWithRelations[],
        hasMore: data.length === PAGE_SIZE,
        page: 1,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error("Erro ao carregar relatos:", error);
    }
  },

  loadMore: async (userId: number) => {
    const { hasMore, isLoading, page, entries } = get();
    if (!hasMore || isLoading) return;

    set({ isLoading: true });
    try {
      const offset = page * PAGE_SIZE;
      const data = await getJournalEntries(userId, {
        limit: PAGE_SIZE,
        offset,
      });
      set({
        entries: [...entries, ...(data as JournalEntryWithRelations[])],
        hasMore: data.length === PAGE_SIZE,
        page: page + 1,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error("Erro ao carregar mais relatos:", error);
    }
  },

  addEntry: (newEntry: JournalEntryWithRelations) => {
    set((state) => ({
      entries: [newEntry, ...state.entries],
    }));
  },

  reset: () => {
    set({
      entries: [],
      isLoading: false,
      hasMore: true,
      page: 0,
    });
  },
}));
