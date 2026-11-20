import type { CategoryRepository } from "@/repositories/category-repository";

export type CategoriesResponse = ReturnType<typeof CategoryRepository.search>;
export type CreateCategoryResponse = ReturnType<typeof CategoryRepository.create>;
export type DeleteCategoryResponse = Awaited<ReturnType<typeof CategoryRepository.delete>>;
