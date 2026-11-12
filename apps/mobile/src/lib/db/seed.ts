import type { SQLiteDatabase } from "expo-sqlite";
import categories from "@/lib/data/categories.json";
import behaviors from "@/lib/data/behaviors.json";
import emotions from "@/lib/data/emotions.json";
import moods from "@/lib/data/moods.json";
import reactions from "@/lib/data/reactions.json";
import thoughts from "@/lib/data/thoughts.json";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";

export function seedDatabase(database: SQLiteDatabase) {
  database.withTransactionSync(() => {
    database.execSync("CREATE TABLE IF NOT EXISTS _kiga_seed (name TEXT PRIMARY KEY NOT NULL)");

    const seeded = database.getFirstSync<{ name: string }>(
      "SELECT name FROM _kiga_seed WHERE name = ?",
      "defaults"
    );
    if (seeded) return;

    const categoryIds = new Map<number, number>();

    for (const category of categories) {
      const result = database.runSync(
        "INSERT INTO categories (userId, type, name, orderIndex, createdAt, deletedAt) VALUES (?, ?, ?, ?, ?, ?)",
        category.userId, category.type, category.name, category.orderIndex,
        Math.floor(new Date(category.createdAt).getTime() / 1000), category.deletedAt
      );
      categoryIds.set(category.id, result.lastInsertRowId);
    }

    for (const behavior of behaviors) {
      const categoryId = categoryIds.get(behavior.categoryId);
      if (categoryId === undefined) throw new DatabaseException("Categoria padrão de comportamento não encontrada.");
      database.runSync(
        "INSERT INTO behaviors (userId, categoryId, content, icon, orderIndex, deletedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        behavior.userId, categoryId, behavior.content, behavior.icon, behavior.orderIndex,
        behavior.deletedAt, Math.floor(new Date(behavior.createdAt).getTime() / 1000)
      );
    }

    for (const emotion of emotions) {
      const categoryId = categoryIds.get(emotion.categoryId);
      if (categoryId === undefined) throw new DatabaseException("Categoria padrão de emoção não encontrada.");
      database.runSync(
        "INSERT INTO emotions (userId, categoryId, name, orderIndex, deletedAt) VALUES (?, ?, ?, ?, ?)",
        emotion.userId, categoryId, emotion.name, emotion.orderIndex, emotion.deletedAt
      );
    }

    for (const reaction of reactions) {
      const categoryId = categoryIds.get(reaction.categoryId);
      if (categoryId === undefined) throw new DatabaseException("Categoria padrão de reação não encontrada.");
      database.runSync(
        "INSERT INTO reactions (userId, categoryId, name, orderIndex, deletedAt) VALUES (?, ?, ?, ?, ?)",
        reaction.userId, categoryId, reaction.name, reaction.orderIndex, reaction.deletedAt
      );
    }

    for (const thought of thoughts) {
      database.runSync(
        "INSERT INTO thoughts (userId, categoryId, name, orderIndex, deletedAt) VALUES (?, ?, ?, ?, ?)",
        thought.userId, thought.categoryId, thought.name, thought.orderIndex, thought.deletedAt
      );
    }

    for (const mood of moods) {
      database.runSync(
        "INSERT INTO moods (userId, name, deletedAt) VALUES (?, ?, ?)",
        mood.userId, mood.name, mood.deletedAt
      );
    }

    database.runSync("INSERT INTO _kiga_seed (name) VALUES (?)", "defaults");
  });
}
