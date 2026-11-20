import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { MutationObserver, QueryObserver, type QueryClient } from "@tanstack/react-query";
import { createQueryClient } from "../../src/lib/query-client";
import { behaviorKeys, behaviorMutations, behaviorQueries } from "../../src/queries/behaviors/queries";
import { categoryKeys, categoryMutations, categoryQueries } from "../../src/queries/categories/queries";
import { emotionKeys, emotionMutations, emotionQueries, hasEmotion } from "../../src/queries/emotions/queries";
import { moodKeys, moodQueries } from "../../src/queries/moods/queries";
import { reactionKeys, reactionMutations, reactionQueries } from "../../src/queries/reactions/queries";
import { thoughtKeys, thoughtMutations, thoughtQueries } from "../../src/queries/thoughts/queries";
import { BehaviorRepository } from "../../src/repositories/behavior-repository";
import { CategoryRepository } from "../../src/repositories/category-repository";
import { EmotionRepository } from "../../src/repositories/emotion-repository";
import { MoodRepository } from "../../src/repositories/mood-repository";
import { ReactionRepository } from "../../src/repositories/reaction-repository";
import { ThoughtRepository } from "../../src/repositories/thought-repository";
import { useToastStore } from "../../src/stores/toast-store";
import { resetDatabase } from "../helpers/database";
import { seedUsers } from "../helpers/seed";

let client: QueryClient;
let ownerId: number;
const subscriptions: (() => void)[] = [];

beforeEach(() => {
  resetDatabase();
  ownerId = seedUsers().owner.id;
  client = createQueryClient();
});

afterEach(() => {
  subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
  client.clear();
  useToastStore.getState().dismiss();
  mock.restore();
});

const catalogs = [
  {
    name: "pensamentos",
    key: thoughtKeys.all,
    create: (name: string) => ThoughtRepository.create({ name, userId: ownerId }),
    load: (query = "") => client.fetchQuery(thoughtQueries.list(ownerId, query)),
    fail: () => spyOn(ThoughtRepository, "search").mockImplementationOnce(() => { throw new Error("Falha SQLite"); }),
  },
  {
    name: "humores",
    key: moodKeys.all,
    create: (name: string) => MoodRepository.create({ name, label: name, userId: ownerId, icon: "smile", color: "#000", border: "#fff" }),
    load: (query = "") => client.fetchQuery(moodQueries.list(ownerId, query)),
    fail: () => spyOn(MoodRepository, "search").mockImplementationOnce(() => { throw new Error("Falha SQLite"); }),
  },
  {
    name: "categorias",
    key: categoryKeys.all,
    create: (name: string) => CategoryRepository.create({ name, type: "emotion", userId: ownerId }),
    load: (query = "") => client.fetchQuery(categoryQueries.list(ownerId, query)),
    fail: () => spyOn(CategoryRepository, "search").mockImplementationOnce(() => { throw new Error("Falha SQLite"); }),
  },
  {
    name: "emoções",
    key: emotionKeys.all,
    create: (name: string) => {
      const category = CategoryRepository.create({ name, type: "emotion", userId: ownerId });
      return EmotionRepository.create({ name, categoryId: category.id, userId: ownerId });
    },
    load: async (query = "") => (await client.fetchQuery(emotionQueries.list(ownerId, query))).flatMap(category => category.emotions),
    fail: () => spyOn(EmotionRepository, "search").mockImplementationOnce(() => { throw new Error("Falha SQLite"); }),
  },
  {
    name: "reações",
    key: reactionKeys.all,
    create: (name: string) => {
      const category = CategoryRepository.create({ name, type: "reaction", userId: ownerId });
      return ReactionRepository.create({ name, categoryId: category.id, userId: ownerId });
    },
    load: async (query = "") => (await client.fetchQuery(reactionQueries.list(ownerId, query))).flatMap(category => category.reactions),
    fail: () => spyOn(ReactionRepository, "search").mockImplementationOnce(() => { throw new Error("Falha SQLite"); }),
  },
  {
    name: "comportamentos",
    key: behaviorKeys.all,
    create: (name: string) => {
      const category = CategoryRepository.create({ name, type: "behavior", userId: ownerId });
      return BehaviorRepository.create({ content: name, categoryId: category.id, userId: ownerId });
    },
    load: async (query = "") => (await client.fetchQuery(behaviorQueries.list(ownerId, query))).flatMap(category => category.behaviors),
    fail: () => spyOn(BehaviorRepository, "search").mockImplementationOnce(() => { throw new Error("Falha SQLite"); }),
  },
];

