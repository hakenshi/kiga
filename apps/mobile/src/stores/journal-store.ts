import { create } from "zustand";
import { EntryRepository } from "@/repositories/entry-repository";
import type { EntryFilterOptions } from "@/repositories/entry-repository";
import { useToastStore } from "@/stores/toast-store";

const PAGE_SIZE = 20;

interface JournalEntryState {
  entries: JournalEntry[];
  searchResults: JournalEntry[];
  query: string;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
}
interface JournalEntryActions {
  loadInitial: (userId: number) => Promise<void>; loadMore: (userId: number) => Promise<void>;
  searchEntries: (query: string, filters: EntryFilterOptions) => void;
  addEntry: (newEntry: JournalEntryInsert) => void;
  updateEntry: (entryId: number, entryData: JournalEntryUpdate) => void
  deleteEntry: (entryId: number) => Promise<void>;
  findEntry: (entryId: number) => Promise<JournalEntry | null>;
  reset: () => void;
}

export function selectEntries(state: JournalEntryState) {
  return state.query === "" ? state.entries : state.searchResults;
}

export function getEntryBody(entry: JournalEntry) {
  const behaviors = entry.entryBehaviors.map(item => item.behavior);

  return {
    images: entry.entryImages.map(item => item.imageUrl),
    behaviors: behaviors.filter(behavior => Boolean(behavior.icon)),
    reports: behaviors.filter((behavior): behavior is Behavior & { content: string } =>
      !behavior.icon && behavior.content !== null && behavior.content.trim().length > 0
    ),
  };
}

export const useEntryStore = create<JournalEntryState & JournalEntryActions>()(
  ((set, get) => ({
    entries: [],
    searchResults: [],
    query: "",
    hasMore: false,
    isLoading: false,
    page: 0,
    cachedEntry: {
      expired: true,
      expiresIn: 0,
    },
    loadInitial: async (userId) => {
      set(({ isLoading: true, page: 0, hasMore: true }))
      try {
        const data = await EntryRepository.findMany(userId, {
          limit: PAGE_SIZE,
          offset: 0,
        });
        set({
          entries: data,
          hasMore: data.length === PAGE_SIZE,
          page: 1,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },
    loadMore: async (userId) => {
      const { isLoading, hasMore, page, entries, query } = get();
      if (!hasMore || isLoading || query !== "") return;
      set({ isLoading: true });
      try {
        const offset = page * PAGE_SIZE;
        const data = await EntryRepository.findMany(userId, {
          limit: PAGE_SIZE,
          offset,
        });
        set({
          entries: [...entries, ...data],
          hasMore: data.length === PAGE_SIZE,
          page: page + 1,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },
    searchEntries: (query, filters) => {
      query = query.trim();
      if (query === "") {
        set({ query, searchResults: [] });
        return;
      }

      try {
        const searchResults = EntryRepository.search(query, filters);
        set({ query, searchResults });
      } catch (error) {
        set({ query, searchResults: [] });
        useToastStore.getState().showError("Falha ao buscar relatos.", error);
      }
    },
    addEntry: (newEntry: JournalEntryInsert) => {
      const entry = EntryRepository.create(newEntry)
      set((s) => ({
        entries: [entry, ...s.entries]
      }));
      if (get().query !== "") {
        get().searchEntries(get().query, { userId: entry.userId });
      }
    },
    updateEntry: (entryId, newEntryData) => {
      const entry = EntryRepository.update(entryId, newEntryData);
      set((s) => {
        const updated = s.entries.map(e => e.id === entryId ? entry : e)
        return {
          entries: updated,
        }
      })
      if (get().query !== "") {
        get().searchEntries(get().query, { userId: entry.userId });
      }
    },
    findEntry: async (entryId) => {
      const { entries, searchResults } = get();
      const cached = entries.find((e) => e.id === entryId) ?? searchResults.find((e) => e.id === entryId);
      if (cached) return cached;
      return (await EntryRepository.findOne(entryId)) ?? null;
    },
    deleteEntry: async (entryId) => {
      const { entries, searchResults } = get();
      const target = entries.find((i) => i.id === entryId) ?? searchResults.find((i) => i.id === entryId);
      if (!target) return;

      const targetIndex = entries.findIndex((i) => i.id === entryId);

      // 1. Remove da tela imediatamente (otimista, sem travar o usuário)
      set((s) => ({
        entries: s.entries.filter((e) => e.id !== entryId),
        searchResults: s.searchResults.filter((e) => e.id !== entryId),
      }));

      let isUndone = false;

      // 2. Agenda a exclusão definitiva no SQLite
      const commitDelete = async () => {
        if (isUndone) return;
        try {
          await EntryRepository.delete(entryId);
        } catch (error) {
          useToastStore.getState().showError("Falha ao excluir o relato do banco de dados.", error);
          // Restaura na tela caso falhe no banco
          set((s) => {
            const next = [...s.entries];
            if (targetIndex !== -1) next.splice(targetIndex, 0, target);
            return { entries: next };
          });
          get().searchEntries(get().query, { userId: target.userId });
        }
      };

      const timer = setTimeout(commitDelete, 4500);

      // 3. Exibe o toast discreto com opção de Desfazer
      useToastStore.getState().showAction(
        "Relato excluído.",
        "Desfazer",
        () => {
          isUndone = true;
          clearTimeout(timer);
          // Restaura na mesma posição do feed
          set((s) => {
            const next = [...s.entries];
            if (targetIndex !== -1) next.splice(targetIndex, 0, target);
            return { entries: next };
          });
          get().searchEntries(get().query, { userId: target.userId });
        },
        4500
      );
    },
    reset: () => {
      set({
        entries: [],
        searchResults: [],
        query: "",
        isLoading: false,
        hasMore: false,
        page: 0,
      })
    }
  })),
)
