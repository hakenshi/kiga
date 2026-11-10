import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { newEntrySchema } from "@/lib/db/zod/zod-schemas";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import {
  emotions,
  entryEmotions,
  entryImages,
  entryReactions,
  entryThoughts,
  journalEntries,
  reactions,
  thoughts,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

let createJournalEntry: typeof import("@/repositories/entry-repository").createJournalEntry;

describe("Tela de Nova Entry - Validação e Salvamento no Banco", () => {
  // ─── 1. VALIDAÇÃO ZOD (newEntrySchema) ───────────────────────────────────
  describe("Validação de Schema (newEntrySchema)", () => {
    it("deve validar com sucesso uma entry válida com texto e humor", () => {
      const input = {
        content: "Hoje o dia foi produtivo e me sinto calmo.",
        moodId: 4,
        emotions: [{ id: 1, name: "Calma" }],
        thoughts: [{ id: 2, name: "Eu consigo dar conta" }],
        reactions: [{ id: 3, name: "Respiração lenta" }],
      };

      const res = newEntrySchema.safeParse(input);
      expect(res.success).toBe(true);

      if (res.success) {
        expect(res.data.content).toBe(
          "Hoje o dia foi produtivo e me sinto calmo."
        );
        expect(res.data.moodId).toBe(4);
        expect(res.data.emotions.length).toBe(1);
        expect(res.data.thoughts.length).toBe(1);
        expect(res.data.reactions.length).toBe(1);
      }
    });

    it("deve rejeitar entries com conteúdo vazio ou apenas espaços", () => {
      const emptyInput = {
        content: "   ",
        moodId: null,
        emotions: [],
        thoughts: [],
        reactions: [],
      };

      const res = newEntrySchema.safeParse(emptyInput);
      expect(res.success).toBe(false);

      if (!res.success) {
        expect(res.error.issues[0].message).toBe(
          "O conteúdo do relato não pode ficar em branco"
        );
      }
    });

    it("deve aplicar valores default para arrays de recursos não enviados", () => {
      const minimalInput = {
        content: "Apenas um desabafo rápido.",
      };

      const res = newEntrySchema.safeParse(minimalInput);
      expect(res.success).toBe(true);

      if (res.success) {
        expect(res.data.emotions).toEqual([]);
        expect(res.data.thoughts).toEqual([]);
        expect(res.data.reactions).toEqual([]);
        expect(res.data.moodId).toBeUndefined();
      }
    });

    it("deve fazer trim no conteúdo automaticamente", () => {
      const input = {
        content: "   Texto com espaços nas pontas   ",
      };

      const res = newEntrySchema.safeParse(input);
      expect(res.success).toBe(true);

      if (res.success) {
        expect(res.data.content).toBe("Texto com espaços nas pontas");
      }
    });
  });

  // ─── 2. SALVAMENTO NO BANCO SQLITE (ISOLADO EM MEMÓRIA COM LIMPEZA) ──────
  describe("Lógica de Inserção no SQLite (createJournalEntry)", () => {
    let sqlite: Database;
    let testUserId: number;
    let emotionId: number;
    let thoughtId: number;
    let reactionId: number;

    beforeAll(async () => {
      const entriesMod = await import("@/repositories/entry-repository");
      createJournalEntry = entriesMod.createJournalEntry;

      // Cria banco 100% isolado em memória RAM (NÃO toca no kiga.db do disco)
      sqlite = new Database(":memory:");
      sqlite.run("PRAGMA foreign_keys = ON;");
      testDb = drizzle(sqlite, { schema: { ...schema, ...relations } });

      // Aplica migrações na memória para espelhar exatamente as tabelas do app
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
              // Ignora redefinições de tabelas intermediárias de migrações anteriores
            }
          }
        }
      }
    });

    afterEach(async () => {
      // LIMPEZA GARANTIDA: remove todos os registros gerados durante os testes
      await testDb.delete(entryImages);
      await testDb.delete(schema.entryBehaviors);
      await testDb.delete(entryEmotions);
      await testDb.delete(entryThoughts);
      await testDb.delete(entryReactions);
      await testDb.delete(journalEntries);
      await testDb.delete(schema.behaviors);
      await testDb.delete(emotions);
      await testDb.delete(thoughts);
      await testDb.delete(reactions);
      await testDb.delete(users);
    });

    afterAll(() => {
      // Destrói o banco em memória completamente
      sqlite.close();
    });

    it("deve criar um post e relacionar emoções, pensamentos e reações com sucesso", async () => {
      // 1. Cria usuário de teste
      const [u] = await testDb
        .insert(users)
        .values({
          firstName: "Teste",
          secondName: "User",
          username: "teste_user",
          password: "password123",
          pin: "1234",
          birthDate: new Date("1995-01-01"),
        })
        .returning();
      testUserId = u.id;

      // 2. Cria recursos de apoio no banco (incluindo mood para satisfazer FK)
      const [m] = await testDb
        .insert(schema.moods)
        .values({ name: "Muito Bem", userId: testUserId })
        .returning();
      const [em] = await testDb
        .insert(emotions)
        .values({ name: "Alegria", userId: testUserId })
        .returning();
      const [th] = await testDb
        .insert(thoughts)
        .values({ name: "Tudo vai dar certo", userId: testUserId })
        .returning();
      const [re] = await testDb
        .insert(reactions)
        .values({ name: "Sorriso involuntário", userId: testUserId })
        .returning();
      const [bh] = await testDb
        .insert(schema.behaviors)
        .values({ content: "Caminhar ao ar livre", icon: "Footprints", userId: testUserId })
        .returning();

      emotionId = em.id;
      thoughtId = th.id;
      reactionId = re.id;

      // 3. Executa a função do serviço
      const postDate = new Date("2026-10-30T10:00:00Z");
      const entry = await createJournalEntry({
        userId: testUserId,
        content: "Registro completo de teste no SQLite",
        moodId: m.id,
        date: postDate,
        emotions: [{ id: emotionId, name: "Alegria" }],
        thoughts: [{ id: thoughtId, name: "Tudo vai dar certo" }],
        reactions: [{ id: reactionId, name: "Sorriso involuntário" }],
        behaviors: [{ id: bh.id, content: "Caminhar ao ar livre", icon: "Footprints" }],
        images: ["file:///storage/emulated/0/DCIM/Camera/IMG_001.jpg"],
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeGreaterThan(0);
      expect(entry.content).toBe("Registro completo de teste no SQLite");
      expect(entry.moodId).toBe(m.id);
      expect(entry.mood?.name).toBe("Muito Bem");
      expect(entry.userId).toBe(testUserId);
      expect(entry.entryEmotions?.[0]?.emotion?.name).toBe("Alegria");
      expect(entry.entryThoughts?.[0]?.thought?.name).toBe("Tudo vai dar certo");
      expect(entry.entryReactions?.[0]?.reaction?.name).toBe("Sorriso involuntário");
      expect(entry.entryBehaviors?.[0]?.behavior?.content).toBe("Caminhar ao ar livre");
      expect(entry.entryBehaviors?.[0]?.behavior?.icon).toBe("Footprints");
      expect(entry.entryImages?.length).toBe(1);
      expect(entry.entryImages?.[0].imageUrl).toBe(
        "file:///storage/emulated/0/DCIM/Camera/IMG_001.jpg"
      );

      const savedImages = await testDb
        .select()
        .from(entryImages)
        .where(eq(entryImages.entryId, entry.id));
      expect(savedImages.length).toBe(1);
      expect(savedImages[0].imageUrl).toBe(
        "file:///storage/emulated/0/DCIM/Camera/IMG_001.jpg"
      );

      // 4. Valida se as tabelas pivot registraram os relacionamentos
      const pivotEmotions = await testDb
        .select()
        .from(entryEmotions)
        .where(eq(entryEmotions.entryId, entry.id));
      expect(pivotEmotions.length).toBe(1);
      expect(pivotEmotions[0].emotionId).toBe(emotionId);

      const pivotThoughts = await testDb
        .select()
        .from(entryThoughts)
        .where(eq(entryThoughts.entryId, entry.id));
      expect(pivotThoughts.length).toBe(1);
      expect(pivotThoughts[0].thoughtsId).toBe(thoughtId);

      const pivotReactions = await testDb
        .select()
        .from(entryReactions)
        .where(eq(entryReactions.entryId, entry.id));
      expect(pivotReactions.length).toBe(1);
      expect(pivotReactions[0].reactionId).toBe(reactionId);
    });

    it("deve lançar erro se o conteúdo for vazio e não inserir nada no banco", async () => {
      // 1. Cria usuário
      const [u] = await testDb
        .insert(users)
        .values({
          firstName: "Teste",
          secondName: "User",
          username: "teste_user2",
          password: "password123",
          pin: "1234",
          birthDate: new Date("1995-01-01"),
        })
        .returning();

      // 2. Tenta salvar conteúdo vazio
      let errorThrown = false;
      try {
        await createJournalEntry({
          userId: u.id,
          content: "   ",
        });
      } catch (err) {
        errorThrown = true;
        expect((err as Error).message).toContain("não pode ficar em branco");
      }

      expect(errorThrown).toBe(true);

      // 3. Garante que nenhuma entrada de diário foi inserida
      const allEntries = await testDb.select().from(journalEntries);
      expect(allEntries.length).toBe(0);
    });

    it("deve permitir salvar entry sem humor e sem chips associados", async () => {
      const [u] = await testDb
        .insert(users)
        .values({
          firstName: "Teste",
          secondName: "User",
          username: "teste_user3",
          password: "password123",
          pin: "1234",
          birthDate: new Date("1995-01-01"),
        })
        .returning();

      const entry = await createJournalEntry({
        userId: u.id,
        content: "Entry simples sem recursos adicionais",
      });

      expect(entry.id).toBeGreaterThan(0);
      expect(entry.moodId).toBeNull();

      const pivotEmotions = await testDb.select().from(entryEmotions);
      expect(pivotEmotions.length).toBe(0);
    });
  });
});