for (const catalog of catalogs) {
  describe(`cache de ${catalog.name}`, () => {
    test("separa listagem e buscas e normaliza espaços na chave", async () => {
      const first = catalog.create("Primeiro");
      const second = catalog.create("Segundo");
      expect((await catalog.load()).map(item => item.id)).toEqual([first.id, second.id]);
      expect((await catalog.load("  Segundo  ")).map(item => item.id)).toEqual([second.id]);
      expect((await catalog.load("Segundo")).map(item => item.id)).toEqual([second.id]);
      expect(await catalog.load("inexistente")).toEqual([]);
    });

    test("reutiliza dados válidos sem fazer uma nova consulta", async () => {
      catalog.create("Persistido");
      const first = await catalog.load();
      const find = catalog.fail();
      expect(await catalog.load()).toEqual(first);
      expect(find).not.toHaveBeenCalled();
    });

    test("preserva o cache anterior e apresenta falha de uma revalidação", async () => {
      catalog.create("Preservar");
      await catalog.load();
      const snapshots = client.getQueriesData({ queryKey: catalog.key(ownerId) });
      await client.invalidateQueries({ queryKey: catalog.key(ownerId) });
      catalog.fail();
      await expect(catalog.load()).rejects.toThrow("Falha SQLite");
      expect(client.getQueriesData({ queryKey: catalog.key(ownerId) })).toEqual(snapshots);
      expect(useToastStore.getState().currentToast?.type).toBe("error");
    });
  });
}

