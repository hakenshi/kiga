import { create } from "zustand";
import type { CategoryType } from "@/lib/db/schema";
import { CategoryRepository } from "@/repositories/category-repository";
import type { CategoryFilterOptions } from "@/repositories/category-repository";
import { useToastStore } from "@/stores/toast-store";

type Categories = Awaited<ReturnType<typeof CategoryRepository.findMany>>;

interface CategoryState {
  categories: Categories;
  addCategory: (data: CategoryInsert) => Promise<Category | undefined>;
  deleteCategory: (categoryId: number) => Promise<boolean>;
  loadCategories: (userId: number, type?: CategoryType) => Promise<void>;
  searchCategories: (query: string, filters: CategoryFilterOptions) => Promise<void>;
  updateCategories: (categories: Categories) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  updateCategories: (categories) => set({ categories }),
  addCategory: async (data) => {
    try {
      const category = CategoryRepository.create(data);
      const categories = await CategoryRepository.findMany(category.userId!, category.type);
      set({ categories });
      return category;
    } catch (error) {
      useToastStore.getState().showError("Falha ao criar categoria.", error);
    }
  },
  deleteCategory: async (categoryId) => {
    try {
      const [category] = await CategoryRepository.delete(categoryId);
      if (!category) {
        useToastStore.getState().showError("Não foi possível excluir a categoria.");
        return false;
      }
      const categories = await CategoryRepository.findMany(category.userId!, category.type);
      set({ categories });
      return true;
    } catch (error) {
      useToastStore.getState().showError("Falha ao excluir categoria.", error);
      return false;
    }
  },
  loadCategories: async (userId, type) => {
    try {
      const categories = await CategoryRepository.findMany(userId, type);
      set({ categories });
    } catch (error) {
      useToastStore.getState().showError("Falha ao carregar categorias.", error);
    }
  },
  searchCategories: async (query, filters) => {
    try {
      const categories = await CategoryRepository.search(query, filters);
      set({ categories });
    } catch (error) {
      useToastStore.getState().showError("Falha ao buscar categorias.", error);
    }
  },
}));
