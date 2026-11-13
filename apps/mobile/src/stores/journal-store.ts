import { create } from "zustand";
import { EntryRepository } from "@/repositories/entry-repository";
import { useToastStore } from "@/stores/toast-store";

const PAGE_SIZE = 20;

interface JournalEntryState {
  entries: JournalEntry[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
}
interface JournalEntryActions {
  loadInitial: (userId: number) => Promise<void>; loadMore: (userId: number) => Promise<void>;
  addEntry: (newEntry: JournalEntryInsert) => void;
  updateEntry: (entryId: number, entryData: JournalEntryUpdate) => void
  deleteEntry: (entryId: number) => Promise<void>;
  findEntry: (entryId: number) => Promise<JournalEntry | null>;
  reset: () => void;
}

export const useEntryStore = create<JournalEntryState & JournalEntryActions>()(
  ((set, get) => ({
    entries: [],
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
      const { isLoading, hasMore, page, entries } = get();
      if (!hasMore || isLoading) return;
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
    addEntry: (newEntry: JournalEntryInsert) => {
      EntryRepository.create(newEntry)
      set((s) => ({
        entries: s.entries.map(e => ({ ...newEntry, ...e }))
      }));
    },
    updateEntry: (entryId, newEntryData) => {
      EntryRepository.update(entryId, newEntryData);
      set((s) => {
        const updated = s.entries.map(e => e.id === entryId ? { ...newEntryData, ...e } : e)
        return {
          entries: updated
        }
      })
    },
    findEntry: async (entryId) => {
      const { entries } = get();
      const cached = entries.find((e) => e.id === entryId);
      if (cached) return cached;
      return (await EntryRepository.findOne(entryId)) ?? null;
    },
    deleteEntry: async (entryId) => {
      const { entries } = get();
      const target = entries.find((i) => i.id === entryId);
      if (!target) return;

      const targetIndex = entries.findIndex((i) => i.id === entryId);

      // 1. Remove da tela imediatamente (otimista, sem travar o usuário)
      set((s) => ({
        entries: s.entries.filter((e) => e.id !== entryId),
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
            next.splice(targetIndex, 0, target);
            return { entries: next };
          });
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
            next.splice(targetIndex, 0, target);
            return { entries: next };
          });
        },
        4500
      );
    },
    reset: () => {
      set({
        entries: [],
        isLoading: false,
        hasMore: false,
        page: 0,
      })
    }
  })),
)
