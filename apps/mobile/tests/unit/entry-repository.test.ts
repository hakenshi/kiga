import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import {
  emotions,
  entryEmotions,
  entryImages,
  entryReactions,
  entryReplies,
  entryReposts,
  entryThoughts,
  journalEntries,
  users,
} from "@/lib/db/schema";
import {
  createPostSchema,
  createReplySchema,
  createRepostSchema,
  updateJournalEntryParamsSchema,
} from "@/lib/db/zod/zod-schemas";

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
    execSync: () => {},
    getFirstSync: () => null,
    runSync: () => {},
  }),
}));

let EntryRepository: typeof import("@/repositories/entry-repository").EntryRepository;

describe("EntryRepository (Classe Abstrata com Métodos Estáticos)", () => {
  let sqlite: Database;
  let testUserId: number;

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

    const [user] = await testDb
      .insert(users)
      .values({
        firstName: "Test",
        secondName: "User",
        username: "testuser_repo",
        email: "test_repo@example.com",
        password: "hashedpassword123",
        pin: "1234",
        birthDate: new Date("1995-01-01"),
      })
      .returning();
    testUserId = user.id;
  });

  afterEach(async () => {
    await testDb.delete(entryImages);
    await testDb.delete(schema.entryBehaviors);
    await testDb.delete(entryEmotions);
    await testDb.delete(entryThoughts);
    await testDb.delete(entryReactions);
    await testDb.delete(entryReplies);
    await testDb.delete(entryReposts);
    await testDb.delete(journalEntries);
  });

  afterAll(async () => {
    await testDb.delete(users);
    sqlite.close();
  });

  describe("Validação de Schemas Separados (Zod)", () => {
    it("createPostSchema deve exigir conteúdo e rejeitar string vazia", () => {
      const invalid = createPostSchema.safeParse({
        userId: testUserId,
        content: "   ",
      });
      expect(invalid.success).toBe(false);

      const valid = createPostSchema.safeParse({
        userId: testUserId,
        content: "Relato válido",
      });
      expect(valid.success).toBe(true);
    });

    it("createReplySchema deve exigir parentEntryId positivo", () => {
      const invalid = createReplySchema.safeParse({
        userId: testUserId,
        content: "Resposta",
        parentEntryId: -1,
      });
      expect(invalid.success).toBe(false);

      const valid = createReplySchema.safeParse({
        userId: testUserId,
        content: "Resposta válida",
        parentEntryId: 42,
      });
      expect(valid.success).toBe(true);
    });

    it("createRepostSchema deve permitir conteúdo vazio (repost direto)", () => {
      const res = createRepostSchema.safeParse({
        userId: testUserId,
        parentEntryId: 10,
        content: "",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.content).toBe("");
      }
    });

    it("updateJournalEntryParamsSchema deve ser derivado via .partial() exigindo apenas entryId", () => {
      const res = updateJournalEntryParamsSchema.safeParse({
        entryId: 99,
        content: "Conteúdo editado",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.entryId).toBe(99);
        expect(res.data.content).toBe("Conteúdo editado");
        expect(res.data.emotions).toBeUndefined();
      }
    });
  });

  describe("Operações no Banco de Dados", () => {
    it("EntryRepository.createPost deve persistir um relato independente", async () => {
      const post = await EntryRepository.createPost({
        userId: testUserId,
        content: "Meu post original",
        moodId: 4,
      });

      expect(post.id).toBeDefined();
      expect(post.entryType).toBe("post");
      expect(post.content).toBe("Meu post original");
      expect(post.moodId).toBe(4);
    });

    it("EntryRepository.createReply deve criar resposta vinculada ao post pai", async () => {
      const root = await EntryRepository.createPost({
        userId: testUserId,
        content: "Post raiz",
      });

      const reply = await EntryRepository.createReply({
        userId: testUserId,
        parentEntryId: root.id,
        content: "Minha resposta",
      });

      expect(reply.id).toBeDefined();
      expect(reply.entryType).toBe("reply");

      const thread = await EntryRepository.getThread(root.id);
      expect(thread).not.toBeNull();
      expect(thread!.rootEntry.id).toBe(root.id);
      expect(thread!.replies.length).toBe(1);
      expect(thread!.replies[0].id).toBe(reply.id);
    });

    it("EntryRepository.createRepost deve criar repost com vínculo correto", async () => {
      const original = await EntryRepository.createPost({
        userId: testUserId,
        content: "Post a ser repostado",
      });

      const repost = await EntryRepository.createRepost({
        userId: testUserId,
        parentEntryId: original.id,
        content: "Comentário sobre o repost",
      });

      expect(repost.id).toBeDefined();
      expect(repost.entryType).toBe("repost");
      expect(repost.content).toBe("Comentário sobre o repost");
    });

    it("EntryRepository.update deve atualizar parcialmente via schema Zod com .partial()", async () => {
      const entry = await EntryRepository.createPost({
        userId: testUserId,
        content: "Texto original",
        moodId: 3,
      });

      const updated = await EntryRepository.update({
        entryId: entry.id,
        content: "Texto modificado",
      });

      expect(updated.content).toBe("Texto modificado");
      expect(updated.moodId).toBe(3); // Preservado
    });

    it("EntryRepository.delete deve excluir o registro do banco", async () => {
      const entry = await EntryRepository.createPost({
        userId: testUserId,
        content: "Para deletar",
      });

      await EntryRepository.delete(entry.id);
      const found = await EntryRepository.getById(entry.id);
      expect(found).toBeNull();
    });
  });
});
