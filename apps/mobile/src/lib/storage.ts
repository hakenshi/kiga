import type { StateStorage } from "zustand/middleware";

let dbInstance: any = null;
const memoryStore = new Map<string, string>();

function getDatabase() {
  if (dbInstance) return dbInstance;
  try {
    // Lazy require para não quebrar em ambientes de teste unitário sem módulos nativos do Expo
    const { expo } = require("./db");
    if (expo && typeof expo.execSync === "function") {
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS _app_kv (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      dbInstance = expo;
    }
  } catch {
    // Ambiente de teste ou runtime sem SQLite nativo
  }
  return dbInstance;
}

/**
 * Storage síncrono para Zustand apoiado pelo SQLite local (kiga.db).
 * Substitui o SecureStore/AsyncStorage sem precisar de novas dependências.
 */
export const appStorage: StateStorage = {
  getItem: (key: string): string | null => {
    const db = getDatabase();
    if (db) {
      try {
        const row = db.getFirstSync(
          "SELECT value FROM _app_kv WHERE key = ?",
          [key]
        ) as { value: string } | null;
        return row ? row.value : null;
      } catch (err) {
        console.error("appStorage.getItem error:", err);
      }
    }
    return memoryStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    const db = getDatabase();
    if (db) {
      try {
        db.runSync(
          "INSERT OR REPLACE INTO _app_kv (key, value) VALUES (?, ?)",
          [key, value]
        );
        return;
      } catch (err) {
        console.error("appStorage.setItem error:", err);
      }
    }
    memoryStore.set(key, value);
  },

  removeItem: (key: string): void => {
    const db = getDatabase();
    if (db) {
      try {
        db.runSync("DELETE FROM _app_kv WHERE key = ?", [key]);
        return;
      } catch (err) {
        console.error("appStorage.removeItem error:", err);
      }
    }
    memoryStore.delete(key);
  },
};
