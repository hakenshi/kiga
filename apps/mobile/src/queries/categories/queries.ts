import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import type { CategoryType } from "@/lib/db/schema";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";
import { readInitialData } from "@/lib/query-client";
import { behaviorKeys } from "@/queries/behaviors/queries";
import { emotionKeys } from "@/queries/emotions/queries";
import { reactionKeys } from "@/queries/reactions/queries";
import { categoriesAPI } from "./api";

export const categoryKeys = {
  all: (userId: number) => ["categories", userId] as const,
  list: (userId: number, query: string, type?: CategoryType) =>
    [...categoryKeys.all(userId), "list", { query: query.trim(), type }] as const,
};

export const categoryQueries = {
  list: (userId: number, query = "", type?: CategoryType) => queryOptions({
    queryKey: categoryKeys.list(userId, query, type),
    queryFn: () => categoriesAPI.getCategories(userId, query, type),
    initialData: () => readInitialData(() => categoriesAPI.getCategories(userId, query, type)),
  }),
};

function invalidateCategories(client: QueryClient, userId: number) {
  return Promise.all([
    client.invalidateQueries({ queryKey: categoryKeys.all(userId) }),
    client.invalidateQueries({ queryKey: emotionKeys.all(userId) }),
    client.invalidateQueries({ queryKey: reactionKeys.all(userId) }),
    client.invalidateQueries({ queryKey: behaviorKeys.all(userId) }),
  ]);
}

export const categoryMutations = {
  create: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (data: CategoryInsert) => categoriesAPI.createCategory(userId, data),
    onSuccess: () => invalidateCategories(client, userId),
  }),
  remove: (client: QueryClient, userId: number) => mutationOptions({
    mutationFn: async (categoryId: number) => {
      const [category] = await categoriesAPI.deleteCategory(categoryId);
      if (!category) throw new NotFoundException("Não foi possível excluir a categoria.");
      return category;
    },
    onSuccess: () => invalidateCategories(client, userId),
  }),
};
