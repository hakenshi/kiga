import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { readInitialData } from "@/lib/query-client";
import { noteKeys } from "@/queries/notes/queries";
import { reactionsAPI } from "./api";

export const reactionKeys = {
  all: (userId: number) => ["reactions", userId] as const,
  list: (userId: number, query: string, categoryId?: number) =>
    [...reactionKeys.all(userId), "list", { query: query.trim(), categoryId }] as const,
};

export const reactionQueries = {
  list: (userId: number, query = "", categoryId?: number) => queryOptions({
    queryKey: reactionKeys.list(userId, query, categoryId),
    queryFn: () => reactionsAPI.getReactions(userId, query, categoryId),
    initialData: () => readInitialData(() => reactionsAPI.getReactions(userId, query, categoryId)),
  }),
};

export const reactionMutations = {
  remove: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (ids: number[]) => reactionsAPI.deleteReactions(userId, ids),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: reactionKeys.all(userId) }),
      client.invalidateQueries({ queryKey: noteKeys.all(userId) }),
    ]),
  }),
};
