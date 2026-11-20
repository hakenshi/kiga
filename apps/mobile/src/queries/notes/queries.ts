import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
  useInfiniteQuery,
  useMutationState,
  useQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";
import { noteInsertSchema, noteUpdateSchema } from "@/lib/db/zod/schemas/note/index.schema";
import { ForbiddenException } from "@/lib/exceptions/forbidden/index.exception";
import { ValidationException } from "@/lib/exceptions/validation/index.exception";
import { readInitialData } from "@/lib/query-client";
import { resolveMoodConfig } from "@/lib/mood-utils";
import { formatNoteDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEditNoteCacheStore } from "@/stores/edit-note-cache-store";
import { useNewNoteCacheStore } from "@/stores/new-note-cache-store";
import { useReplyNoteCacheStore } from "@/stores/reply-note-cache-store";
import { useRepostNoteCacheStore } from "@/stores/repost-note-cache-store";
import { useToastStore } from "@/stores/toast-store";
import type { NoteDateRange } from "@/repositories/note-repository";
import { notesAPI } from "./api";
import type { NotesResponse } from "./types";

const NOTE_PAGE_SIZE = 20;
const DELETE_UNDO_DURATION = 4500;
const emptyNotes: NotesResponse = [];

export const noteKeys = {
  all: (userId: number) => ["notes", userId] as const,
  feed: (userId: number, dateRange?: NoteDateRange) => [
    ...noteKeys.all(userId),
    "feed",
    dateRange?.start.getTime() ?? null,
    dateRange?.end.getTime() ?? null,
  ] as const,
  search: (userId: number, query: string, dateRange?: NoteDateRange) => [
    ...noteKeys.all(userId),
    "search",
    query.trim(),
    dateRange?.start.getTime() ?? null,
    dateRange?.end.getTime() ?? null,
  ] as const,
  detail: (userId: number, noteId: number) => [...noteKeys.all(userId), "detail", noteId] as const,
  remove: (userId: number) => [...noteKeys.all(userId), "remove"] as const,
};

export function flattenNotePages(data: InfiniteData<NotesResponse, number>) {
  return data.pages.flat();
}

export function visibleNotes(notes: NotesResponse, deletedIds: number[]) {
  return notes.filter(note => !deletedIds.includes(note.id));
}

export function getNoteBody(note: Note) {
  const behaviors = note.noteBehaviors.map(item => item.behavior);
  return {
    images: note.noteImages,
    behaviors: behaviors.filter(behavior => Boolean(behavior.icon)),
    reports: behaviors.filter((behavior): behavior is Behavior & { content: string } =>
      !behavior.icon && behavior.content !== null && behavior.content.trim().length > 0
    ),
  };
}

export function getComposerContext(note: Note, user: User | null) {
  return {
    note,
    userName: user ? `${user.firstName} ${user.secondName}`.trim() : "",
    formattedDate: formatNoteDate(note.date),
    mood: resolveMoodConfig(note),
    thoughts: note.noteThoughts.map(({ thought }) => thought),
    emotions: note.noteEmotions.map(({ emotion }) => emotion),
  };
}

export const noteQueries = {
  feed: (userId: number, dateRange?: NoteDateRange) => infiniteQueryOptions({
    queryKey: noteKeys.feed(userId, dateRange),
    queryFn: ({ pageParam }) => notesAPI.getNotes(userId, { limit: NOTE_PAGE_SIZE, offset: pageParam, dateRange }),
    initialPageParam: 0,
    initialData: () => readInitialData(() => ({
      pages: [notesAPI.getNotes(userId, { limit: NOTE_PAGE_SIZE, offset: 0, dateRange })],
      pageParams: [0],
    })),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === NOTE_PAGE_SIZE ? lastPageParam + NOTE_PAGE_SIZE : undefined,
    select: flattenNotePages,
  }),
  search: (userId: number, query: string, dateRange?: NoteDateRange) => queryOptions({
    queryKey: noteKeys.search(userId, query, dateRange),
    queryFn: () => notesAPI.searchNotes(userId, query, dateRange),
    initialData: () => readInitialData(() => notesAPI.searchNotes(userId, query, dateRange)),
  }),
  detail: (userId: number, noteId: string | number) => {
    const id = Number(noteId);
    const valid = Number.isInteger(id) && id > 0;
    const read = () => {
      const note = valid ? notesAPI.getNote(id) : undefined;
      return note?.userId === userId ? note : null;
    };
    return queryOptions({
      queryKey: noteKeys.detail(userId, id),
      enabled: valid,
      queryFn: read,
      initialData: () => readInitialData(read),
    });
  },
};

function useDeletedNoteIds(userId: number) {
  return useMutationState({
    filters: { mutationKey: noteKeys.remove(userId), status: "pending" },
    select: mutation => z.number().parse(mutation.state.variables),
  });
}

export function useNotes(query: string, dateRange?: NoteDateRange) {
  const userId = useAuthStore.getState().user?.id as number
  const isSearching = query.trim() !== "";
  const feed = useInfiniteQuery({ ...noteQueries.feed(userId, dateRange), enabled: !isSearching });
  const search = useQuery({ ...noteQueries.search(userId, query, dateRange), enabled: isSearching });
  const deletedIds = useDeletedNoteIds(userId);
  const data = (isSearching ? search.data : feed.data) ?? emptyNotes;
  const notes = useMemo(() => visibleNotes(data, deletedIds), [data, deletedIds]);

  return {
    notes,
    isSearching,
    loadMore: () => {
      if (!isSearching && feed.hasNextPage && !feed.isFetching) void feed.fetchNextPage();
    },
  };
}

