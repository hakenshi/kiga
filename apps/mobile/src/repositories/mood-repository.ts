import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { moods } from "@/lib/db/schema";
import defaultMoods from "@/lib/data/moods.json";
import {
  moodInsertSchema,
  moodUpdateSchema,
} from "@/lib/db/zod/schemas/mood/index.schema";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export class MoodRepository extends BaseRepository {
  public static create(data: MoodInsert) {
    return db.transaction((tx) => {
      const [newMood] = this.insert(tx, data, moodInsertSchema, moods);

      if (!newMood) {
        throw new DatabaseException("Falha ao criar humor");
      }

      return newMood;
    });
  }

  public static async findMany(userId: number) {
    const userMoods = await db.query.moods.findMany({
      where: and(
        eq(moods.userId, userId),
        isNull(moods.deletedAt)
      ),
      orderBy: [asc(moods.id)],
    });

    const defaultMoods = await this.findDefaults(moods)
    return [...userMoods, ...defaultMoods];
  }

  public static async findById(id: number) {
    return db.query.moods.findFirst({
      where: and(
        eq(moods.id, id),
        isNull(moods.deletedAt)
      ),
    });
  }

  public static update(id: number, data: MoodUpdate) {
    const safeData = moodUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(moods)
        .set(safeData.data)
        .where(and(eq(moods.id, id), isNotNull(moods.userId)))
        .returning()
        .all();

      if (!updated) {
        throw new DatabaseException("O humor não foi encontrado ou não pode ser alterado.");
      }

      return updated;
    });
  }

  public static async delete(id: number) {
    return await db
      .update(moods)
      .set({ deletedAt: new Date() })
      .where(and(eq(moods.id, id), isNotNull(moods.userId)))
      .returning();
  }
}
