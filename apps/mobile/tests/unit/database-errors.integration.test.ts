import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdtempSync, readdirSync, readFileSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { users, behaviors, emotions, reactions, thoughts, journalEntries, entryBehaviors, entryEmotions, entryReactions, entryThoughts } from "@/lib/db/schema";
import { ConflictException } from "@/lib/exceptions/conflict/index.exception";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { DatabaseExceptionFilter } from "@/lib/exceptions/database/filter.exception";

describe("erros reais do SQLite", () => {
  let sqlite: Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    const directory = join(import.meta.dir, "../../drizzle");
    const files = readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();

    for (const file of files) {
      const statements = readFileSync(join(directory, file), "utf8").split("--> statement-breakpoint");
      for (const statement of statements) {
        if (statement.trim()) sqlite.run(statement);
      }
    }

    sqlite.run("PRAGMA foreign_keys = ON");
    db = drizzle(sqlite);
  });

  afterEach(() => sqlite.close());

  function captureError(operation: () => unknown): unknown {
    try {
      operation();
    } catch (error) {
      return error;
    }
    throw new Error("A operação deveria falhar");
  }

  function createUser(username: string) {
    return db.insert(users).values({
      firstName: "Teste",
      secondName: "Pessoa",
      username,
      password: "senha",
      pin: "1234",
      birthDate: new Date("1995-01-01"),
    }).returning().get();
  }

  it("identifica username duplicado na inserção e na atualização", () => {
    createUser("primeiro");
    const other = createUser("segundo");
    const insertError = captureError(() => createUser("primeiro"));
    const updateError = captureError(() => db.update(users).set({ username: "primeiro" }).where(eq(users.id, other.id)).run());

    for (const error of [insertError, updateError]) {
      const exception = DatabaseExceptionFilter.from(error);
      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe("O nome de usuário informado já está cadastrado em outra conta.");
    }
  });

  it("identifica vínculos duplicados para os quatro tipos de relação", () => {
    const user = createUser("pessoa");
    const entry = db.insert(journalEntries).values({ userId: user.id, content: "Relato" }).returning().get();
    const behavior = db.insert(behaviors).values({ userId: user.id }).returning().get();
    const emotion = db.insert(emotions).values({ userId: user.id, name: "Alegria" }).returning().get();
    const reaction = db.insert(reactions).values({ userId: user.id, name: "Sorriso" }).returning().get();
    const thought = db.insert(thoughts).values({ userId: user.id, name: "Pensamento" }).returning().get();
    const operations = [
      { insert: () => db.insert(entryBehaviors).values({ entryId: entry.id, behaviorId: behavior.id }).run(), message: "Este comportamento já foi vinculado a este relato." },
      { insert: () => db.insert(entryEmotions).values({ entryId: entry.id, emotionId: emotion.id }).run(), message: "Esta emoção já foi vinculada a este relato." },
      { insert: () => db.insert(entryReactions).values({ entryId: entry.id, reactionId: reaction.id }).run(), message: "Esta reação já foi vinculada a este relato." },
      { insert: () => db.insert(entryThoughts).values({ entryId: entry.id, thoughtsId: thought.id }).run(), message: "Este pensamento já foi vinculado a este relato." },
    ];

    for (const operation of operations) {
      operation.insert();
      const exception = DatabaseExceptionFilter.from(captureError(operation.insert));
      expect(exception).toBeInstanceOf(ConflictException);
      expect(exception.message).toBe(operation.message);
    }
  });

  it("identifica referência inexistente sem presumir qual relação falhou", () => {
    const error = captureError(() => db.insert(journalEntries).values({ userId: 99999, content: "Relato" }).run());
    const exception = DatabaseExceptionFilter.from(error);
    expect(exception).toBeInstanceOf(DatabaseException);
    expect(exception.message).toBe("Não foi possível concluir a operação por causa de um vínculo entre registros.");
  });

  it("identifica exclusão bloqueada por referência", () => {
    const user = createUser("pessoa");
    db.insert(behaviors).values({ userId: user.id }).run();
    const error = captureError(() => db.delete(users).where(eq(users.id, user.id)).run());
    const exception = DatabaseExceptionFilter.from(error);
    expect(exception).toBeInstanceOf(DatabaseException);
    expect(exception.message).toBe("Não foi possível concluir a operação por causa de um vínculo entre registros.");
  });

  it("identifica um banco ocupado por outra conexão", () => {
    const directory = mkdtempSync("/tmp/opencode/kiga-sqlite-");
    const path = join(directory, "locked.db");
    const first = new Database(path);
    const second = new Database(path);

    try {
      first.run("CREATE TABLE item (id INTEGER)");
      first.run("BEGIN EXCLUSIVE");
      second.run("PRAGMA busy_timeout = 0");
      const error = captureError(() => second.run("INSERT INTO item VALUES (1)"));
      const exception = DatabaseExceptionFilter.from(error);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe("O banco de dados está ocupado no momento. Tente novamente em instantes.");
    } finally {
      first.run("ROLLBACK");
      first.close();
      second.close();
      unlinkSync(path);
      rmdirSync(directory);
    }
  });

  it("identifica o erro SQLite de limite de espaço atingido", () => {
    const limited = new Database(":memory:");
    try {
      limited.run("PRAGMA max_page_count = 4");
      limited.run("CREATE TABLE item (data BLOB)");
      const error = captureError(() => limited.run("INSERT INTO item VALUES (zeroblob(1000000))"));
      const exception = DatabaseExceptionFilter.from(error);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe("Não há espaço suficiente para salvar as informações no banco de dados.");
    } finally {
      limited.close();
    }
  });
});