export function useViewedNote(userId: number, noteId: string | number) {
  const { data } = useQuery(noteQueries.detail(userId, noteId));
  const deletedIds = useDeletedNoteIds(userId);
  return { note: data && !deletedIds.includes(data.id) ? data : null };
}

export function useComposerNote(userId: number, noteId: string) {
  const { note } = useViewedNote(userId, noteId);
  const user = useAuthStore(state => state.user);
  return { context: note ? getComposerContext(note, user) : null };
}

export async function loadEditNote(client: QueryClient, userId: number, noteId: number) {
  try {
    const note = await client.fetchQuery(noteQueries.detail(userId, noteId));
    if (!note) return false;
    useEditNoteCacheStore.getState().load(note);
    return true;
  } catch {
    return false;
  }
}

const noteIdSchema = z.coerce.number().int().positive("Informe a nota que está sendo respondida.");

function requireSession(userId: number) {
  if (useAuthStore.getState().user?.id !== userId) {
    throw new ForbiddenException("A sessão não está mais disponível.");
  }
}

export const noteMutations = {
  create: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (data: NoteInsert) => {
      requireSession(userId);
      return notesAPI.createNote({ ...data, userId });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: noteKeys.all(userId) }),
  }),
  update: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async ({ noteId, data }: { noteId: number; data: NoteUpdate }) => {
      requireSession(userId);
      return notesAPI.updateNote(noteId, data);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: noteKeys.all(userId) }),
  }),
  createDraft: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async () => {
      requireSession(userId);
      const draft = useNewNoteCacheStore.getState();
      if (!draft.revalidate()) throw new ValidationException("O rascunho não está mais disponível.");
      const data = noteInsertSchema.parse({ ...draft.note, userId, noteType: "note" });
      return notesAPI.createNote(data);
    },
    onSuccess: async () => {
      useNewNoteCacheStore.getState().clear();
      await client.invalidateQueries({ queryKey: noteKeys.all(userId) });
    },
  }),
  updateDraft: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async () => {
      requireSession(userId);
      const draft = useEditNoteCacheStore.getState();
      if (!draft.revalidate()) throw new ValidationException("O rascunho não está mais disponível.");
      const data = noteUpdateSchema.parse(draft.note);
      if (!data.id) throw new ValidationException("Informe a nota que está sendo editada.");
      return notesAPI.updateNote(data.id, data);
    },
    onSuccess: async () => {
      useEditNoteCacheStore.getState().clear();
      await client.invalidateQueries({ queryKey: noteKeys.all(userId) });
    },
  }),
  replyDraft: (client: QueryClient, userId: number, noteId: string) => mutationOptions({
    mutationFn: async () => {
      requireSession(userId);
      const id = noteIdSchema.parse(noteId);
      const draft = useReplyNoteCacheStore.getState();
      if (!draft.revalidate()) throw new ValidationException("O rascunho não está mais disponível.");
      const data = noteInsertSchema.parse({ ...draft.note, userId, noteType: "reply" });
      return notesAPI.createReply(id, data).note;
    },
    onSuccess: async () => {
      useReplyNoteCacheStore.getState().clear();
      await client.invalidateQueries({ queryKey: noteKeys.all(userId) });
    },
  }),
  repostDraft: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async () => {
      requireSession(userId);
      const draft = useRepostNoteCacheStore.getState();
      if (!draft.revalidate()) throw new ValidationException("O rascunho não está mais disponível.");
      const data = noteInsertSchema.parse({ ...draft.note, userId, noteType: "repost" });
      return notesAPI.createNote(data);
    },
    onSuccess: async () => {
      useRepostNoteCacheStore.getState().clear();
      await client.invalidateQueries({ queryKey: noteKeys.all(userId) });
    },
  }),
  revisit: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (note: Note) => {
      requireSession(userId);
      return notesAPI.createNote({
        userId,
        noteType: "repost",
        content: note.content,
        moodId: note.moodId,
        noteBehaviors: note.noteBehaviors.map(item => item.behaviorId),
        noteEmotions: note.noteEmotions.map(item => item.emotionId),
        noteImages: note.noteImages.map(item => item.imageUrl),
        noteReactions: note.noteReactions.map(item => item.reactionId),
        noteThoughts: note.noteThoughts.map(item => item.thoughtsId),
      });
    },
    onSuccess: async () => {
      useToastStore.getState().showInfo("Nota revisitada.");
      await client.invalidateQueries({ queryKey: noteKeys.all(userId) });
    },
  }),
  remove: (client: QueryClient, userId: number) => mutationOptions({
    mutationKey: noteKeys.remove(userId),
    mutationFn: (noteId: number) => {
      requireSession(userId);
      return new Promise<{ undone: boolean }>((resolve, reject) => {
        let waiting = true;
        const timer = setTimeout(() => {
          waiting = false;
          notesAPI.deleteNote(noteId).then(() => resolve({ undone: false }), reject);
        }, DELETE_UNDO_DURATION);
        useToastStore.getState().showAction("Nota excluída.", "Desfazer", () => {
          if (!waiting) return;
          waiting = false;
          clearTimeout(timer);
          resolve({ undone: true });
        }, DELETE_UNDO_DURATION);
      });
    },
    onSuccess: async ({ undone }) => {
      if (!undone) await client.invalidateQueries({ queryKey: noteKeys.all(userId) });
    },
  }),
};
