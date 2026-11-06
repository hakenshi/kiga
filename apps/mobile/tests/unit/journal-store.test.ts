import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import {
  entryEmotions,
  entryReactions,
  entryThoughts,
  journalEntries,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

// Proxy para banco em memória isolado
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

mock.module("react-native", () => ({}));

const { useEntryStore } = await import("@/stores/journal-store");

describe("useEntryStore (journal-store)", () => {
  let sqlite: Database;
  let testUserId: number;
  let otherUserId: number;

  beforeAll(async () => {
    // Cria banco SQLite em memória RAM isolado
    sqlite = new Database(":memory:");
    sqlite.run("PRAGMA foreign_keys = ON;");
    testDb = drizzle(sqlite, { schema: { ...schema, ...relations } });

    // Aplica migrações para espelhar as tabelas da aplicação
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
            // Ignora redefinições intermediárias
          }
        }
      }
    }

    // Cria usuários de teste
    const [u1] = await testDb
      .insert(users)
      .values({
        firstName: "Test",
        secondName: "User",
        username: "test_journal_user",
        password: "password123",
        pin: "1234",
        birthDate: new Date("1995-01-01"),
      })
      .returning();
    testUserId = u1.id;

    const [u2] = await testDb
      .insert(users)
      .values({
        firstName: "Other",
        secondName: "User",
        username: "other_journal_user",
        password: "password123",
        pin: "4321",
        birthDate: new Date("1996-02-02"),
      })
      .returning();
    otherUserId = u2.id;
  });

  afterEach(async () => {
    // Limpa estado da store e dados das tabelas
    useEntryStore.getState().reset();
    await testDb.delete(entryEmotions);
    await testDb.delete(entryThoughts);
    await testDb.delete(entryReactions);
    await testDb.delete(journalEntries);
  });

  afterAll(async () => {
    await testDb.delete(users);
    sqlite.close();
  });

  // ─── 1. ESTADO INICIAL E RESET ──────────────────────────────────────────
  describe("Estado Inicial e reset", () => {
    it("deve inicializar com o estado padrão vazio e descarregado", () => {
      const state = useEntryStore.getState();
      expect(state.entries).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.hasMore).toBe(false);
      expect(state.page).toBe(0);
    });

    it("deve restaurar o estado padrão ao executar reset()", () => {
      // Modifica o estado manualmente
      useEntryStore.setState({
        entries: [
          {
            id: 99,
            userId: testUserId,
            content: "Temp",
            liked: false,
            entryType: "post",
            moodId: null,
            title: null,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: null,
            date: new Date(),
          } as JournalEntryWithRelations,
        ],
        isLoading: true,
        hasMore: true,
        page: 3,
      });

      useEntryStore.getState().reset();

      const state = useEntryStore.getState();
      expect(state.entries).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.hasMore).toBe(false);
      expect(state.page).toBe(0);
    });
  });

  // ─── 2. ADIÇÃO DE RELATOS (addEntry) ────────────────────────────────────
  describe("addEntry", () => {
    it("deve adicionar uma nova entrada no início da lista (prepend)", () => {
      const entry1 = {
        id: 1,
        userId: testUserId,
        content: "Primeiro relato",
        liked: false,
        entryType: "post",
        date: new Date(),
        createdAt: new Date(),
      } as JournalEntryWithRelations;

      const entry2 = {
        id: 2,
        userId: testUserId,
        content: "Segundo relato mais recente",
        liked: true,
        entryType: "post",
        date: new Date(),
        createdAt: new Date(),
      } as JournalEntryWithRelations;

      useEntryStore.getState().addEntry(entry1);
      expect(useEntryStore.getState().entries).toHaveLength(1);
      expect(useEntryStore.getState().entries[0].id).toBe(1);

      useEntryStore.getState().addEntry(entry2);
      expect(useEntryStore.getState().entries).toHaveLength(2);
      expect(useEntryStore.getState().entries[0].id).toBe(2);
      expect(useEntryStore.getState().entries[1].id).toBe(1);
    });
  });

  // ─── 3. ATUALIZAÇÃO DE RELATOS (updateEntry) ────────────────────────────
  describe("updateEntry", () => {
    it("deve atualizar o campo liked no banco SQLite e refletir no estado da store", async () => {
      // 1. Cria o registro no banco
      const [created] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Relato para curtir",
          liked: false,
          entryType: "post",
        })
        .returning();

      // 2. Coloca o relato no estado da store
      useEntryStore.setState({
        entries: [created as JournalEntryWithRelations],
      });

      // 3. Executa a função updateEntry
      await useEntryStore.getState().updateEntry(created.id, { liked: true });

      // 4. Valida se o estado da store foi atualizado
      const state = useEntryStore.getState();
      expect(state.entries[0].liked).toBe(true);

      // 5. Valida se a alteração foi persistida no banco SQLite
      const [fromDb] = await testDb
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, created.id));
      expect(fromDb.liked).toBe(true);
    });

    it("deve atualizar múltiplos campos (content, liked) preservando outros relatos intactos", async () => {
      const [e1] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Texto original 1",
          liked: false,
          entryType: "post",
        })
        .returning();

      const [e2] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Texto original 2",
          liked: false,
          entryType: "post",
        })
        .returning();

      useEntryStore.setState({
        entries: [e1, e2] as JournalEntryWithRelations[],
      });

      // Atualiza apenas e1
      await useEntryStore.getState().updateEntry(e1.id, {
        content: "Texto alterado com sucesso",
        liked: true,
      });

      const { entries } = useEntryStore.getState();
      const updatedE1 = entries.find((e) => e.id === e1.id);
      const unchangedE2 = entries.find((e) => e.id === e2.id);

      expect(updatedE1?.content).toBe("Texto alterado com sucesso");
      expect(updatedE1?.liked).toBe(true);

      expect(unchangedE2?.content).toBe("Texto original 2");
      expect(unchangedE2?.liked).toBe(false);
    });

    it("deve falhar com ZodError se os dados fornecidos forem inválidos e não alterar banco nem store", async () => {
      const [created] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Texto que não deve mudar",
          liked: false,
          entryType: "post",
        })
        .returning();

      useEntryStore.setState({
        entries: [created as JournalEntryWithRelations],
      });

      // Passa conteúdo vazio (inválido conforme journalEntryInsertSchema)
      let errorThrown: any = null;
      try {
        await useEntryStore.getState().updateEntry(created.id, {
          content: "   ",
        });
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).toBeInstanceOf(ZodError);

      // Confirma que a store permaneceu inalterada
      const state = useEntryStore.getState();
      expect(state.entries[0].content).toBe("Texto que não deve mudar");

      // Confirma que o SQLite permaneceu inalterado
      const [fromDb] = await testDb
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, created.id));
      expect(fromDb.content).toBe("Texto que não deve mudar");
    });

    it("não deve alterar o array de entries se o id atualizado não estiver na store", async () => {
      const otherEntry = {
        id: 999,
        userId: testUserId,
        content: "Entrada em memória",
        liked: false,
        entryType: "post",
        date: new Date(),
        createdAt: new Date(),
      } as JournalEntryWithRelations;

      useEntryStore.setState({ entries: [otherEntry] });

      // Atualiza um ID inexistente
      await useEntryStore.getState().updateEntry(12345, { liked: true });

      const state = useEntryStore.getState();
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].id).toBe(999);
      expect(state.entries[0].liked).toBe(false);
    });
  });

  // ─── 4. EXCLUSÃO DE RELATOS (deleteEntry) ───────────────────────────────
  describe("deleteEntry", () => {
    it("deve remover o relato do SQLite e do estado da store quando o registro existir", async () => {
      const [e1] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Relato que será deletado",
          liked: false,
          entryType: "post",
        })
        .returning();

      const [e2] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Relato que deve permanecer",
          liked: false,
          entryType: "post",
        })
        .returning();

      useEntryStore.setState({
        entries: [e1, e2] as JournalEntryWithRelations[],
      });

      // Executa exclusão de e1
      await useEntryStore.getState().deleteEntry(e1.id);

      // Aguarda o timer de 4500ms da exclusão otimista com Desfazer
      await new Promise((r) => setTimeout(r, 4600));

      // Valida estado da store
      const state = useEntryStore.getState();
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].id).toBe(e2.id);

      // Valida persistência no SQLite (e1 deve ter sumido)
      const inDb = await testDb
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, e1.id));
      expect(inDb).toHaveLength(0);

      // Confirma que e2 ainda existe no banco
      const e2InDb = await testDb
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, e2.id));
      expect(e2InDb).toHaveLength(1);
    });

    it("deve retornar antecipadamente e não alterar o banco se o relato não existir na store", async () => {
      // Insere um registro no banco
      const [dbEntry] = await testDb
        .insert(journalEntries)
        .values({
          userId: testUserId,
          content: "Registro que existe no banco mas não na store",
          liked: false,
          entryType: "post",
        })
        .returning();

      // Store com lista vazia
      useEntryStore.setState({ entries: [] });

      // Tenta deletar o ID que não está na store
      await useEntryStore.getState().deleteEntry(dbEntry.id);

      // Como a validação exists falhou, a chamada não deletou do banco
      const fromDb = await testDb
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, dbEntry.id));
      expect(fromDb).toHaveLength(1);
    });
  });

  // ─── 5. CARREGAMENTO INICIAL (loadInitial) ──────────────────────────────
  describe("loadInitial", () => {
    it("deve carregar relatos do banco, definir page como 1 e hasMore como false se total < 20", async () => {
      // Cria 2 relatos para o testUserId e 1 para outro usuário
      await testDb.insert(journalEntries).values([
        {
          userId: testUserId,
          content: "Relato A",
          liked: false,
          entryType: "post",
          date: new Date("2026-10-30T10:00:00Z"),
        },
        {
          userId: testUserId,
          content: "Relato B",
          liked: true,
          entryType: "post",
          date: new Date("2026-10-31T10:00:00Z"),
        },
        {
          userId: otherUserId,
          content: "Relato de outro usuário",
          liked: false,
          entryType: "post",
          date: new Date("2026-10-31T12:00:00Z"),
        },
      ]);

      await useEntryStore.getState().loadInitial(testUserId);

      const state = useEntryStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.page).toBe(1);
      expect(state.hasMore).toBe(false);
      expect(state.entries).toHaveLength(2);
      expect(state.entries.map((e) => e.content)).toEqual([
        "Relato B",
        "Relato A",
      ]);
    });

    it("deve definir hasMore como true quando o banco retornar exatamente PAGE_SIZE (20) itens", async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        userId: testUserId,
        content: `Relato número ${i + 1}`,
        liked: false,
        entryType: "post" as const,
        date: new Date(2026, 9, i + 1),
      }));

      await testDb.insert(journalEntries).values(items);

      await useEntryStore.getState().loadInitial(testUserId);

      const state = useEntryStore.getState();
      expect(state.entries).toHaveLength(20);
      expect(state.page).toBe(1);
      expect(state.hasMore).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("não deve carregar relatos marcados com deletedAt (soft deleted)", async () => {
      await testDb.insert(journalEntries).values([
        {
          userId: testUserId,
          content: "Relato ativo",
          liked: false,
          entryType: "post",
          deletedAt: null,
        },
        {
          userId: testUserId,
          content: "Relato deletado",
          liked: false,
          entryType: "post",
          deletedAt: new Date(),
        },
      ]);

      await useEntryStore.getState().loadInitial(testUserId);

      const { entries } = useEntryStore.getState();
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe("Relato ativo");
    });

    it("deve redefinir isLoading para false caso ocorra um erro durante loadInitial", async () => {
      const originalFindMany = testDb.query.journalEntries.findMany;
      testDb.query.journalEntries.findMany = () => {
        throw new Error("Erro simulado no banco");
      };

      try {
        await useEntryStore.getState().loadInitial(testUserId);
        const state = useEntryStore.getState();
        expect(state.isLoading).toBe(false);
      } finally {
        testDb.query.journalEntries.findMany = originalFindMany;
      }
    });
  });

  // ─── 6. CARREGAMENTO INCREMENTAL (loadMore) ─────────────────────────────
  describe("loadMore", () => {
    it("não deve executar busca se hasMore for false", async () => {
      useEntryStore.setState({
        hasMore: false,
        isLoading: false,
        page: 1,
        entries: [],
      });

      await useEntryStore.getState().loadMore(testUserId);

      const state = useEntryStore.getState();
      expect(state.page).toBe(1);
      expect(state.entries).toEqual([]);
    });

    it("não deve executar busca se já estiver carregando (isLoading: true)", async () => {
      useEntryStore.setState({
        hasMore: true,
        isLoading: true,
        page: 1,
        entries: [],
      });

      await useEntryStore.getState().loadMore(testUserId);

      // Não deve ter alterado nada
      expect(useEntryStore.getState().page).toBe(1);
    });

    it("deve redefinir isLoading para false caso ocorra um erro durante loadMore", async () => {
      useEntryStore.setState({
        hasMore: true,
        isLoading: false,
        page: 1,
        entries: [],
      });

      const originalFindMany = testDb.query.journalEntries.findMany;
      testDb.query.journalEntries.findMany = () => {
        throw new Error("Erro simulado no banco durante loadMore");
      };

      try {
        await useEntryStore.getState().loadMore(testUserId);
        const state = useEntryStore.getState();
        expect(state.isLoading).toBe(false);
      } finally {
        testDb.query.journalEntries.findMany = originalFindMany;
      }
    });

    it("deve carregar a próxima página com offset correto e concatenar aos relatos existentes", async () => {
      // Insere 25 registros para simular paginação completa (20 na primeira página, 5 na segunda)
      const allEntries = Array.from({ length: 25 }, (_, i) => ({
        userId: testUserId,
        content: `Relato ${String(i + 1).padStart(2, "0")}`,
        liked: false,
        entryType: "post" as const,
        date: new Date(2026, 0, i + 1),
      }));

      await testDb.insert(journalEntries).values(allEntries);

      // Carrega página 1 (20 itens)
      await useEntryStore.getState().loadInitial(testUserId);
      expect(useEntryStore.getState().entries).toHaveLength(20);
      expect(useEntryStore.getState().page).toBe(1);
      expect(useEntryStore.getState().hasMore).toBe(true);

      // Carrega página 2 (mais 5 itens)
      await useEntryStore.getState().loadMore(testUserId);

      const state = useEntryStore.getState();
      expect(state.entries).toHaveLength(25);
      expect(state.page).toBe(2);
      expect(state.hasMore).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