describe("filtros e mutations dos catálogos", () => {
  test("reconhece emoções pelo nome completo sem diferenciar maiúsculas ou espaços externos", async () => {
    const category = CategoryRepository.create({ name: "Pessoal", type: "emotion", userId: ownerId });
    EmotionRepository.create({ name: "Alívio", categoryId: category.id, userId: ownerId });
    const emotions = await client.fetchQuery(emotionQueries.list(ownerId));

    expect(hasEmotion(emotions, "  ALÍVIO  ")).toBe(true);
    expect(hasEmotion(emotions, "Alí")).toBe(false);
    expect(hasEmotion([], "Alívio")).toBe(false);
  });

  test("catálogos locais já estão disponíveis no primeiro snapshot sem cache", () => {
    const created = ThoughtRepository.create({ name: "Disponível agora", userId: ownerId });
    const observer = new QueryObserver(client, thoughtQueries.list(ownerId));
    expect(observer.getCurrentResult().data).toEqual([created]);
    expect(observer.getCurrentResult().isPending).toBe(false);
  });

  test("inclui tipo e categoria nos identificadores das consultas", () => {
    expect(categoryQueries.list(ownerId, "", "emotion").queryKey)
      .not.toEqual(categoryQueries.list(ownerId, "", "behavior").queryKey);
    expect(emotionQueries.list(ownerId, "", 1).queryKey).not.toEqual(emotionQueries.list(ownerId, "", 2).queryKey);
    expect(reactionQueries.list(ownerId, "", 1).queryKey).not.toEqual(reactionQueries.list(ownerId, "", 2).queryKey);
    expect(behaviorQueries.list(ownerId, "", 1).queryKey).not.toEqual(behaviorQueries.list(ownerId, "", 2).queryKey);
  });

  test("criar uma categoria invalida também os catálogos agrupados", async () => {
    const categories = categoryQueries.list(ownerId, "", "emotion");
    const emotions = emotionQueries.list(ownerId);
    const reactions = reactionQueries.list(ownerId);
    const behaviors = behaviorQueries.list(ownerId);
    await Promise.all([
      client.fetchQuery(categories), client.fetchQuery(emotions),
      client.fetchQuery(reactions), client.fetchQuery(behaviors),
    ]);
    const created = await new MutationObserver(client, categoryMutations.create(client, ownerId))
      .mutate({ name: "Minha", type: "emotion" });
    expect(client.getQueryState(categories.queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(emotions.queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(reactions.queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(behaviors.queryKey)?.isInvalidated).toBe(true);
    expect(await client.fetchQuery(categories)).toMatchObject([{ id: created.id, userId: ownerId }]);
  });

  test("excluir uma categoria atualiza consultas ativas sem chamadas manuais da view", async () => {
    const own = CategoryRepository.create({ name: "Minha", type: "emotion", userId: ownerId });
    const observer = new QueryObserver(client, categoryQueries.list(ownerId, "", "emotion"));
    subscriptions.push(observer.subscribe(() => {}));
    await observer.refetch();
    await new MutationObserver(client, categoryMutations.remove(client, ownerId)).mutate(own.id);
    expect(observer.getCurrentResult().data).toEqual([]);
  });

  test("uma categoria padrão não é apagada e a mutation informa a falha", async () => {
    const standard = CategoryRepository.create({ name: "Padrão", type: "emotion" });
    await expect(new MutationObserver(client, categoryMutations.remove(client, ownerId)).mutate(standard.id)).rejects.toThrow();
    expect(await CategoryRepository.findById(standard.id)).toBeDefined();
    expect(useToastStore.getState().currentToast?.type).toBe("error");
  });

  test("categoria inválida não entra no cache nem no banco", async () => {
    await expect(new MutationObserver(client, categoryMutations.create(client, ownerId))
      .mutate({ name: "", type: "emotion" })).rejects.toThrow();
    expect(await client.fetchQuery(categoryQueries.list(ownerId))).toEqual([]);
  });

  test("criar pensamento atualiza a consulta ativa", async () => {
    const observer = new QueryObserver(client, thoughtQueries.list(ownerId));
    subscriptions.push(observer.subscribe(() => {}));
    await observer.refetch();
    const created = await new MutationObserver(client, thoughtMutations.create(client, ownerId))
      .mutate({ name: "  Consegui  " });
    expect(created.name).toBe("Consegui");
    expect(observer.getCurrentResult().data).toEqual([created]);
  });

  test("pensamento inválido preserva o último resultado válido", async () => {
    const created = ThoughtRepository.create({ name: "Preservar", userId: ownerId });
    const options = thoughtQueries.list(ownerId);
    await client.fetchQuery(options);
    await expect(new MutationObserver(client, thoughtMutations.create(client, ownerId))
      .mutate({ name: " " })).rejects.toThrow();
    expect(client.getQueryData(options.queryKey)).toEqual([created]);
  });

  test.each(["emotion", "reaction", "behavior"] as const)("exclusão de %s usa a conta e invalida seu catálogo", async (type) => {
    const category = CategoryRepository.create({ name: "Pessoal", type, userId: ownerId });
    if (type === "emotion") {
      const item = EmotionRepository.create({ name: "Alívio", categoryId: category.id, userId: ownerId });
      const options = emotionQueries.list(ownerId);
      await client.fetchQuery(options);
      await new MutationObserver(client, emotionMutations.remove(client, ownerId)).mutate([item.id]);
      expect(client.getQueryState(options.queryKey)?.isInvalidated).toBe(true);
      expect((await client.fetchQuery(options)).flatMap(group => group.emotions)).toEqual([]);
    } else if (type === "reaction") {
      const item = ReactionRepository.create({ name: "Sorriso", categoryId: category.id, userId: ownerId });
      const options = reactionQueries.list(ownerId);
      await client.fetchQuery(options);
      await new MutationObserver(client, reactionMutations.remove(client, ownerId)).mutate([item.id]);
      expect(client.getQueryState(options.queryKey)?.isInvalidated).toBe(true);
      expect((await client.fetchQuery(options)).flatMap(group => group.reactions)).toEqual([]);
    } else {
      const item = BehaviorRepository.create({ content: "Caminhar", categoryId: category.id, userId: ownerId });
      const options = behaviorQueries.list(ownerId);
      await client.fetchQuery(options);
      await new MutationObserver(client, behaviorMutations.remove(client, ownerId)).mutate([item.id]);
      expect(client.getQueryState(options.queryKey)?.isInvalidated).toBe(true);
      expect((await client.fetchQuery(options)).flatMap(group => group.behaviors)).toEqual([]);
    }
  });
});
