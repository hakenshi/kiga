import { beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod";
import { DatabaseException } from "../../src/lib/exceptions/database/index.exception";
import { BehaviorRepository } from "../../src/repositories/behavior-repository";
import { CategoryRepository } from "../../src/repositories/category-repository";
import { EmotionRepository } from "../../src/repositories/emotion-repository";
import { MoodRepository } from "../../src/repositories/mood-repository";
import { ReactionRepository } from "../../src/repositories/reaction-repository";
import { ThoughtRepository } from "../../src/repositories/thought-repository";
import { resetDatabase } from "../helpers/database";
import { seedUsers } from "../helpers/seed";

let ownerId: number;
let otherId: number;

beforeEach(() => {
  resetDatabase();
  const { owner, other } = seedUsers();
  ownerId = owner.id;
  otherId = other.id;
});

const flatCatalogs = [
  {
    name: "pensamentos",
    create: (name: string, userId: number | null, orderIndex = 0) => ThoughtRepository.create({ name, userId, orderIndex }),
    list: ThoughtRepository.findMany.bind(ThoughtRepository),
    search: ThoughtRepository.search.bind(ThoughtRepository),
    find: ThoughtRepository.findById.bind(ThoughtRepository),
    rename: (id: number) => ThoughtRepository.update(id, { name: "Renomeado" }),
    remove: ThoughtRepository.delete.bind(ThoughtRepository),
  },
  {
    name: "humores",
    create: (name: string, userId: number | null, _orderIndex = 0) => MoodRepository.create({
      name, userId, label: name, icon: "smile", color: "#000", border: "#fff",
    }),
    list: MoodRepository.findMany.bind(MoodRepository),
    search: MoodRepository.search.bind(MoodRepository),
    find: MoodRepository.findById.bind(MoodRepository),
    rename: (id: number) => MoodRepository.update(id, { name: "Renomeado" }),
    remove: MoodRepository.delete.bind(MoodRepository),
  },
];

for (const catalog of flatCatalogs) {
  describe(catalog.name, () => {
    test("lista os itens da conta antes dos padrões, sem dados de outra conta", async () => {
      const standard = catalog.create("Padrão", null);
      const own = catalog.create("Meu item", ownerId);
      catalog.create("Privado", otherId);
      const deleted = catalog.create("Apagado", ownerId);
      await catalog.remove(deleted.id);

      expect((await catalog.list(ownerId)).map(item => item.id)).toEqual([own.id, standard.id]);
      expect(await catalog.find(deleted.id)).toBeUndefined();
      expect(await catalog.find(9999)).toBeUndefined();
    });

    test("busca ignora espaços externos e filtra nome e conta", async () => {
      const match = catalog.create("Caminhada", ownerId);
      catalog.create("Outro", null);
      catalog.create("Caminhada privada", otherId);
      expect((await catalog.search("  CAMINHADA  ", { userId: ownerId })).map(item => item.id)).toEqual([match.id]);
      expect(await catalog.search("inexistente", { userId: ownerId })).toEqual([]);
    });

    test("altera e apaga itens personalizados sem permitir alterações nos padrões", async () => {
      const standard = catalog.create("Padrão", null);
      const own = catalog.create("Personalizado", ownerId);
      expect(catalog.rename(own.id)).toMatchObject({ id: own.id, name: "Renomeado" });
      expect(() => catalog.rename(standard.id)).toThrow(DatabaseException);
      expect(() => catalog.rename(9999)).toThrow(DatabaseException);
      expect(await catalog.remove(standard.id)).toEqual([]);
      expect(await catalog.remove(own.id)).toMatchObject([{ id: own.id, deletedAt: expect.any(Date) }]);
      expect(await catalog.find(own.id)).toBeUndefined();
      expect(await catalog.find(standard.id)).toBeDefined();
    });
  });
}

const groupedCatalogs = [
  {
    name: "emoções",
    type: "emotion" as const,
    create: (name: string, userId: number | null, categoryId: number) => EmotionRepository.create({ name, userId, categoryId }),
    groups: EmotionRepository.search.bind(EmotionRepository),
    list: async (userId: number) => (await EmotionRepository.findMany(userId)).flatMap(group => group.emotions),
    search: async (query: string, userId: number, categoryId?: number) =>
      (await EmotionRepository.search(query, { userId, categoryId })).flatMap(group => group.emotions),
    find: EmotionRepository.findById.bind(EmotionRepository),
    rename: (id: number) => EmotionRepository.update(id, { name: "Renomeado" }),
    remove: EmotionRepository.delete.bind(EmotionRepository),
  },
  {
    name: "reações",
    type: "reaction" as const,
    create: (name: string, userId: number | null, categoryId: number) => ReactionRepository.create({ name, userId, categoryId }),
    groups: ReactionRepository.search.bind(ReactionRepository),
    list: async (userId: number) => (await ReactionRepository.findMany(userId)).flatMap(group => group.reactions),
    search: async (query: string, userId: number, categoryId?: number) =>
      (await ReactionRepository.search(query, { userId, categoryId })).flatMap(group => group.reactions),
    find: ReactionRepository.findById.bind(ReactionRepository),
    rename: (id: number) => ReactionRepository.update(id, { name: "Renomeado" }),
    remove: ReactionRepository.delete.bind(ReactionRepository),
  },
  {
    name: "comportamentos",
    type: "behavior" as const,
    create: (content: string, userId: number | null, categoryId: number) => BehaviorRepository.create({ content, userId, categoryId }),
    groups: BehaviorRepository.search.bind(BehaviorRepository),
    list: async (userId: number) => (await BehaviorRepository.findMany(userId)).flatMap(group => group.behaviors),
    search: async (query: string, userId: number, categoryId?: number) =>
      (await BehaviorRepository.search(query, { userId, categoryId })).flatMap(group => group.behaviors),
    find: BehaviorRepository.findById.bind(BehaviorRepository),
    rename: (id: number) => BehaviorRepository.update(id, { content: "Renomeado" }),
    remove: BehaviorRepository.delete.bind(BehaviorRepository),
  },
];

for (const catalog of groupedCatalogs) {
  describe(catalog.name, () => {
    test("agrupa itens próprios e padrões sem expor itens de outra conta", async () => {
      const ownCategory = CategoryRepository.create({ name: "Minha categoria", type: catalog.type, userId: ownerId });
      const standardCategory = CategoryRepository.create({ name: "Padrão", type: catalog.type });
      const standard = catalog.create("Padrão", null, standardCategory.id);
      const own = catalog.create("Meu item", ownerId, ownCategory.id);
      const inDefault = catalog.create("Personalizado", ownerId, standardCategory.id);
      catalog.create("Privado", otherId, standardCategory.id);
      const removed = catalog.create("Apagado", ownerId, ownCategory.id);
      catalog.remove([removed.id], ownerId);

      expect((await catalog.list(ownerId)).map(item => item.id)).toEqual([own.id, standard.id, inDefault.id]);
      expect(await catalog.find(own.id)).toMatchObject({ category: { id: ownCategory.id } });
      expect(await catalog.find(removed.id)).toBeUndefined();
    });

    test("busca filtra o texto, a categoria e remove grupos vazios", async () => {
      const first = CategoryRepository.create({ name: "Primeira", type: catalog.type });
      const second = CategoryRepository.create({ name: "Segunda", type: catalog.type });
      const match = catalog.create("Caminhada", ownerId, first.id);
      catalog.create("Outra atividade", ownerId, first.id);
      catalog.create("Caminhada", ownerId, second.id);

      expect((await catalog.search("  CAMINHADA  ", ownerId, first.id)).map(item => item.id)).toEqual([match.id]);
      expect(await catalog.groups("inexistente", { userId: ownerId })).toEqual([]);
      expect(await catalog.groups("", { userId: ownerId })).toHaveLength(2);
    });

    test("não lista itens de categorias apagadas", async () => {
      const category = CategoryRepository.create({ name: "Descartar", type: catalog.type, userId: ownerId });
      catalog.create("Item", ownerId, category.id);
      await CategoryRepository.delete(category.id);
      expect(await catalog.list(ownerId)).toEqual([]);
    });

    test("protege padrões e restringe exclusão em lote à conta informada", async () => {
      const category = CategoryRepository.create({ name: "Padrão", type: catalog.type });
      const standard = catalog.create("Padrão", null, category.id);
      const own = catalog.create("Meu", ownerId, category.id);
      const other = catalog.create("Privado", otherId, category.id);
      catalog.rename(own.id);
      expect((await catalog.search("Renomeado", ownerId)).map(item => item.id)).toEqual([own.id]);
      expect(() => catalog.rename(standard.id)).toThrow(DatabaseException);
      expect(() => catalog.rename(9999)).toThrow(DatabaseException);

      expect(catalog.remove([standard.id, own.id, other.id], ownerId)).toMatchObject([{ id: own.id }]);
      expect(await catalog.find(standard.id)).toBeDefined();
      expect(await catalog.find(other.id)).toBeDefined();
      expect(await catalog.find(own.id)).toBeUndefined();
      expect(catalog.remove([], ownerId)).toEqual([]);
    });
  });
}

describe("categorias", () => {
  test("filtra por conta e tipo, com itens próprios antes dos padrões", async () => {
    const standard = CategoryRepository.create({ name: "Padrão", type: "emotion" });
    const own = CategoryRepository.create({ name: "Minha", type: "emotion", userId: ownerId });
    CategoryRepository.create({ name: "Privada", type: "emotion", userId: otherId });
    CategoryRepository.create({ name: "Outro tipo", type: "behavior" });
    expect((await CategoryRepository.findMany(ownerId, "emotion")).map(item => item.id)).toEqual([own.id, standard.id]);
    expect(await CategoryRepository.findMany(ownerId)).toHaveLength(3);
  });

  test("ordena categorias por orderIndex e depois por ID", async () => {
    const last = CategoryRepository.create({ name: "Última", type: "emotion", userId: ownerId, orderIndex: 10 });
    const first = CategoryRepository.create({ name: "Primeira", type: "emotion", userId: ownerId, orderIndex: 1 });
    const second = CategoryRepository.create({ name: "Segunda", type: "emotion", userId: ownerId, orderIndex: 1 });
    expect((await CategoryRepository.findMany(ownerId)).map(item => item.id)).toEqual([first.id, second.id, last.id]);
  });

  test("normaliza o nome e rejeita categoria sem nome", () => {
    expect(CategoryRepository.create({ name: "  Pessoal  ", type: "emotion", userId: ownerId }).name).toBe("Pessoal");
    expect(() => CategoryRepository.create({ name: "  ", type: "emotion" })).toThrow(z.ZodError);
    expect(() => ThoughtRepository.create({ name: "  ", userId: ownerId })).toThrow(z.ZodError);
  });

  test("busca por nome sem incluir categorias apagadas", async () => {
    const own = CategoryRepository.create({ name: "Alegria", type: "emotion", userId: ownerId });
    const deleted = CategoryRepository.create({ name: "Alegria antiga", type: "emotion", userId: ownerId });
    await CategoryRepository.delete(deleted.id);
    expect((await CategoryRepository.search("  ALEGRIA  ", { userId: ownerId })).map(item => item.id)).toEqual([own.id]);
    expect(await CategoryRepository.findById(deleted.id)).toBeUndefined();
  });

  test("permite alterar e excluir personalizadas, mas protege as categorias padrão", async () => {
    const own = CategoryRepository.create({ name: "Minha", type: "emotion", userId: ownerId });
    const standard = CategoryRepository.create({ name: "Padrão", type: "emotion" });
    expect(CategoryRepository.update(own.id, { name: "Nova" }).name).toBe("Nova");
    expect(() => CategoryRepository.update(standard.id, { name: "Nova" })).toThrow(DatabaseException);
    expect(() => CategoryRepository.update(9999, { name: "Nova" })).toThrow(DatabaseException);
    expect(await CategoryRepository.delete(standard.id)).toEqual([]);
    expect(await CategoryRepository.delete(own.id)).toMatchObject([{ id: own.id, deletedAt: expect.any(Date) }]);
    expect(await CategoryRepository.findById(own.id)).toBeUndefined();
  });
});
