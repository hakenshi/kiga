import { create } from "zustand";
import { NoteRepository } from "@/repositories/note-repository";
import type { NoteFilterOptions } from "@/repositories/note-repository";
import { useToastStore } from "@/stores/toast-store";

const PAGE_SIZE = 20;

interface NoteState {
  notes: Note[];
  searchResults: Note[];
  query: string;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
}
interface NoteActions {
  loadInitial: (userId: number) => Promise<void>; loadMore: (userId: number) => Promise<void>;
  searchNotes: (query: string, filters: NoteFilterOptions) => void;
  addNote: (newEntry: NoteInsert) => void;
  updateNote: (entryId: number, entryData: NoteUpdate) => void
  deleteNote: (entryId: number) => Promise<void>;
  findNote: (entryId: number) => Promise<Note | null>;
  reset: () => void;
}

export function selectNotes(state: NoteState) {
  return state.query === "" ? state.notes : state.searchResults;
}

export function getNoteBody(entry: Note) {
  const behaviors = entry.noteBehaviors.map(item => item.behavior);

  return {
    images: entry.noteImages.map(item => item.imageUrl),
    behaviors: behaviors.filter(behavior => Boolean(behavior.icon)),
    reports: behaviors.filter((behavior): behavior is Behavior & { content: string } =>
      !behavior.icon && behavior.content !== null && behavior.content.trim().length > 0
    ),
  };
}

export const useNoteStore = create<NoteState & NoteActions>()(
  ((set, get) => ({
    notes: [],
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
        const data = await NoteRepository.findMany(userId, {
          limit: PAGE_SIZE,
          offset: 0,
        });
        set({
          notes: data,
          hasMore: data.length === PAGE_SIZE,
          page: 1,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },
    loadMore: async (userId) => {
      const { isLoading, hasMore, page, notes, query } = get();
      if (!hasMore || isLoading || query !== "") return;
      set({ isLoading: true });
      try {
        const offset = page * PAGE_SIZE;
        const data = await NoteRepository.findMany(userId, {
          limit: PAGE_SIZE,
          offset,
        });
        set({
          notes: [...notes, ...data],
          hasMore: data.length === PAGE_SIZE,
          page: page + 1,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    },
    searchNotes: (query, filters) => {
      query = query.trim();
      if (query === "") {
        set({ query, searchResults: [] });
        return;
      }

      try {
        const searchResults = NoteRepository.search(query, filters);
        set({ query, searchResults });
      } catch (error) {
        set({ query, searchResults: [] });
        useToastStore.getState().showError("Falha ao buscar relatos.", error);
      }
    },
    addNote: (newEntry: NoteInsert) => {
      const entry = NoteRepository.create(newEntry)
      set((s) => ({
        notes: [entry, ...s.notes]
      }));
      if (get().query !== "") {
        get().searchNotes(get().query, { userId: entry.userId });
      }
    },
    updateNote: (entryId, newEntryData) => {
      const entry = NoteRepository.update(entryId, newEntryData);
      set((s) => {
        const updated = s.notes.map(e => e.id === entryId ? entry : e)
        return {
          notes: updated,
        }
      })
      if (get().query !== "") {
        get().searchNotes(get().query, { userId: entry.userId });
      }
    },
    findNote: async (entryId) => {
      const { notes, searchResults } = get();
      const cached = notes.find((e) => e.id === entryId) ?? searchResults.find((e) => e.id === entryId);
      if (cached) return cached;
      return (await NoteRepository.findOne(entryId)) ?? null;
    },
    deleteNote: async (entryId) => {
      const { notes, searchResults } = get();
      const target = notes.find((i) => i.id === entryId) ?? searchResults.find((i) => i.id === entryId);
      if (!target) return;

      const targetIndex = notes.findIndex((i) => i.id === entryId);

      // 1. Remove da tela imediatamente (otimista, sem travar o usuário)
      set((s) => ({
        notes: s.notes.filter((e) => e.id !== entryId),
        searchResults: s.searchResults.filter((e) => e.id !== entryId),
      }));

      let isUndone = false;

      // 2. Agenda a exclusão definitiva no SQLite
      const commitDelete = async () => {
        if (isUndone) return;
        try {
          await NoteRepository.delete(entryId);
        } catch (error) {
          useToastStore.getState().showError("Falha ao excluir o relato do banco de dados.", error);
          // Restaura na tela caso falhe no banco
          set((s) => {
            const next = [...s.notes];
            if (targetIndex !== -1) next.splice(targetIndex, 0, target);
            return { notes: next };
          });
          get().searchNotes(get().query, { userId: target.userId });
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
            const next = [...s.notes];
            if (targetIndex !== -1) next.splice(targetIndex, 0, target);
            return { notes: next };
          });
          get().searchNotes(get().query, { userId: target.userId });
        },
        4500
      );
    },
    reset: () => {
      set({
        notes: [],
        searchResults: [],
        query: "",
        isLoading: false,
        hasMore: false,
        page: 0,
      })
    }
  })),
)
