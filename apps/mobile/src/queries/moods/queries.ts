import { queryOptions } from "@tanstack/react-query";
import { readInitialData } from "@/lib/query-client";
import { moodsAPI } from "./api";

export const moodKeys = {
  all: (userId: number) => ["moods", userId] as const,
  list: (userId: number, query: string) => [...moodKeys.all(userId), "list", query.trim()] as const,
};

export const moodQueries = {
  list: (userId: number, query = "") => queryOptions({
    queryKey: moodKeys.list(userId, query),
    queryFn: () => moodsAPI.getMoods(userId, query),
    initialData: () => readInitialData(() => moodsAPI.getMoods(userId, query)),
  }),
};
