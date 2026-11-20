import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { readInitialData } from "@/lib/query-client";
import { noteKeys } from "@/queries/notes/queries";
import { emotionsAPI } from "./api";
import type { EmotionsResponse } from "./types";

export function hasEmotion(emotions: EmotionsResponse, name: string) {
  const value = name.trim().toLowerCase();
  return emotions.some(category => category.emotions.some(emotion => emotion.name.toLowerCase() === value));
}

export const emotionKeys = {
  all: (userId: number) => ["emotions", userId] as const,
  list: (userId: number, query: string, categoryId?: number) =>
    [...emotionKeys.all(userId), "list", { query: query.trim(), categoryId }] as const,
};

export const emotionQueries = {
  list: (userId: number, query = "", categoryId?: number) => queryOptions({
    queryKey: emotionKeys.list(userId, query, categoryId),
    queryFn: () => emotionsAPI.getEmotions(userId, query, categoryId),
    initialData: () => readInitialData(() => emotionsAPI.getEmotions(userId, query, categoryId)),
  }),
};

export const emotionMutations = {
  remove: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (ids: number[]) => emotionsAPI.deleteEmotions(userId, ids),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: emotionKeys.all(userId) }),
      client.invalidateQueries({ queryKey: noteKeys.all(userId) }),
    ]),
  }),
};
