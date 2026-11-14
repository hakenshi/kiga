import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { behaviors, categories } from "@/lib/db/schema";
import {
  behaviorInsertSchema,
  behaviorUpdateSchema,
} from "@/lib/db/zod/schemas/behavior/index.schema";
import { and, asc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export interface BehaviorFilterOptions {
  userId: number;
  categoryId?: number;
}

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

  public static findMany(userId: number) {
    return this.search("", { userId });
  }

  public static async search(query: string, filters: BehaviorFilterOptions) {
    query = query.trim();
    const { userId, categoryId } = filters;
    const contentFilter = this.searchText(behaviors.content, query);
    const categoryFilter = categoryId === undefined ? undefined : eq(categories.id, categoryId);
    const userBehaviors = await db.query.categories.findMany({
      where: and(
        eq(categories.type, "behavior"),
        eq(categories.userId, userId),
        isNull(categories.deletedAt),
        categoryFilter,
      ),
      with: {
        behaviors: {
          where: and(
            isNull(behaviors.deletedAt),
            eq(behaviors.userId, userId),
            contentFilter,
          ),
          orderBy: [asc(behaviors.orderIndex), asc(behaviors.id)],
        },
      },
    });

    const defaults = await db.query.categories.findMany({
      where: and(
        eq(categories.type, "behavior"),
        isNull(categories.userId),
        isNull(categories.deletedAt),
        categoryFilter,
      ),
      with: {
        behaviors: {
          where: and(
            isNull(behaviors.deletedAt),
            or(isNull(behaviors.userId), eq(behaviors.userId, userId)),
            contentFilter,
          ),
          orderBy: [asc(behaviors.orderIndex), asc(behaviors.id)],
        },
      },
    })

    const results = [...userBehaviors, ...defaults];
    if (query === "") return results;
    return results.filter(category => category.behaviors.length > 0);
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

  public static delete(ids: number[], userId: number) {
    return db
      .update(behaviors)
      .set({ deletedAt: new Date() })
      .where(and(
        inArray(behaviors.id, ids),
        eq(behaviors.userId, userId),
      ))
      .returning().all();
  }
}
