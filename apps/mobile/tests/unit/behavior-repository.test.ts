import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import { behaviors, categories, users } from "@/lib/db/schema";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { ZodError } from "zod";

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

let BehaviorRepository: typeof import("@/repositories/behavior-repository").BehaviorRepository;

describe("BehaviorRepository", () => {
  let sqlite: Database;
  let testUserId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    const mod = await import("@/repositories/behavior-repository");
    BehaviorRepository = mod.BehaviorRepository;

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
        username: "testuser_behavior",
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
        name: "Saúde",
        type: "behavior",
      })
      .returning()
      .all();
    testCategoryId = cat.id;
  });

  afterEach(() => {
    testDb.delete(behaviors).run();
  });

  afterAll(() => {
    testDb.delete(categories).run();
    testDb.delete(users).run();
    sqlite.close();
  });

  it("deve criar um comportamento com sucesso", () => {
    const item = BehaviorRepository.create({
      userId: testUserId,
      categoryId: testCategoryId,
      content: "Beber 2L de água",
      icon: "water",
    });

    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.content).toBe("Beber 2L de água");
    expect(item.icon).toBe("water");
  });

  it("deve listar comportamentos do usuário carregando a categoria", async () => {
    BehaviorRepository.create({
      userId: testUserId,
      categoryId: testCategoryId,
      content: "Caminhar 30min",
      orderIndex: 1,
    });

    BehaviorRepository.create({
      userId: testUserId,
      categoryId: testCategoryId,
      content: "Alongamento",
      orderIndex: 2,
    });

    const list = await BehaviorRepository.findMany(testUserId);
    expect(list.length).toBeGreaterThan(2);
    expect(list[0].content).toBe("Caminhar 30min");
    expect(list[0].category).toBeDefined();
    expect(list[0].category?.name).toBe("Saúde");
    // Garante que itens padrão do JSON estão presentes ao final
    expect(list.some((item) => item.userId === null)).toBe(true);
  });

  it("deve buscar um comportamento por ID", async () => {
    const created = BehaviorRepository.create({
      userId: testUserId,
      content: "Meditar",
    });

    const found = await BehaviorRepository.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.content).toBe("Meditar");
  });

  it("deve atualizar um comportamento parcialmente", async () => {
    const created = BehaviorRepository.create({
      userId: testUserId,
      content: "Antes",
    });

    const updated = BehaviorRepository.update(created.id, {
      content: "Depois",
    });

    expect(updated.content).toBe("Depois");

    const found = await BehaviorRepository.findById(created.id);
    expect(found?.content).toBe("Depois");
  });

  it("deve propagar erros de validação sem executar a atualização", () => {
    expect(() => BehaviorRepository.update(1, { content: 123 } as any)).toThrow(ZodError);
  });

  it("deve informar quando não houver comportamento editável para o ID", () => {
    expect(() => BehaviorRepository.update(99999, { content: "Teste" })).toThrow(DatabaseException);
    expect(() => BehaviorRepository.update(99999, { content: "Teste" })).toThrow(
      "O comportamento não foi encontrado ou não pode ser alterado."
    );
  });

  it("deve aplicar soft delete no comportamento", async () => {
    const created = BehaviorRepository.create({
      userId: testUserId,
      content: "Para deletar",
    });

    await BehaviorRepository.delete(created.id);

    const found = await BehaviorRepository.findById(created.id);
    expect(found).toBeUndefined();

    // Registro ainda existe fisicamente no banco com deletedAt preenchido
    const raw = await testDb.query.behaviors.findFirst({
      where: eq(behaviors.id, created.id),
    });
    expect(raw).toBeDefined();
    expect(raw?.deletedAt).not.toBeNull();
  });
});
