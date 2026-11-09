import { create } from "zustand";
import {
  deleteJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  updateEntryPartial,
} from "@/repositories/entry-repository";
import { useToastStore } from "@/stores/toast-store";

const PAGE_SIZE = 20;

function sortEntries(entries: JournalEntryWithRelations[]): JournalEntryWithRelations[] {
  return [...entries].sort((a, b) => {
    const fixedA = a.fixed ? 1 : 0;
    const fixedB = b.fixed ? 1 : 0;
    if (fixedA !== fixedB) return fixedB - fixedA;

    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateB - dateA;

    return b.id - a.id;
  });
}

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
  updateEntry: (entryId: number, entryData: UpdateJournalEntryInput) => Promise<void>;
  replaceEntry: (updatedEntry: JournalEntryWithRelations) => void;
  deleteEntry: (entryId: number) => Promise<void>;
  findEntry: (entryId: number) => Promise<JournalEntryWithRelations | null>;
  reset: () => void;
}


export const useEntryStore = create<JournalEntryState & JournalEntryActions>()((set, get) => ({
  entries: [],
  hasMore: false,
  isLoading: false,
  page: 0,
  loadInitial: async (userId) => {
    set(({ isLoading: true, page: 0, hasMore: true }))
    try {
      const data = await getJournalEntries(userId, {
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
      const data = await getJournalEntries(userId, {
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
  addEntry: (newEntry: JournalEntryWithRelations) => {
    set((s) => ({
      entries: sortEntries([newEntry, ...s.entries.filter((e) => e.id !== newEntry.id)]),
    }));
  },
  updateEntry: async (entryId, newEntryData) => {
    await updateEntryPartial(entryId, newEntryData);

    set((s) => {
      const updated = s.entries.map((entry) =>
        entry.id === entryId ? { ...entry, ...newEntryData } : entry
      );
      return {
        entries: newEntryData.fixed !== undefined ? sortEntries(updated) : updated,
      };
    });
  },
  replaceEntry: (updatedEntry) => {
    set((s) => ({
      entries: sortEntries(
        s.entries.map((entry) =>
          entry.id === updatedEntry.id ? updatedEntry : entry
        )
      ),
    }));
  },
  findEntry: async (entryId) => {
    const { entries } = get();
    const cached = entries.find((e) => e.id === entryId);
    if (cached) return cached;
    return await getJournalEntryById(entryId);
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
        await deleteJournalEntry(entryId);
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
}))
