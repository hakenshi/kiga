import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import { categories, emotions, users } from "@/lib/db/schema";

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

let EmotionRepository: typeof import("@/repositories/emotion-repository").EmotionRepository;

describe("EmotionRepository", () => {
  let sqlite: Database;
  let testUserId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    const mod = await import("@/repositories/emotion-repository");
    EmotionRepository = mod.EmotionRepository;

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
        username: "testuser_emotion",
        password: "hashedpassword123",
        pin: "1234",
        birthDate: new Date("1995-01-01"),
      })
      .returning()
      .all();
    testUserId = user.id;

    const [cat] = testDb
      .insert(categories)
      .values({
        userId: testUserId,
        name: "Sentimentos Positivos",
        type: "emotion",
      })
      .returning()
      .all();
    testCategoryId = cat.id;
  });

  afterEach(() => {
    testDb.delete(emotions).run();
  });

  afterAll(() => {
    testDb.delete(categories).run();
    testDb.delete(users).run();
    sqlite.close();
  });

  it("deve criar uma emoção com sucesso", () => {
    const item = EmotionRepository.create({
      userId: testUserId,
      categoryId: testCategoryId,
      name: "Gratidão",
    });

    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.name).toBe("Gratidão");
    expect(item.categoryId).toBe(testCategoryId);
  });

  it("deve listar emoções do usuário com categoria associada", async () => {
    EmotionRepository.create({
      userId: testUserId,
      categoryId: testCategoryId,
      name: "Alegria",
      orderIndex: 1,
    });

    EmotionRepository.create({
      userId: testUserId,
      categoryId: testCategoryId,
      name: "Esperança",
      orderIndex: 2,
    });

    const list = await EmotionRepository.findMany(testUserId);
    expect(list.length).toBeGreaterThan(2);
    expect(list[0].name).toBe("Alegria");
    expect(list[0].category).toBeDefined();
    expect(list[0].category?.name).toBe("Sentimentos Positivos");
  });

  it("deve buscar uma emoção por ID", async () => {
    const created = EmotionRepository.create({
      userId: testUserId,
      name: "Tranquilidade",
    });

    const found = await EmotionRepository.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Tranquilidade");
  });

  it("deve atualizar uma emoção parcialmente", async () => {
    const created = EmotionRepository.create({
      userId: testUserId,
      name: "Antes",
    });

    const updated = EmotionRepository.update(created.id, {
      name: "Depois",
    });

    expect(updated.name).toBe("Depois");

    const found = await EmotionRepository.findById(created.id);
    expect(found?.name).toBe("Depois");
  });

  it("deve aplicar soft delete na emoção", async () => {
    const created = EmotionRepository.create({
      userId: testUserId,
      name: "Para deletar",
    });

    await EmotionRepository.delete(created.id);

    const found = await EmotionRepository.findById(created.id);
    expect(found).toBeUndefined();

    const raw = await testDb.query.emotions.findFirst({
      where: eq(emotions.id, created.id),
    });
    expect(raw).toBeDefined();
    expect(raw?.deletedAt).not.toBeNull();
  });
});
