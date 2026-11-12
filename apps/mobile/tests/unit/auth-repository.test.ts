import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import * as relations from "@/lib/db/relations";
import { users } from "@/lib/db/schema";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";
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

let AuthRepository: typeof import("@/repositories/auth-repository").AuthRepository;

describe("AuthRepository", () => {
  let sqlite: Database;

  beforeAll(async () => {
    const mod = await import("@/repositories/auth-repository");
    AuthRepository = mod.AuthRepository;

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
  });

  const createParams = (overrides = {}) => ({
    firstName: "Teste",
    secondName: "Sobrenome",
    username: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    password: "hashedpassword123",
    pin: "1234",
    birthDate: new Date("2000-01-01"),
    gender: "prefer_not_to_say" as const,
    pronoun: "they_them" as const,
    ...overrides,
  });

  afterEach(() => {
    testDb.delete(users).run();
  });

  afterAll(() => {
    sqlite.close();
  });

  describe("register", () => {
    it("deve cadastrar um novo usuário com dados válidos", async () => {
      const user = AuthRepository.register({
        firstName: "Lucas",
        secondName: "Silva",
        username: "lucassilva",
        password: "hashedpassword123",
        pin: "1234",
        birthDate: new Date("2000-05-15"),
        gender: "male",
        pronoun: "he_him",
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe("lucassilva");
      expect(user.firstName).toBe("Lucas");

      const dbUser = await testDb.query.users.findFirst({
        where: eq(users.id, user.id),
      });
      expect(dbUser).toBeDefined();
    });

    it("deve lançar erro de validação Zod se faltarem dados obrigatórios", () => {
      expect(() => {
        AuthRepository.register({
          firstName: "",
          secondName: "Silva",
          username: "lu",
          password: "12",
          pin: "12",
          birthDate: new Date(),
        } as any);
      }).toThrow(ZodError);
    });

    it("deve rejeitar username duplicado por constraint unique", () => {
      AuthRepository.register(createParams({
        username: "duplicado",
      }));

      expect(() => {
        AuthRepository.register(createParams({
          username: "duplicado",
        }));
      }).toThrow();
    });
  });

  describe("findByUsername e findById", () => {
    it("deve encontrar usuário por username", async () => {
      const created = AuthRepository.register(createParams({
        username: "anasouza",
      }));

      const found = await AuthRepository.findByUsername("anasouza");
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe("anasouza");
    });

    it("deve retornar undefined se o username não existir", async () => {
      const found = await AuthRepository.findByUsername("naoexiste");
      expect(found).toBeUndefined();
    });

    it("deve encontrar usuário por ID", async () => {
      const created = AuthRepository.register(createParams({
        username: "carloslima",
      }));

      const found = await AuthRepository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.username).toBe("carloslima");
    });
  });

  describe("updateProfile", () => {
    it("deve atualizar campos parciais do perfil", async () => {
      const created = AuthRepository.register(createParams({
        firstName: "Julia",
        secondName: "Melo",
        username: "juliamelo",
      }));

      const updated = AuthRepository.updateProfile(created.id, {
        firstName: "Juliana",
        gender: "female",
      });

      expect(updated.firstName).toBe("Juliana");
      expect(updated.secondName).toBe("Melo");
      expect(updated.gender).toBe("female");

      const dbUser = await testDb.query.users.findFirst({
        where: eq(users.id, created.id),
      });
      expect(dbUser?.firstName).toBe("Juliana");
    });

    it("deve falhar se o id do usuário não existir", () => {
      expect(() => {
        AuthRepository.updateProfile(99999, {
          firstName: "Fantasma",
        });
      }).toThrow(NotFoundException);
    });
  });

  describe("deleteAccount", () => {
    it("deve remover o usuário do banco", async () => {
      const created = AuthRepository.register(createParams({
        username: "marcosrocha",
      }));

      await AuthRepository.deleteAccount(created.id);

      const found = await AuthRepository.findById(created.id);
      expect(found).toBeUndefined();
    });
  });
});
