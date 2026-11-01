import { create } from "zustand";
import { getJournalEntries } from "@/lib/db/entries";
import db from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { journalEntryUpdateSchema } from "@/lib/db/zod/zod-schemas";

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
  updateEntry: (entryId: number, entryData: UpdateJournalEntryInput) => Promise<void>
  deleteEntry: (entryId: number) => Promise<void>
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
  deleteEntry: async (entryId) => {
    const { entries } = get()
    const exists = entries.some((i) => i.id === entryId)

    if (!exists) {
      console.log(entryId, exists)
      console.log("entrada não encontrada")
      return
    }
    try {
      await db.delete(journalEntries).where(eq(journalEntries.id, entryId))
      set((s) => ({
        entries: s.entries.filter(e =>
          e.id !== entryId
        )
      }))
    } catch (error) {
      console.error("Erro ao excluir entrada: ", error)
    }
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
