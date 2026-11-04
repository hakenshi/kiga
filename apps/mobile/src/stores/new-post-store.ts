import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { appStorage } from "@/lib/storage";
import { createComposerSlice, type ComposerSlice } from "@/components/composer/composer-slice";

/**
 * Rascunho do novo registro. Persistido: se o app fechar, o texto volta.
 * Edição, resposta e republicação têm stores próprias.
 */
export type NewPostStore = ComposerSlice;

export const useNewPostStore = create<NewPostStore>()(
  persist(
    (...a) => ({
      ...createComposerSlice<NewPostStore>()(...a),
    }),
    {
      name: "new-post-draft",
      storage: createJSONStorage(() => appStorage),
      partialize: (s) => ({
        content: s.content,
        moodId: s.moodId,
        emotions: s.emotions,
        thoughts: s.thoughts,
        reactions: s.reactions,
        behaviors: s.behaviors,
        images: s.images,
      }),
    }
  )
);
