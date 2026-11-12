import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import {
  behaviors,
  emotions,
  entryBehaviors,
  entryEmotions,
  entryImages,
  entryReactions,
  entryReplies,
  entryReposts,
  entryThoughts,
  journalEntries,
  moods,
  reactions,
  thoughts,
  users,
} from "@/lib/db/schema";
import {
  journalEntryInsertSchema,
  journalEntryUpdateSchema,
} from "@/lib/db/zod/schemas/entry/index.schema";
import { entryBehaviorInsertSchema } from "@/lib/db/zod/schemas/entry/behavior.schema";
import { entryEmotionsInsertSchema } from "@/lib/db/zod/schemas/entry/emotion.schema";
import { entryImagesInsertSchema } from "@/lib/db/zod/schemas/entry/image.schema";
import { entryReactionsInsertSchema } from "@/lib/db/zod/schemas/entry/reaction.schema";
import { entryRepliesInsertSchema } from "@/lib/db/zod/schemas/entry/reply.schema";
import { entryRepostInsertSchema } from "@/lib/db/zod/schemas/entry/repost.schema";
import { entryThoughtsInsertSchema } from "@/lib/db/zod/schemas/entry/thought.schema";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";

let testDb: any = null;
const dbProxy = new Proxy({}, {
  get: (_, prop) => {
    if (!testDb) return undefined;
    const val = testDb[prop];
    return typeof val === "function" ? val.bind(testDb) : val;
  },
});

mock.module("@/lib/db", () => ({
  default: dbProxy,
  db: dbProxy,
  expo: {},
}));

mock.module("expo-sqlite", () => ({
  openDatabaseSync: () => ({
    execSync: () => { },
    getFirstSync: () => null,
    runSync: () => { },
  }),
}));

let EntryRepository: typeof import("@/repositories/entry-repository").EntryRepository;

