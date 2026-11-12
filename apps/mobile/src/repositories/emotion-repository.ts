import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { emotions } from "@/lib/db/schema";
import {
  emotionInsertSchema,
  emotionUpdateSchema,
} from "@/lib/db/zod/schemas/emotion/index.schema";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

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

  public static async findMany(userId: number) {
    const userEmotions = await db.query.emotions.findMany({
      where: and(
        eq(emotions.userId, userId),
        isNull(emotions.deletedAt)
      ),
      orderBy: [asc(emotions.orderIndex), asc(emotions.id)],
      with: {
        category: true,
      },
    });

    const defaults = await db.query.emotions.findMany({
      where: and(
        isNull(emotions.userId),
        isNull(emotions.deletedAt),
      ),
      orderBy: [asc(emotions.orderIndex), asc(emotions.id)],
      with: {
        category: true,
      },
    })

    return [...userEmotions, ...defaults];
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

  public static async delete(id: number) {
    return await db
      .update(emotions)
      .set({ deletedAt: new Date() })
      .where(and(eq(emotions.id, id), isNotNull(emotions.userId)))
      .returning();
  }
}
