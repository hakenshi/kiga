import { noteUpdateSchema } from "@/lib/db/zod/schemas/note/index.schema";
import { countWords } from "@/lib/utils";
import Storage from "expo-sqlite/kv-store";
import { createJSONStorage } from "zustand/middleware";
import { z } from "zod";

export type NoteResource = "noteThoughts" | "noteEmotions" | "noteReactions" | "noteBehaviors";

export interface NoteDraftState {
  note: NoteUpdate;
  expiresAt: number;
  update: (data: NoteUpdate | ((note: NoteUpdate) => NoteUpdate)) => void;
  clear: () => void;
  revalidate: () => boolean;
  toggleMood: (moodId: number) => void;
  toggleResource: (resource: NoteResource, id: number) => void;
  removeResources: (resource: NoteResource, ids: number[]) => void;
  addImages: (uris: string[]) => void;
  removeImage: (uri: string) => void;
  replaceImage: (uri: string, replacement: string) => void;
}

const persistedDraftSchema = z.object({
  note: noteUpdateSchema,
  expiresAt: z.number(),
});

export const noteDraftStorage = createJSONStorage(() => Storage, {
  reviver: (key, value) => key === "date" && typeof value === "string" ? new Date(value) : value,
});

export function mergeNoteDraft<T extends NoteDraftState>(persisted: unknown, current: T): T {
  const result = persistedDraftSchema.safeParse(persisted);
  if (!result.success || result.data.expiresAt <= Date.now()) return current;
  return { ...current, ...result.data };
}

export function selectDraftWordCount(state: NoteDraftState): number {
  return countWords(state.note.content ?? "");
}

export function selectDraftImageCount(state: NoteDraftState): number {
  return state.note.noteImages?.length ?? 0;
}

export function getDraftImages(uris: string[]): Pick<NoteImage, "imageUrl">[] {
  return uris.map(imageUrl => ({ imageUrl }));
}
