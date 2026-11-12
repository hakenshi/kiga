import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { thoughts } from "@/lib/db/schema";
import {
  thoughtInsertSchema,
  thoughtUpdateSchema,
} from "@/lib/db/zod/schemas/thought/index.schema";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export class ThoughtRepository extends BaseRepository {
  public static create(data: ThoughtInsert) {
    return db.transaction((tx) => {
      const [newThought] = this.insert(tx, data, thoughtInsertSchema, thoughts);

      if (!newThought) {
        throw new DatabaseException("Falha ao criar pensamento");
      }

      return newThought;
    });
  }

  public static async findMany(userId: number) {
    const userThoughts = await db.query.thoughts.findMany({
      where: and(
        eq(thoughts.userId, userId),
        isNull(thoughts.deletedAt)
      ),
      orderBy: [asc(thoughts.orderIndex), asc(thoughts.id)],
      with: {
        category: true,
      },
    });

    const defaults = await db.query.thoughts.findMany({
      where: and(
        isNull(thoughts.userId),
        isNull(thoughts.deletedAt),
      ),
      orderBy: [asc(thoughts.orderIndex), asc(thoughts.id)],
      with: {
        category: true,
      },
    })

    return [...userThoughts, ...defaults];
  }

  public static async findById(id: number) {
    return db.query.thoughts.findFirst({
      where: and(
        eq(thoughts.id, id),
        isNull(thoughts.deletedAt)
      ),
      with: {
        category: true,
      },
    });
  }

  public static update(id: number, data: ThoughtUpdate) {
    const safeData = thoughtUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(thoughts)
        .set(safeData.data)
        .where(and(eq(thoughts.id, id), isNotNull(thoughts.userId)))
        .returning()
        .all();

      if (!updated) {
        throw new DatabaseException("O pensamento não foi encontrado ou não pode ser alterado.");
      }

      return updated;
    });
  }

  public static async delete(id: number) {
    return await db
      .update(thoughts)
      .set({ deletedAt: new Date() })
      .where(and(eq(thoughts.id, id), isNotNull(thoughts.userId)))
      .returning();
  }
}
