import db from "@/lib/db";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { categories, CategoryType } from "@/lib/db/schema";
import defaultBehaviors from "@/lib/data/behaviors.json";
import defaultcategories from "@/lib/data/categories.json";
import defaultReactions from "@/lib/data/reactions.json";
import {
  categoryInsertSchema,
  categoryUpdateSchema,
} from "@/lib/db/zod/schemas/category/index.schema";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { BaseRepository } from "./base-repository";

export class CategoryRepository extends BaseRepository {
  public static create(data: CategoryInsert) {
    return db.transaction((tx) => {
      const [newCategory] = this.insert(tx, data, categoryInsertSchema, categories);

      if (!newCategory) {
        throw new DatabaseException("Falha ao criar categoria");
      }

      return newCategory;
    });
  }

  public static async findMany(userId: number, type?: CategoryType) {
    const userCategories = await db.query.categories.findMany({
      where: and(
        eq(categories.userId, userId),
        type ? eq(categories.type, type) : undefined,
        isNull(categories.deletedAt)
      ),
      orderBy: [asc(categories.orderIndex), asc(categories.id)],
    });

    const defaults = await db.query.categories.findMany({
      where: and(
        isNull(categories.userId),
        isNull(categories.deletedAt),
      ),
      orderBy: [asc(categories.orderIndex), asc(categories.id)],
    })

    return [...userCategories, ...defaults];
  }

  public static async findById(id: number) {
    return db.query.categories.findFirst({
      where: and(
        eq(categories.id, id),
        isNull(categories.deletedAt)
      ),
    });
  }

  public static update(id: number, data: CategoryUpdate) {
    const safeData = categoryUpdateSchema.safeParse(data);
    if (!safeData.success) {
      throw safeData.error;
    }

    return db.transaction((tx) => {
      const [updated] = tx
        .update(categories)
        .set(safeData.data)
        .where(and(eq(categories.id, id), isNotNull(categories.userId)))
        .returning()
        .all();

      if (!updated) {
        throw new DatabaseException("A categoria não foi encontrada ou não pode ser alterada.");
      }

      return updated;
    });
  }

  public static async delete(id: number) {
    return await db
      .update(categories)
      .set({ deletedAt: new Date() })
      .where(and(eq(categories.id, id), isNotNull(categories.userId)))
      .returning();
  }
}
