import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import {
  entryEmotions,
  entryReplies,
  entryReposts,
  entryThoughts,
  journalEntries,
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

let createJournalEntry: typeof import("@/lib/db/entries").createJournalEntry;
let getEntryWithThread: typeof import("@/lib/db/entries").getEntryWithThread;
let getParentEntry: typeof import("@/lib/db/entries").getParentEntry;
let getJournalEntries: typeof import("@/lib/db/queries/entries").getJournalEntries;

describe("Thread de Pensamentos e Reflexões (Linear TCC Timeline)", () => {
  let sqlite: Database;
  let testUserId: number;

  beforeAll(async () => {
    const entriesMod = await import("@/lib/db/entries");
    createJournalEntry = entriesMod.createJournalEntry;
    getEntryWithThread = entriesMod.getEntryWithThread;
    getParentEntry = entriesMod.getParentEntry;
    getJournalEntries = entriesMod.getJournalEntries;

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
            // Ignora redefinições intermediárias
          }
        }
      }
    }
  });

  afterEach(async () => {
    await testDb.delete(entryReposts);
    await testDb.delete(entryReplies);
    await testDb.delete(entryThoughts);
    await testDb.delete(entryEmotions);
    await testDb.delete(journalEntries);
    await testDb.delete(users);
  });

  afterAll(() => {
    sqlite.close();
  });

  async function createTestUser() {
    const [user] = await testDb
      .insert(users)
      .values({
        firstName: "Felipe",
        secondName: "Kafka",
        username: "yoru_test_" + Math.random().toString(36).slice(2, 7),
        password: "hash",
        pin: "1234",
        birthDate: new Date("2000-01-01"),
      })
      .returning();
    return user.id;
  }

  it("deve criar uma resposta (reply) vinculada ao pensamento pai na tabela entry_replies", async () => {
    testUserId = await createTestUser();

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Vou apresentar o projeto hoje e sinto que não vou dar conta.",
      moodId: 1,
    });
    expect(root.entryType).toBe("post");

    const reply = await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Acabei de sair da apresentação. Voz tremeu um pouco mas correu tudo bem.",
      moodId: 4,
    });

    expect(reply.entryType).toBe("reply");
    expect(reply.content).toContain("Acabei de sair da apresentação");

    const [link] = await testDb
      .select()
      .from(entryReplies)
      .where(eq(entryReplies.entryId, reply.id));

    expect(link).toBeDefined();
    expect(link.entryId).toBe(reply.id);
    expect(link.parentEntryId).toBe(root.id);
  });

  it("garante threads lineares sem bifurcações: resposta a uma resposta se conecta direto à raiz", async () => {
    testUserId = await createTestUser();

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Pensamento raiz",
    });

    const reply1 = await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Resposta 1",
    });

    const reply2 = await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: reply1.id,
      content: "Resposta 2 respondendo resposta 1",
    });

    const [link] = await testDb
      .select()
      .from(entryReplies)
      .where(eq(entryReplies.entryId, reply2.id));

    expect(link).toBeDefined();
    expect(link.parentEntryId).toBe(root.id);
  });

  it("deve criar um repost vinculado ao pensamento original na tabela entry_reposts", async () => {
    testUserId = await createTestUser();

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Não sei se vou conseguir passar no teste.",
      moodId: 2,
    });

    const repost = await createJournalEntry({
      userId: testUserId,
      entryType: "repost",
      parentEntryId: root.id,
      content: "Relendo isso 3 meses depois: passei e fui promovido.",
      moodId: 5,
    });

    expect(repost.entryType).toBe("repost");

    const [link] = await testDb
      .select()
      .from(entryReposts)
      .where(eq(entryReposts.entryId, repost.id));

    expect(link).toBeDefined();
    expect(link.entryId).toBe(repost.id);
    expect(link.parentEntryId).toBe(root.id);
  });

  it("getJournalEntries (feed da home) deve incluir posts e reposts com citação, mas omitir respostas", async () => {
    testUserId = await createTestUser();

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Post da homepage",
    });

    await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Não deve aparecer na home",
    });

    const repost = await createJournalEntry({
      userId: testUserId,
      entryType: "repost",
      parentEntryId: root.id,
      content: "Repost deve aparecer na home",
    });

    const homeEntries = await getJournalEntries(testUserId);
    expect(homeEntries).toHaveLength(2);
    expect(homeEntries.map((e) => e.entryType)).toContain("post");
    expect(homeEntries.map((e) => e.entryType)).toContain("repost");
    expect(homeEntries.some((e) => e.entryType === "reply")).toBe(false);

    const repostInHome = homeEntries.find((e) => e.id === repost.id);
    expect(repostInHome?.parentRepost?.parentEntry?.id).toBe(root.id);
  });

  it("getEntryWithThread deve retornar pensamento raiz com todas as reflexões em ordem cronológica (ASC)", async () => {
    testUserId = await createTestUser();

    const dateRoot = new Date("2026-11-01T10:00:00Z");
    const dateR1 = new Date("2026-11-01T12:15:00Z");
    const dateR2 = new Date("2026-11-01T20:40:00Z");
    const dateR3 = new Date("2026-11-04T16:30:00Z");

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Pensamento raiz da thread",
      date: dateRoot,
    });

    await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Reflexão 1 (+2h 15m)",
      date: dateR1,
    });

    await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Reflexão 2 (+10h 40m)",
      date: dateR2,
    });

    await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Reflexão 3 (3 dias depois)",
      date: dateR3,
    });

    const thread = await getEntryWithThread(root.id);
    expect(thread).not.toBeNull();
    expect(thread!.rootEntry.id).toBe(root.id);
    expect(thread!.replies).toHaveLength(3);

    expect(thread!.replies[0].content).toBe("Reflexão 1 (+2h 15m)");
    expect(thread!.replies[1].content).toBe("Reflexão 2 (+10h 40m)");
    expect(thread!.replies[2].content).toBe("Reflexão 3 (3 dias depois)");
  });

  it("getEntryWithThread chamado a partir de uma resposta deve localizar a raiz da thread automaticamente", async () => {
    testUserId = await createTestUser();

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Pensamento raiz",
    });

    await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Reflexão 1",
    });

    const r2 = await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Reflexão 2",
    });

    const thread = await getEntryWithThread(r2.id);
    expect(thread).not.toBeNull();
    expect(thread!.rootEntry.id).toBe(root.id);
    expect(thread!.replies).toHaveLength(2);
  });

  it("getParentEntry deve retornar o post pai ou null se for um post raiz", async () => {
    testUserId = await createTestUser();

    const root = await createJournalEntry({
      userId: testUserId,
      content: "Pensamento sem pai",
    });

    const reply = await createJournalEntry({
      userId: testUserId,
      entryType: "reply",
      parentEntryId: root.id,
      content: "Resposta",
    });

    const repost = await createJournalEntry({
      userId: testUserId,
      entryType: "repost",
      parentEntryId: root.id,
      content: "Repost",
    });

    const parentOfReply = await getParentEntry(reply.id);
    expect(parentOfReply).not.toBeNull();
    expect(parentOfReply!.id).toBe(root.id);

    const parentOfRepost = await getParentEntry(repost.id);
    expect(parentOfRepost).not.toBeNull();
    expect(parentOfRepost!.id).toBe(root.id);

    const parentOfRoot = await getParentEntry(root.id);
    expect(parentOfRoot).toBeNull();
  });

  it("getEntryWithThread em um repost deve manter o repost como rootEntry e carregar o post original citado", async () => {
    testUserId = await createTestUser();

    const original = await createJournalEntry({
      userId: testUserId,
      content: "Ele é muito burro",
      moodId: 2,
    });

    const repost = await createJournalEntry({
      userId: testUserId,
      entryType: "repost",
      parentEntryId: original.id,
      content: "E ele realmente eh sinceramente? Muito burro.",
      moodId: 3,
    });

    const thread = await getEntryWithThread(repost.id);
    expect(thread).not.toBeNull();
    expect(thread!.rootEntry.id).toBe(repost.id);
    expect(thread!.rootEntry.entryType).toBe("repost");
    expect(thread!.rootEntry.parentRepost?.parentEntry?.id).toBe(original.id);
    expect(thread!.rootEntry.parentRepost?.parentEntry?.content).toBe("Ele é muito burro");
  });

  it("deve permitir criar repost sem comentário (repost direto) com content vazio e carregar no feed", async () => {
    testUserId = await createTestUser();

    const original = await createJournalEntry({
      userId: testUserId,
      content: "Pensamento que será revisitado diretamente",
      moodId: 4,
    });

    const pureRepost = await createJournalEntry({
      userId: testUserId,
      entryType: "repost",
      parentEntryId: original.id,
      content: "",
    });

    expect(pureRepost.entryType).toBe("repost");
    expect(pureRepost.content).toBe("");
    expect(pureRepost.parentRepost?.parentEntry?.id).toBe(original.id);

    const feed = await getJournalEntries(testUserId);
    expect(feed).toHaveLength(2);

    const repostInFeed = feed.find((e) => e.id === pureRepost.id);
    expect(repostInFeed).toBeDefined();
    expect(repostInFeed!.content).toBe("");
    expect(repostInFeed!.parentRepost?.parentEntry?.content).toBe(
      "Pensamento que será revisitado diretamente"
    );
  });

  it("deve ordenar posts fixados primeiro no feed, mesmo se houver posts mais recentes não fixados", async () => {
    testUserId = await createTestUser();

    const olderFixed = await createJournalEntry({
      userId: testUserId,
      content: "Post antigo, mas fixado",
      date: new Date("2026-11-01T10:00:00Z"),
    });
    await testDb
      .update(journalEntries)
      .set({ fixed: true })
      .where(eq(journalEntries.id, olderFixed.id));

    await createJournalEntry({
      userId: testUserId,
      content: "Post mais recente, não fixado",
      date: new Date("2026-11-06T10:00:00Z"),
    });

    const feed = await getJournalEntries(testUserId);
    expect(feed).toHaveLength(2);
    expect(feed[0].id).toBe(olderFixed.id);
    expect(feed[0].fixed).toBe(true);
    expect(feed[1].fixed).toBe(false);
  });
});
