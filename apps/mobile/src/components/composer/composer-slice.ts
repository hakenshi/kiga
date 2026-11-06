import { create, type StateCreator, type StoreApi, type UseBoundStore } from "zustand";

/**
 * Estado e ações comuns a qualquer tela que escreve um registro
 * (novo post, edição, resposta, republicação).
 *
 * Cada fluxo tem a sua própria store (`useNewPostStore`, `useEditPostStore`...),
 * mas todas compartilham este formato para que os componentes do `Composer`
 * funcionem com qualquer uma delas.
 */
export type ComposerState = {
  entryDate: Date;
  isSaving: boolean;
  content: string;
  moodId: number | null;
  emotions: EntryEmotionItem[];
  thoughts: EntryThoughtItem[];
  reactions: EntryReactionItem[];
  behaviors: EntryBehaviorItem[];
  images: string[];
};

export type ComposerActions = {
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

export type ComposerSlice = ComposerState & ComposerActions;

/** Qualquer store do Zustand que contenha o slice do composer. */
export type ComposerStore = UseBoundStore<StoreApi<ComposerSlice>>;

export const composerInitialState = (): ComposerState => ({
  entryDate: new Date(),
  isSaving: false,
  content: "",
  moodId: null,
  emotions: [],
  thoughts: [],
  reactions: [],
  behaviors: [],
  images: [],
});

const sameNamed = (a: { id?: number; name: string }, b: { id?: number; name: string }) =>
  (b.id !== undefined && a.id === b.id) || a.name.toLowerCase() === b.name.toLowerCase();

const sameBehavior = (a: EntryBehaviorItem, b: EntryBehaviorItem) =>
  (b.id !== undefined && a.id === b.id) || a.content.toLowerCase() === b.content.toLowerCase();

function toggle<T>(list: T[], item: T, eq: (a: T, b: T) => boolean): T[] {
  return list.some((x) => eq(x, item)) ? list.filter((x) => !eq(x, item)) : [...list, item];
}

const withoutIds = <T extends { id?: number }>(list: T[], ids: number[]) =>
  list.filter((x) => !x.id || !ids.includes(x.id));

/**
 * Slice reutilizável. `extraReset` permite que a store do fluxo
 * zere também os campos que só ela tem (ex.: `editingEntryId`).
 */
export const createComposerSlice =
  <S extends ComposerSlice>(extraReset: () => Partial<S> = () => ({})): StateCreator<S, [], [], ComposerSlice> =>
  (set) => ({
    ...composerInitialState(),
    setContent: (content) => set({ content } as Partial<S>),
    setMoodId: (moodId) => set({ moodId } as Partial<S>),
    toggleEmotion: (item) => set((s) => ({ emotions: toggle(s.emotions, item, sameNamed) }) as Partial<S>),
    toggleThought: (item) => set((s) => ({ thoughts: toggle(s.thoughts, item, sameNamed) }) as Partial<S>),
    toggleReaction: (item) => set((s) => ({ reactions: toggle(s.reactions, item, sameNamed) }) as Partial<S>),
    toggleBehavior: (item) => set((s) => ({ behaviors: toggle(s.behaviors, item, sameBehavior) }) as Partial<S>),
    setBehaviorReport: (text) =>
      set((s) => {
        const chipsOnly = s.behaviors.filter((b) => Boolean(b.icon));
        return {
          behaviors: text.trim() ? [{ content: text, icon: null }, ...chipsOnly] : chipsOnly,
        } as Partial<S>;
      }),
    removeEmotions: (ids) => set((s) => ({ emotions: withoutIds(s.emotions, ids) }) as Partial<S>),
    removeThoughts: (ids) => set((s) => ({ thoughts: withoutIds(s.thoughts, ids) }) as Partial<S>),
    removeReactions: (ids) => set((s) => ({ reactions: withoutIds(s.reactions, ids) }) as Partial<S>),
    removeBehaviors: (ids) => set((s) => ({ behaviors: withoutIds(s.behaviors, ids) }) as Partial<S>),
    addImages: (uris) =>
      set((s) => {
        const existing = new Set(s.images);
        return { images: [...s.images, ...uris.filter((u) => u && !existing.has(u))] } as Partial<S>;
      }),
    removeImage: (uri) => set((s) => ({ images: s.images.filter((img) => img !== uri) }) as Partial<S>),
    replaceImage: (oldUri, newUri) =>
      set((s) => ({ images: s.images.map((img) => (img === oldUri ? newUri : img)) }) as Partial<S>),
    reset: () => set({ ...composerInitialState(), ...extraReset() } as Partial<S>),
  });

/** Converte um registro do banco para o formato do composer (usado em edição). */
export function entryToComposerState(entry: JournalEntryWithRelations): Partial<ComposerState> {
  return {
    entryDate: entry.date ? new Date(entry.date) : new Date(),
    content: entry.content ?? "",
    moodId: entry.moodId ?? null,
    emotions:
      entry.entryEmotions?.map((ee) => ({ id: ee.emotion?.id ?? ee.emotionId, name: ee.emotion?.name ?? "" })) ?? [],
    thoughts:
      entry.entryThoughts?.map((et) => ({ id: et.thought?.id ?? et.thoughtsId, name: et.thought?.name ?? "" })) ?? [],
    reactions:
      entry.entryReactions?.map((er) => ({ id: er.reaction?.id ?? er.reactionId, name: er.reaction?.name ?? "" })) ??
      [],
    behaviors:
      entry.entryBehaviors?.map((eb) => ({
        id: eb.behavior?.id ?? eb.behaviorId,
        content: eb.behavior?.content ?? "",
        icon: eb.behavior?.icon ?? null,
      })) ?? [],
    images: entry.entryImages?.map((img) => img.imageUrl) ?? [],
  };
}

export const useComposerDraftStore = create<ComposerSlice>()((set, get, api) => ({
  ...createComposerSlice<ComposerSlice>()(set, get, api),
}));
