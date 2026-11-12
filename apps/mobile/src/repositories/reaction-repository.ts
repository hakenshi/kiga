import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { reactions } from "@/lib/db/schema";
import {
  reactionInsertSchema,
  reactionUpdateSchema,
} from "@/lib/db/zod/schemas/reaction/index.schema";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export class ReactionRepository extends BaseRepository {
  public static create(data: ReactionInsert) {
    return db.transaction((tx) => {
      const [newReaction] = this.insert(tx, data, reactionInsertSchema, reactions);

      if (!newReaction) {
        throw new DatabaseException("Falha ao criar reação");
      }

      return newReaction;
    });
  }

  public static async findMany(userId: number) {
    const userReactions = await db.query.reactions.findMany({
      where: and(
        eq(reactions.userId, userId),
        isNull(reactions.deletedAt)
      ),
      orderBy: [asc(reactions.orderIndex), asc(reactions.id)],
      with: {
        category: true,
      },
    });

    const defaults = await db.query.reactions.findMany({
      where: and(
        isNull(reactions.userId),
        isNull(reactions.deletedAt)
      ),
      orderBy: [asc(reactions.orderIndex), asc(reactions.id)],
      with: {
        category: true,
      },

    })
    return [...userReactions, ...defaults];
  }

  public static async findById(id: number) {
    return db.query.reactions.findFirst({
      where: and(
        eq(reactions.id, id),
        isNull(reactions.deletedAt)
      ),
      with: {
        category: true,
      },
    });
  }

  public static update(id: number, data: ReactionUpdate) {
    const safeData = reactionUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(reactions)
        .set(safeData.data)
        .where(and(eq(reactions.id, id), isNotNull(reactions.userId)))
        .returning()
        .all();

      if (!updated) {
        throw new DatabaseException("A reação não foi encontrada ou não pode ser alterada.");
      }

      return updated;
    });
  }

  public static async delete(id: number) {
    return await db
      .update(reactions)
      .set({ deletedAt: new Date() })
      .where(and(eq(reactions.id, id), isNotNull(reactions.userId)))
      .returning();
  }
}
