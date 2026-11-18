import { create } from "zustand";
import { NoteRepository } from "@/repositories/note-repository";
import type { NoteFilterOptions } from "@/repositories/note-repository";
import { useToastStore } from "@/stores/toast-store";
import { useAuthStore } from "@/stores/auth-store";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { formatNoteDate } from "@/lib/utils";

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
  addNote: (newNote: NoteInsert) => void;
  updateNote: (noteId: number, noteData: NoteUpdate) => void
  deleteNote: (noteId: number) => Promise<void>;
  findNote: (noteId: number) => Promise<Note | null>;
  findComposerNote: (noteId: string) => Promise<ReturnType<typeof getComposerContext> | null>;
  reset: () => void;
}

export function selectNotes(state: NoteState) {
  return state.query === "" ? state.notes : state.searchResults;
}

export function getNoteBody(note: Note) {
  const behaviors = note.noteBehaviors.map(item => item.behavior);

  return {
    images: note.noteImages.map(item => item.imageUrl),
    behaviors: behaviors.filter(behavior => Boolean(behavior.icon)),
    reports: behaviors.filter((behavior): behavior is Behavior & { content: string } =>
      !behavior.icon && behavior.content !== null && behavior.content.trim().length > 0
    ),
  };
}

function getComposerContext(note: Note) {
  const user = useAuthStore.getState().user;
  const currentAuthorName = user ? `${user.firstName} ${user.secondName}`.trim() : "";

  return {
    note,
    authorName: note.userId === user?.id ? currentAuthorName : "Autor da nota",
    authorInitial: user?.firstName.charAt(0) ?? "F",
    currentAuthorName,
    formattedDate: formatNoteDate(note.date),
    mood: resolveMoodConfig(note),
    thoughts: note.noteThoughts.map(({ thought }) => thought),
    emotions: note.noteEmotions.map(({ emotion }) => emotion),
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
        useToastStore.getState().showError("Falha ao buscar notas.", error);
      }
    },
    addNote: (newNote: NoteInsert) => {
      const note = NoteRepository.create(newNote)
      set((s) => ({
        notes: [note, ...s.notes]
      }));
      if (get().query !== "") {
        get().searchNotes(get().query, { userId: note.userId });
      }
    },
    updateNote: (noteId, newNoteData) => {
      const note = NoteRepository.update(noteId, newNoteData);
      set((s) => {
        const updated = s.notes.map(n => n.id === noteId ? note : n)
        return {
          notes: updated,
        }
      })
      if (get().query !== "") {
        get().searchNotes(get().query, { userId: note.userId });
      }
    },
    findNote: async (noteId) => {
      return (await NoteRepository.findOne(noteId)) ?? null;
    },
    findComposerNote: async (noteId) => {
      try {
        const note = await get().findNote(Number(noteId));
        return note ? getComposerContext(note) : null;
      } catch (error) {
        useToastStore.getState().showError("Falha ao carregar a nota.", error);
        return null;
      }
    },
    deleteNote: async (noteId) => {
      const { notes, searchResults } = get();
      const target = notes.find((i) => i.id === noteId) ?? searchResults.find((i) => i.id === noteId);
      if (!target) return;

      const targetIndex = notes.findIndex((i) => i.id === noteId);

      // 1. Remove da tela imediatamente (otimista, sem travar o usuário)
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== noteId),
        searchResults: s.searchResults.filter((n) => n.id !== noteId),
      }));

      let isUndone = false;

      // 2. Agenda a exclusão definitiva no SQLite
      const commitDelete = async () => {
        if (isUndone) return;
        try {
          await NoteRepository.delete(noteId);
        } catch (error) {
          useToastStore.getState().showError("Falha ao excluir a nota do banco de dados.", error);
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
        "Nota excluída.",
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
