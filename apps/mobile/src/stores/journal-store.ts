import { create } from "zustand";
import { getJournalEntries, getJournalEntryById } from "@/lib/db/entries";
import db from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { journalEntryUpdateSchema } from "@/lib/db/zod/zod-schemas";
import { useToastStore } from "@/stores/toast-store";

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
      entries: [newEntry, ...s.entries]
    }))
  },
  updateEntry: async (entryId, newEntryData) => {
    const data = journalEntryUpdateSchema.parse(newEntryData)
    await db
      .update(journalEntries)
      .set(data)
      .where(eq(journalEntries.id, entryId));

    set((s) => ({
      entries: s.entries.map((entry) =>
        entry.id === entryId ? { ...entry, ...newEntryData } : entry
      ),
    }));
  },
  replaceEntry: (updatedEntry) => {
    set((s) => ({
      entries: s.entries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
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
        await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
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
