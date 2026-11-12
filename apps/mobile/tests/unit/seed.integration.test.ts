import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SQLiteDatabase } from "expo-sqlite";
import { seedDatabase } from "@/lib/db/seed";
import categories from "@/lib/data/categories.json";
import emotions from "@/lib/data/emotions.json";
import behaviors from "@/lib/data/behaviors.json";
import moods from "@/lib/data/moods.json";
import reactions from "@/lib/data/reactions.json";
import thoughts from "@/lib/data/thoughts.json";

describe("seed do banco", () => {
  let sqlite: Database;
  let database: SQLiteDatabase;

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

    database = {
      withTransactionSync: (task: () => void) => sqlite.transaction(task)(),
      execSync: (sql: string) => sqlite.run(sql),
      getFirstSync: (sql: string, ...params: any[]) => sqlite.query(sql).get(...params),
      runSync: (sql: string, ...params: any[]) => {
        const result = sqlite.query(sql).run(...params);
        return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
      },
    } as unknown as SQLiteDatabase;
  });

  afterEach(() => sqlite.close());

  it("insere os padrões uma vez e deixa o SQLite atribuir os IDs", () => {
    sqlite.run("INSERT INTO categories (userId, type, name, orderIndex, createdAt) VALUES (NULL, 'emotion', 'Existente', 0, 0)");
    seedDatabase(database);
    seedDatabase(database);

    for (const [table, count] of [
      ["categories", categories.length + 1],
      ["behaviors", behaviors.length],
      ["emotions", emotions.length],
      ["moods", moods.length],
      ["reactions", reactions.length],
      ["thoughts", thoughts.length],
    ] as const) {
      expect(sqlite.query(`SELECT COUNT(*) AS count FROM ${table}`).get()).toEqual({ count });
    }

    const emotion = sqlite.query(`
      SELECT emotions.id, categories.name AS category
      FROM emotions JOIN categories ON emotions.categoryId = categories.id
      WHERE emotions.name = 'Ansiedade'
    `).get();
    expect(emotion).toEqual({ id: 1, category: "Medo" });
    expect(sqlite.query("SELECT id FROM categories WHERE name = 'Medo'").get()).toEqual({ id: 2 });
  });

  it("desfaz todas as inserções se ocorrer uma falha", () => {
    sqlite.run("CREATE TRIGGER fail_emotion BEFORE INSERT ON emotions BEGIN SELECT RAISE(ABORT, 'falha'); END");
    expect(() => seedDatabase(database)).toThrow();
    expect(sqlite.query("SELECT COUNT(*) AS count FROM categories").get()).toEqual({ count: 0 });
    expect(sqlite.query("SELECT COUNT(*) AS count FROM behaviors").get()).toEqual({ count: 0 });
  });
});
