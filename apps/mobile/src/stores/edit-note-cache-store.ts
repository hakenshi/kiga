import { toggleSelectedId } from "@/lib/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";
import { mergeNoteDraft, noteDraftStorage, type NoteDraftState } from "./note-draft";

interface EditNoteDraftState extends NoteDraftState {
  load: (note: Note) => void;
}

const TTL_MS = 15 * 60_000;
const initialNote: NoteUpdate = { content: "" };

export const useEditNoteCacheStore = create<EditNoteDraftState>()(
  persist(
    (set, get) => ({
      note: { ...initialNote },
      expiresAt: 0,
      update: (data) => {
        get().revalidate();
        set((state) => ({
          note: {
            ...state.note,
            ...(typeof data === "function" ? data(state.note) : data),
            userId: useAuthStore.getState().user?.id,
          },
          expiresAt: Date.now() + TTL_MS,
        }));
      },
      load: (note) => {
        if (get().revalidate() && get().note.id === note.id) return;
        set({
          note: {
            id: note.id,
            userId: note.userId,
            content: note.content,
            noteType: note.noteType,
            moodId: note.moodId,
            date: note.date,
            liked: note.liked,
            fixed: note.fixed,
            noteBehaviors: note.noteBehaviors.map((item) => item.behaviorId),
            noteEmotions: note.noteEmotions.map((item) => item.emotionId),
            noteImages: note.noteImages.map((item) => item.imageUrl),
            noteReactions: note.noteReactions.map((item) => item.reactionId),
            noteThoughts: note.noteThoughts.map((item) => item.thoughtsId),
          },
          expiresAt: Date.now() + TTL_MS,
        });
      },
      clear: () => set({ note: { ...initialNote }, expiresAt: 0 }),
      revalidate: () => {
        const { expiresAt, note } = get();
        if (expiresAt === 0) return false;
        if (expiresAt <= Date.now() || note.userId !== useAuthStore.getState().user?.id) {
          get().clear();
          return false;
        }
        return true;
      },
      toggleMood: (moodId) => get().update((note) => ({ moodId: note.moodId === moodId ? null : moodId })),
      toggleResource: (resource, id) => get().update((note) => ({
        [resource]: toggleSelectedId(note[resource] ?? [], id),
      })),
      removeResources: (resource, ids) => get().update((note) => ({
        [resource]: (note[resource] ?? []).filter((id) => !ids.includes(id)),
      })),
      addImages: (uris) => get().update((note) => ({ noteImages: [...(note.noteImages ?? []), ...uris] })),
      removeImage: (uri) => get().update((note) => ({
        noteImages: (note.noteImages ?? []).filter((image) => image !== uri),
      })),
      replaceImage: (uri, replacement) => get().update((note) => ({
        noteImages: (note.noteImages ?? []).map((image) => image === uri ? replacement : image),
      })),
    }),
    {
      name: "editNoteDraft",
      storage: noteDraftStorage,
      partialize: ({ note, expiresAt }) => ({ note, expiresAt }),
      merge: mergeNoteDraft,
    },
  ),
);
