import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { readInitialData } from "@/lib/query-client";
import { thoughtsAPI } from "./api";

export const thoughtKeys = {
  all: (userId: number) => ["thoughts", userId] as const,
  list: (userId: number, query: string) => [...thoughtKeys.all(userId), "list", query.trim()] as const,
};

export const thoughtQueries = {
  list: (userId: number, query = "") => queryOptions({
    queryKey: thoughtKeys.list(userId, query),
    queryFn: () => thoughtsAPI.getThoughts(userId, query),
    initialData: () => readInitialData(() => thoughtsAPI.getThoughts(userId, query)),
  }),
};

export const thoughtMutations = {
  create: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (data: ThoughtInsert) => thoughtsAPI.createThought(userId, data),
    onSuccess: () => client.invalidateQueries({ queryKey: thoughtKeys.all(userId) }),
  }),
};
