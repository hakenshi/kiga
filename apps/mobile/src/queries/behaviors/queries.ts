import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { readInitialData } from "@/lib/query-client";
import { noteKeys } from "@/queries/notes/queries";
import { behaviorsAPI } from "./api";

export const behaviorKeys = {
  all: (userId: number) => ["behaviors", userId] as const,
  list: (userId: number, query: string, categoryId?: number) =>
    [...behaviorKeys.all(userId), "list", { query: query.trim(), categoryId }] as const,
};

export const behaviorQueries = {
  list: (userId: number, query = "", categoryId?: number) => queryOptions({
    queryKey: behaviorKeys.list(userId, query, categoryId),
    queryFn: () => behaviorsAPI.getBehaviors(userId, query, categoryId),
    initialData: () => readInitialData(() => behaviorsAPI.getBehaviors(userId, query, categoryId)),
  }),
};

export const behaviorMutations = {
  remove: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (ids: number[]) => behaviorsAPI.deleteBehaviors(userId, ids),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: behaviorKeys.all(userId) }),
      client.invalidateQueries({ queryKey: noteKeys.all(userId) }),
    ]),
  }),
};
