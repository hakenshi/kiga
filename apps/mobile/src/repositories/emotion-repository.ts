import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { categories, emotions } from "@/lib/db/schema";
import {
  emotionInsertSchema,
  emotionUpdateSchema,
} from "@/lib/db/zod/schemas/emotion/index.schema";
import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export interface EmotionFilterOptions {
  userId: number;
  categoryId?: number;
}

export class EmotionRepository extends BaseRepository {
  public static create(data: EmotionInsert) {
    return db.transaction((tx) => {
      const [newEmotion] = this.insert(tx, data, emotionInsertSchema, emotions);

      if (!newEmotion) {
        throw new DatabaseException("Falha ao criar emoção");
      }

      return newEmotion;
    });
  }

  public static findMany(userId: number) {
    return this.search("", { userId });
  }

  public static search(query: string, filters: EmotionFilterOptions) {
    query = query.trim();
    const { userId, categoryId } = filters;
    const nameFilter = this.searchText(emotions.name, query);
    const categoryFilter = categoryId === undefined ? undefined : eq(categories.id, categoryId);
    const userEmotions = db.query.categories.findMany({
      where: and(
        eq(categories.type, "emotion"),
        eq(categories.userId, userId),
        isNull(categories.deletedAt),
        categoryFilter,
      ),
      with: {
        emotions: {
          where: and(
            isNull(emotions.deletedAt),
            eq(emotions.userId, userId),
            nameFilter,
          )
        }
      }
    }).sync()

    const defaults = db.query.categories.findMany({
      where: and(
        eq(categories.type, "emotion"),
        isNull(categories.userId),
        isNull(categories.deletedAt),
        categoryFilter,
      ),
      with: {
        emotions: {
          where: and(
            isNull(emotions.deletedAt),
            or(isNull(emotions.userId), eq(emotions.userId, userId)),
            nameFilter,
          )
        }
      }
    }).sync()
    const results = [...userEmotions, ...defaults];
    if (query === "") return results;
    return results.filter(category => category.emotions.length > 0);
  }
  public static async findById(id: number) {
    return db.query.emotions.findFirst({
      where: and(
        eq(emotions.id, id),
        isNull(emotions.deletedAt)
      ),
      with: {
        category: true,
      },
    });
  }

  public static update(id: number, data: EmotionUpdate) {
    const safeData = emotionUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(emotions)
        .set(safeData.data)
        .where(and(eq(emotions.id, id), isNotNull(emotions.userId)))
        .returning()
        .all();

      if (!updated) {
        throw new DatabaseException("A emoção não foi encontrada ou não pode ser alterada.");
      }

      return updated;
    });
  }

  public static delete(ids: number[], userId: number) {
    return db
      .update(emotions)
      .set({ deletedAt: new Date() })
      .where(and(
        inArray(emotions.id, ids),
        eq(emotions.userId, userId),
      ))
      .returning().all();
  }
}
