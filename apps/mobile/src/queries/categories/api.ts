import type { CategoryType } from "@/lib/db/schema";
import { CategoryRepository } from "@/repositories/category-repository";
import type { CategoriesResponse, CreateCategoryResponse, DeleteCategoryResponse } from "./types";

export const categoriesAPI = {
  getCategories: (userId: number, query: string, type?: CategoryType): CategoriesResponse =>
    CategoryRepository.search(query, { userId, type }),
  createCategory: (userId: number, data: CategoryInsert): CreateCategoryResponse =>
    CategoryRepository.create({ ...data, userId }),
  deleteCategory: (categoryId: number): Promise<DeleteCategoryResponse> =>
    CategoryRepository.delete(categoryId),
};
