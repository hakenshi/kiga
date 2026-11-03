import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { appStorage } from "@/lib/storage";

export type NewPostState = {
  content: string;
  moodId: number | null;
  emotions: EntryEmotionItem[];
  thoughts: EntryThoughtItem[];
  reactions: EntryReactionItem[];
  behaviors: EntryBehaviorItem[];
  images: string[];
};

export type NewPostActions = {
  setContent: (content: string) => void;
  setMoodId: (moodId: number | null) => void;
  toggleEmotion: (item: EntryEmotionItem) => void;
  toggleThought: (item: EntryThoughtItem) => void;
  toggleReaction: (item: EntryReactionItem) => void;
  toggleBehavior: (item: EntryBehaviorItem) => void;
  setBehaviorReport: (text: string) => void;
  removeEmotions: (ids: number[]) => void;
  removeThoughts: (ids: number[]) => void;
  removeReactions: (ids: number[]) => void;
  removeBehaviors: (ids: number[]) => void;
  addImages: (uris: string[]) => void;
  removeImage: (uri: string) => void;
  replaceImage: (oldUri: string, newUri: string) => void;
  reset: () => void;
};

const initialState: NewPostState = {
  content: "",
  moodId: null,
  emotions: [],
  thoughts: [],
  reactions: [],
  behaviors: [],
  images: [],
};

export const useNewPostStore = create<NewPostState & NewPostActions>()(
  persist(
    (set) => ({
      ...initialState,
      setContent: (content) => set({ content }),
      setMoodId: (moodId) => set({ moodId }),
      toggleEmotion: (item) =>
        set((s) => {
          const exists = s.emotions.some(
            (e) =>
              (item.id !== undefined && e.id === item.id) ||
              e.name.toLowerCase() === item.name.toLowerCase()
          );
          return {
            emotions: exists
              ? s.emotions.filter(
                  (e) =>
                    !(
                      (item.id !== undefined && e.id === item.id) ||
                      e.name.toLowerCase() === item.name.toLowerCase()
                    )
                )
              : [...s.emotions, item],
          };
        }),
      toggleThought: (item) =>
        set((s) => {
          const exists = s.thoughts.some(
            (t) =>
              (item.id !== undefined && t.id === item.id) ||
              t.name.toLowerCase() === item.name.toLowerCase()
          );
          return {
            thoughts: exists
              ? s.thoughts.filter(
                  (t) =>
                    !(
                      (item.id !== undefined && t.id === item.id) ||
                      t.name.toLowerCase() === item.name.toLowerCase()
                    )
                )
              : [...s.thoughts, item],
          };
        }),
      toggleReaction: (item) =>
        set((s) => {
          const exists = s.reactions.some(
            (r) =>
              (item.id !== undefined && r.id === item.id) ||
              r.name.toLowerCase() === item.name.toLowerCase()
          );
          return {
            reactions: exists
              ? s.reactions.filter(
                  (r) =>
                    !(
                      (item.id !== undefined && r.id === item.id) ||
                      r.name.toLowerCase() === item.name.toLowerCase()
                    )
                )
              : [...s.reactions, item],
          };
        }),
      toggleBehavior: (item) =>
        set((s) => {
          const exists = s.behaviors.some(
            (b) =>
              (item.id !== undefined && b.id === item.id) ||
              b.content.toLowerCase() === item.content.toLowerCase()
          );
          return {
            behaviors: exists
              ? s.behaviors.filter(
                  (b) =>
                    !(
                      (item.id !== undefined && b.id === item.id) ||
                      b.content.toLowerCase() === item.content.toLowerCase()
                    )
                )
              : [...s.behaviors, item],
          };
        }),
      setBehaviorReport: (text) =>
        set((s) => {
          const chipsOnly = s.behaviors.filter((b) => Boolean(b.icon));
          if (!text.trim()) {
            return { behaviors: chipsOnly };
          }
          return {
            behaviors: [{ content: text, icon: null }, ...chipsOnly],
          };
        }),
      removeEmotions: (ids) =>
        set((s) => ({
          emotions: s.emotions.filter((e) => !e.id || !ids.includes(e.id)),
        })),
      removeThoughts: (ids) =>
        set((s) => ({
          thoughts: s.thoughts.filter((t) => !t.id || !ids.includes(t.id)),
        })),
      removeReactions: (ids) =>
        set((s) => ({
          reactions: s.reactions.filter((r) => !r.id || !ids.includes(r.id)),
        })),
      removeBehaviors: (ids) =>
        set((s) => ({
          behaviors: s.behaviors.filter((b) => !b.id || !ids.includes(b.id)),
        })),
      addImages: (uris) =>
        set((s) => {
          const existing = new Set(s.images);
          const uniqueNew = uris.filter((u) => u && !existing.has(u));
          return { images: [...s.images, ...uniqueNew] };
        }),
      removeImage: (uri) =>
        set((s) => ({
          images: s.images.filter((img) => img !== uri),
        })),
      replaceImage: (oldUri, newUri) =>
        set((s) => ({
          images: s.images.map((img) => (img === oldUri ? newUri : img)),
        })),
      reset: () => set(initialState),
    }),
    {
      name: "new-post-draft",
      storage: createJSONStorage(() => appStorage),
    }
  )
);
