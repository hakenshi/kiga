import { create } from "zustand";
import { EntryRepository } from "@/repositories/entry-repository";
import {
  createComposerSlice,
  entryToComposerState,
  type ComposerSlice,
} from "@/components/composer/composer-slice";
import { useEntryStore } from "./journal-store";
import { useToastStore } from "./toast-store";

type EditPostExtra = {
  editingEntryId: number | null;
  isLoading: boolean;
  startEditing: (entry: JournalEntryWithRelations) => void;
  loadEntryForEdit: (entryId: number) => Promise<boolean>;
  saveEdit: () => Promise<JournalEntryWithRelations | null>;
};

/** Edição de um registro existente. Não persiste: fechar descarta as mudanças. */
export type EditPostStore = ComposerSlice & EditPostExtra;

export const useEditPostStore = create<EditPostStore>()((set, get, api) => ({
  ...createComposerSlice<EditPostStore>(() => ({ editingEntryId: null, isLoading: false }))(set, get, api),
  editingEntryId: null,
  isLoading: false,

  startEditing: (entry) =>
    set({ ...entryToComposerState(entry), editingEntryId: entry.id, isLoading: false, isSaving: false }),

  loadEntryForEdit: async (entryId) => {
    set({ isLoading: true });
    try {
      const entry = await useEntryStore.getState().findEntry(entryId);
      if (!entry) {
        set({ isLoading: false, editingEntryId: null });
        return false;
      }
      get().startEditing(entry);
      return true;
    } catch (error) {
      console.error("Erro ao carregar entrada para edição:", error);
      set({ isLoading: false });
      return false;
    }
  },

  saveEdit: async () => {
    const { editingEntryId, content, moodId, emotions, thoughts, reactions, behaviors, images, entryDate } = get();
    if (!editingEntryId || !content.trim()) return null;

    set({ isSaving: true });
    try {
      const updated = await EntryRepository.update({
        entryId: editingEntryId,
        content,
        moodId,
        emotions,
        thoughts,
        reactions,
        behaviors,
        images,
        date: entryDate,
      });
      useEntryStore.getState().replaceEntry(updated);
      get().reset();
      return updated;
    } catch (error) {
      useToastStore.getState().showError("Falha ao salvar a edição.", error);
      set({ isSaving: false });
      return null;
    }
  },
}));