describe("EntryRepository", () => {
  let sqlite: Database;
  let testUserId: number;
  let testMoodId: number;
  let testBehaviorId: number;
  let testEmotionId: number;
  let testThoughtId: number;
  let testReactionId: number;

  beforeAll(async () => {
    const mod = await import("@/repositories/entry-repository");
    EntryRepository = mod.EntryRepository;

    sqlite = new Database(":memory:");
    sqlite.run("PRAGMA foreign_keys = ON;");
    testDb = drizzle(sqlite, { schema: { ...schema, ...relations } });

    const drizzleDir = join(__dirname, "../../drizzle");
    const files = readdirSync(drizzleDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(drizzleDir, file), "utf8");
      const statements = sql.split("--> statement-breakpoint");
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) {
          try {
            sqlite.run(trimmed);
          } catch {
            // Ignora redefinições
          }
        }
      }
    }

    const [user] = testDb
      .insert(users)
      .values({
        firstName: "Test",
        secondName: "User",
        username: "testuser_repo",
        password: "hashedpassword123",
        pin: "1234",
        birthDate: new Date("1995-01-01"),
      })
      .returning()
      .all();
    testUserId = user.id;

    const [mood] = testDb
      .insert(moods)
      .values({
        userId: testUserId,
        name: "Feliz",
      })
      .returning()
      .all();
    testMoodId = mood.id;

    const [behavior] = testDb
      .insert(behaviors)
      .values({
        userId: testUserId,
        content: "Exercício físico",
      })
      .returning()
      .all();
    testBehaviorId = behavior.id;

    const [emotion] = testDb
      .insert(emotions)
      .values({
        userId: testUserId,
        name: "Empolgação",
      })
      .returning()
      .all();
    testEmotionId = emotion.id;

    const [thought] = testDb
      .insert(thoughts)
      .values({
        userId: testUserId,
        name: "Vou conseguir",
      })
      .returning()
      .all();
    testThoughtId = thought.id;

    const [reaction] = testDb
      .insert(reactions)
      .values({
        userId: testUserId,
        name: "Sorriso",
      })
      .returning()
      .all();
    testReactionId = reaction.id;
  });

  afterEach(() => {
    testDb.delete(entryImages).run();
    testDb.delete(entryBehaviors).run();
    testDb.delete(entryEmotions).run();
    testDb.delete(entryThoughts).run();
    testDb.delete(entryReactions).run();
    testDb.delete(entryReplies).run();
    testDb.delete(entryReposts).run();
    testDb.delete(journalEntries).run();
  });

  afterAll(() => {
    testDb.delete(reactions).run();
    testDb.delete(thoughts).run();
    testDb.delete(emotions).run();
    testDb.delete(behaviors).run();
    testDb.delete(moods).run();
    testDb.delete(users).run();
    sqlite.close();
  });

  describe("Validação de Schemas (Zod)", () => {
    it("journalEntryInsertSchema deve exigir userId e content", () => {
      const invalid = journalEntryInsertSchema.safeParse({
        userId: testUserId,
      });
      expect(invalid.success).toBe(false);

      const valid = journalEntryInsertSchema.safeParse({
        userId: testUserId,
        content: "Relato válido",
      });
      expect(valid.success).toBe(true);
    });

    it("journalEntryInsertSchema deve aceitar relacionamentos opcionais", () => {
      const valid = journalEntryInsertSchema.safeParse({
        userId: testUserId,
        content: "Relato com tudo",
        entryType: "post",
        moodId: testMoodId,
        behaviors: [testBehaviorId],
        emotions: [testEmotionId],
        images: ["file://test.jpg"],
        reactions: [testReactionId],
        thoughts: [testThoughtId],
      });
      expect(valid.success).toBe(true);
    });

    it("journalEntryUpdateSchema deve permitir atualização parcial", () => {
      const partialUpdate = journalEntryUpdateSchema.safeParse({
        content: "Conteúdo editado",
      });
      expect(partialUpdate.success).toBe(true);
    });

    it("schemas relacionais devem validar seus campos obrigatórios", () => {
      expect(entryBehaviorInsertSchema.safeParse({ entryId: 1, behaviorId: 2 }).success).toBe(true);
      expect(entryBehaviorInsertSchema.safeParse({ entryId: 1 }).success).toBe(false);

      expect(entryEmotionsInsertSchema.safeParse({ entryId: 1, emotionId: 2 }).success).toBe(true);
      expect(entryEmotionsInsertSchema.safeParse({ entryId: 1 }).success).toBe(false);

      expect(entryImagesInsertSchema.safeParse({ entryId: 1, imageUrl: "img.png" }).success).toBe(true);
      expect(entryImagesInsertSchema.safeParse({ entryId: 1 }).success).toBe(false);

      expect(entryReactionsInsertSchema.safeParse({ entryId: 1, reactionId: 2 }).success).toBe(true);
      expect(entryReactionsInsertSchema.safeParse({ entryId: 1 }).success).toBe(false);

      expect(entryThoughtsInsertSchema.safeParse({ entryId: 1, thoughtsId: 2 }).success).toBe(true);
      expect(entryThoughtsInsertSchema.safeParse({ entryId: 1 }).success).toBe(false);

      expect(entryRepliesInsertSchema.safeParse({ entryId: 1 }).success).toBe(true);
      expect(entryRepostInsertSchema.safeParse({ entryId: 1 }).success).toBe(true);
    });
  });

  describe("Operações de Banco de Dados", () => {
    it("EntryRepository.create deve persistir um relato independente", async () => {
      const post = EntryRepository.create({
        userId: testUserId,
        content: "Meu post original",
        moodId: testMoodId,
        entryType: "post",
      });

      expect(post).toBeDefined();
      expect(post.id).toBeDefined();
      expect(post.entryType).toBe("post");
      expect(post.content).toBe("Meu post original");
      expect(post.moodId).toBe(testMoodId);

      const dbEntry = await testDb.query.journalEntries.findFirst({
        where: eq(journalEntries.id, post.id),
      });
      expect(dbEntry).toBeDefined();
      expect(dbEntry.content).toBe("Meu post original");
    });

    it("EntryRepository.create com entryType reply deve registrar na tabela entryReplies", async () => {
      const reply = EntryRepository.create({
        userId: testUserId,
        content: "Minha resposta",
        entryType: "reply",
      });

      expect(reply.id).toBeDefined();
      expect(reply.entryType).toBe("reply");

      const replyRow = await testDb.query.entryReplies.findFirst({
        where: eq(entryReplies.entryId, reply.id),
      });
      expect(replyRow).toBeDefined();
      expect(replyRow.entryId).toBe(reply.id);
    });

    it("EntryRepository.create com entryType repost deve registrar na tabela entryReposts", async () => {
      const repost = EntryRepository.create({
        userId: testUserId,
        content: "Meu repost",
        entryType: "repost",
      });

      expect(repost.id).toBeDefined();
      expect(repost.entryType).toBe("repost");

      const repostRow = await testDb.query.entryReposts.findFirst({
        where: eq(entryReposts.entryId, repost.id),
      });
      expect(repostRow).toBeDefined();
      expect(repostRow.entryId).toBe(repost.id);
    });

    it("EntryRepository.create deve persistir relacionamentos em lote", async () => {
      const post = EntryRepository.create({
        userId: testUserId,
        content: "Post completo com relacionamentos",
        behaviors: [testBehaviorId],
        emotions: [testEmotionId],
        images: ["file://photo1.jpg", "file://photo2.jpg"],
        reactions: [testReactionId],
        thoughts: [testThoughtId],
      });

      const entry = await testDb.query.journalEntries.findFirst({
        where: eq(journalEntries.id, post.id),
        with: {
          entryBehaviors: true,
          entryEmotions: true,
          entryImages: true,
          entryReactions: true,
          entryThoughts: true,
        },
      });

      expect(entry).toBeDefined();
      expect(entry.entryBehaviors).toHaveLength(1);
      expect(entry.entryBehaviors[0].behaviorId).toBe(testBehaviorId);

      expect(entry.entryEmotions).toHaveLength(1);
      expect(entry.entryEmotions[0].emotionId).toBe(testEmotionId);

      expect(entry.entryImages).toHaveLength(2);
      expect(entry.entryImages.map((i: any) => i.imageUrl)).toEqual([
        "file://photo1.jpg",
        "file://photo2.jpg",
      ]);

      expect(entry.entryReactions).toHaveLength(1);
      expect(entry.entryReactions[0].reactionId).toBe(testReactionId);

      expect(entry.entryThoughts).toHaveLength(1);
      expect(entry.entryThoughts[0].thoughtsId).toBe(testThoughtId);
    });

    it("EntryRepository.create deve executar em transaction e abortar tudo se um relacionamento falhar", async () => {
      expect(() => {
        EntryRepository.create({
          userId: testUserId,
          content: "Post que deve sofrer rollback",
          behaviors: [999999], // Id inexistente (violação de foreign key)
        });
      }).toThrow();

      const entries = await testDb.query.journalEntries.findMany({
        where: eq(journalEntries.userId, testUserId),
      });
      expect(entries).toHaveLength(0);
    });

    it("EntryRepository.update deve atualizar o conteúdo e sincronizar relacionamentos", async () => {
      const created = EntryRepository.create({
        userId: testUserId,
        content: "Conteúdo original",
        behaviors: [testBehaviorId],
      });

      const updated = EntryRepository.update(created.id, {
        content: "Conteúdo modificado",
        behaviors: [], // Limpa os comportamentos
        emotions: [testEmotionId], // Adiciona emoção
      });

      expect(updated.content).toBe("Conteúdo modificado");

      const entry = await testDb.query.journalEntries.findFirst({
        where: eq(journalEntries.id, created.id),
        with: {
          entryBehaviors: true,
          entryEmotions: true,
        },
      });

      expect(entry.content).toBe("Conteúdo modificado");
      expect(entry.entryBehaviors).toHaveLength(0);
      expect(entry.entryEmotions).toHaveLength(1);
      expect(entry.entryEmotions[0].emotionId).toBe(testEmotionId);
    });

    it("EntryRepository.update deve lançar erro se o registro não existir", () => {
      expect(() => {
        EntryRepository.update(99999, {
          content: "Não existe",
        });
      }).toThrow(NotFoundException);
    });

    it("EntryRepository.delete deve remover o relato e seus relacionamentos em cascata", async () => {
      const created = EntryRepository.create({
        userId: testUserId,
        content: "Para deletar",
        behaviors: [testBehaviorId],
      });

      await EntryRepository.delete(created.id);

      const entry = await testDb.query.journalEntries.findFirst({
        where: eq(journalEntries.id, created.id),
      });
      expect(entry).toBeUndefined();

      const behaviorsLinked = await testDb.query.entryBehaviors.findMany({
        where: eq(entryBehaviors.entryId, created.id),
      });
      expect(behaviorsLinked).toHaveLength(0);
    });

    it("EntryRepository.findMany e findOne devem consultar com relacionamentos", async () => {
      const firstEntry = EntryRepository.create({
        userId: testUserId,
        content: "Primeiro relato",
      });

      const secondEntry = EntryRepository.create({
        userId: testUserId,
        content: "Segundo relato",
        emotions: [testEmotionId],
      });

      const list = await EntryRepository.findMany(testUserId, { limit: 10, offset: 0 });
      expect(list).toHaveLength(2);
      expect(list[0].entryEmotions).toBeDefined();

      const first = await EntryRepository.findOne(firstEntry.id);
      const second = await EntryRepository.findOne(secondEntry.id);
      expect(first?.content).toBe("Primeiro relato");
      expect(second?.content).toBe("Segundo relato");
      expect(second?.entryEmotions[0].emotionId).toBe(testEmotionId);
      expect(await EntryRepository.findOne(99999)).toBeUndefined();
    });
  });
});
