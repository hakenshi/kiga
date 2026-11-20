import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "../../src/lib/db/schema";
import * as relations from "../../src/lib/db/relations";

// Nunca abre kiga.db: repositories reais, migrações reais, banco descartável.
export const sqlite = new Database(":memory:");
export const testDb = drizzle(sqlite, { schema: { ...schema, ...relations } });

migrate(testDb, { migrationsFolder: `${import.meta.dir}/../../drizzle` });
sqlite.exec("PRAGMA foreign_keys = ON");

export function resetDatabase() {
  const tables = sqlite.query<{ name: string }, []>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'",
  ).all();

  sqlite.exec("PRAGMA foreign_keys = OFF");
  try {
    sqlite.transaction(() => {
      for (const { name } of tables) sqlite.exec(`DELETE FROM "${name.replaceAll('"', '""')}"`);
      sqlite.exec("DELETE FROM sqlite_sequence");
    })();
  } finally {
    sqlite.exec("PRAGMA foreign_keys = ON");
  }
}
