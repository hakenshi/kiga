import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { categories, reactions } from "@/lib/db/schema";
import {
  reactionInsertSchema,
  reactionUpdateSchema,
} from "@/lib/db/zod/schemas/reaction/index.schema";
import { and, asc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export interface ReactionFilterOptions {
  userId: number;
  categoryId?: number;
}

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

  public static findMany(userId: number) {
    return this.search("", { userId });
  }

  public static search(query: string, filters: ReactionFilterOptions) {
    query = query.trim();
    const { userId, categoryId } = filters;
    const nameFilter = this.searchText(reactions.name, query);
    const categoryFilter = categoryId === undefined ? undefined : eq(categories.id, categoryId);
    const userReactions = db.query.categories.findMany({
      where: and(
        eq(categories.type, "reaction"),
        eq(categories.userId, userId),
        isNull(categories.deletedAt),
        categoryFilter,
      ),
      with: {
        reactions: {
          where: and(
            isNull(reactions.deletedAt),
            eq(reactions.userId, userId),
            nameFilter,
          ),
          orderBy: [asc(reactions.orderIndex), asc(reactions.id)],
        },
      },
    }).sync();

    const defaults = db.query.categories.findMany({
      where: and(
        eq(categories.type, "reaction"),
        isNull(categories.userId),
        isNull(categories.deletedAt),
        categoryFilter,
      ),
      with: {
        reactions: {
          where: and(
            isNull(reactions.deletedAt),
            or(isNull(reactions.userId), eq(reactions.userId, userId)),
            nameFilter,
          ),
          orderBy: [asc(reactions.orderIndex), asc(reactions.id)],
        },
      },

    }).sync()
    const results = [...userReactions, ...defaults];
    if (query === "") return results;
    return results.filter(category => category.reactions.length > 0);
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

  public static delete(ids: number[], userId: number) {
    return db
      .update(reactions)
      .set({ deletedAt: new Date() })
      .where(and(
        inArray(reactions.id, ids),
        eq(reactions.userId, userId),
      ))
      .returning().all();
  }
}
