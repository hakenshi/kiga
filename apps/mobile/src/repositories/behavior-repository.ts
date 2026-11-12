import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { behaviors } from "@/lib/db/schema";
import defaultBehaviors from "@/lib/data/behaviors.json";
import {
  behaviorInsertSchema,
  behaviorUpdateSchema,
} from "@/lib/db/zod/schemas/behavior/index.schema";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export class BehaviorRepository extends BaseRepository {
  public static create(data: BehaviorInsert) {
    return db.transaction((tx) => {
      const [newBehavior] = this.insert(tx, data, behaviorInsertSchema, behaviors);

      if (!newBehavior) {
        throw new DatabaseException("Falha ao criar comportamento");
      }

      return newBehavior;
    });
  }

  public static async findMany(userId: number) {
    const userBehaviors = await db.query.behaviors.findMany({
      where: and(
        eq(behaviors.userId, userId),
        isNull(behaviors.deletedAt)
      ),
      orderBy: [asc(behaviors.orderIndex), asc(behaviors.id)],
      with: {
        category: true,
      },
    });

    const defaults = await db.query.behaviors.findMany({
      where: and(
        isNull(behaviors.userId),
        isNull(behaviors.deletedAt),
      ),
      orderBy: [asc(behaviors.orderIndex), asc(behaviors.id)],
    })

    return [...userBehaviors, ...defaults];
  }

  public static async findById(id: number) {
    return db.query.behaviors.findFirst({
      where: and(
        eq(behaviors.id, id),
        isNull(behaviors.deletedAt)
      ),
      with: {
        category: true,
      },
    });
  }

  public static update(id: number, data: BehaviorUpdate) {
    const safeData = behaviorUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(behaviors)
        .set(safeData.data)
        .where(and(eq(behaviors.id, id), isNotNull(behaviors.userId)))
        .returning()
        .all();

      if (!updated) {
        throw new DatabaseException("O comportamento não foi encontrado ou não pode ser alterado.");
      }

      return updated;
    });
  }

  public static async delete(id: number) {
    return await db
      .update(behaviors)
      .set({ deletedAt: new Date() })
      .where(and(eq(behaviors.id, id), isNotNull(behaviors.userId)))
      .returning();
  }
}
