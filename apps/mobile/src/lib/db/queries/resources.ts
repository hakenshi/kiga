import { and, asc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import db from "../index";
import {
  behaviors,
  categories,
  emotions,
  reactions,
  thoughts,
  type CategoryType,
} from "../schema";
import type { Category, ResourceCategory, ResourceItem } from "../zod/zod-types";

export type { Category, ResourceCategory, ResourceItem };

export async function getUserCategories(
  type: CategoryType,
  userId?: number
): Promise<Category[]> {
  if (!userId) return [];

  return db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, type),
        eq(categories.userId, userId),
        isNull(categories.deletedAt)
      )
    )
    .orderBy(asc(categories.orderIndex), asc(categories.id));
}

export async function createCategoryItem(
  type: CategoryType,
  name: string,
  userId?: number
): Promise<Category> {
  const trimmed = name.trim();
  const [inserted] = await db
    .insert(categories)
    .values({
      name: trimmed,
      type,
      orderIndex: Date.now(),
      userId: userId ?? 1,
    })
    .returning();
  return inserted;
}

export async function resolveCategoryId(
  type: CategoryType,
  categoryNameOrId?: string | number | null,
  userId?: number
): Promise<{ id: number | null; name: string | null }> {
  if (categoryNameOrId === null || categoryNameOrId === undefined) {
    return { id: null, name: null };
  }

  if (typeof categoryNameOrId === "number") {
    const [existingById] = await db
      .select()
      .from(categories)
      .where(
        and(eq(categories.id, categoryNameOrId), isNull(categories.deletedAt))
      )
      .limit(1);
    return {
      id: existingById?.id ?? null,
      name: existingById?.name ?? null,
    };
  }

  const trimmed = categoryNameOrId.trim();
  if (!trimmed) {
    return { id: null, name: null };
  }

  const userCond = userId
    ? or(eq(categories.userId, userId), isNull(categories.userId))
    : isNull(categories.userId);

  const [existing] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, type),
        eq(categories.name, trimmed),
        isNull(categories.deletedAt),
        userCond
      )
    )
    .limit(1);

  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  const [inserted] = await db
    .insert(categories)
    .values({
      name: trimmed,
      type,
      orderIndex: 0,
      userId: null,
    })
    .returning();

  return { id: inserted.id, name: inserted.name };
}

export async function getUserResources(
  type: CategoryType,
  userId?: number
): Promise<ResourceItem[]> {
  if (!userId) return [];

  if (type === "thought") {
    return db
      .select({
        id: thoughts.id,
        name: thoughts.name,
        categoryId: thoughts.categoryId,
        categoryName: categories.name,
        orderIndex: thoughts.orderIndex,
        userId: thoughts.userId,
      })
      .from(thoughts)
      .leftJoin(
        categories,
        and(eq(thoughts.categoryId, categories.id), isNull(categories.deletedAt))
      )
      .where(and(isNull(thoughts.deletedAt), eq(thoughts.userId, userId)))
      .orderBy(asc(thoughts.orderIndex), asc(thoughts.id));
  }

  if (type === "emotion") {
    return db
      .select({
        id: emotions.id,
        name: emotions.name,
        categoryId: emotions.categoryId,
        categoryName: categories.name,
        orderIndex: emotions.orderIndex,
        userId: emotions.userId,
      })
      .from(emotions)
      .leftJoin(
        categories,
        and(eq(emotions.categoryId, categories.id), isNull(categories.deletedAt))
      )
      .where(and(isNull(emotions.deletedAt), eq(emotions.userId, userId)))
      .orderBy(asc(emotions.orderIndex), asc(emotions.id));
  }

  return db
    .select({
      id: reactions.id,
      name: reactions.name,
      categoryId: reactions.categoryId,
      categoryName: categories.name,
      orderIndex: reactions.orderIndex,
      userId: reactions.userId,
    })
    .from(reactions)
    .leftJoin(
      categories,
      and(eq(reactions.categoryId, categories.id), isNull(categories.deletedAt))
    )
    .where(and(isNull(reactions.deletedAt), eq(reactions.userId, userId)))
    .orderBy(asc(reactions.orderIndex), asc(reactions.id));
}

export async function createResourceItem(
  type: CategoryType,
  name: string,
  categoryNameOrId: string | number | null = null,
  userId?: number
): Promise<ResourceItem> {
  const trimmed = name.trim();
  const resolvedCat = await resolveCategoryId(type, categoryNameOrId, userId);

  const values = {
    name: trimmed,
    categoryId: resolvedCat.id,
    orderIndex: Date.now(),
    userId: userId ?? 1,
  };

  if (type === "emotion") {
    const [inserted] = await db.insert(emotions).values(values).returning();
    return { ...inserted, categoryName: resolvedCat.name };
  } else if (type === "thought") {
    const [inserted] = await db.insert(thoughts).values(values).returning();
    return { ...inserted, categoryName: resolvedCat.name };
  } else {
    const [inserted] = await db.insert(reactions).values(values).returning();
    return { ...inserted, categoryName: resolvedCat.name };
  }
}

export async function deleteResourceItems(type: CategoryType, ids: number[]) {
  if (ids.length === 0) return;
  const now = new Date();
  if (type === "emotion") {
    await db
      .update(emotions)
      .set({ deletedAt: now })
      .where(and(inArray(emotions.id, ids), isNotNull(emotions.userId)));
  } else if (type === "thought") {
    await db
      .update(thoughts)
      .set({ deletedAt: now })
      .where(and(inArray(thoughts.id, ids), isNotNull(thoughts.userId)));
  } else {
    await db
      .update(reactions)
      .set({ deletedAt: now })
      .where(and(inArray(reactions.id, ids), isNotNull(reactions.userId)));
  }
}

export async function deleteCategoryItem(categoryId: number) {
  const now = new Date();
  await db
    .update(categories)
    .set({ deletedAt: now })
    .where(and(eq(categories.id, categoryId), isNotNull(categories.userId)));

  await db
    .update(emotions)
    .set({ categoryId: null })
    .where(eq(emotions.categoryId, categoryId));
  await db
    .update(thoughts)
    .set({ categoryId: null })
    .where(eq(thoughts.categoryId, categoryId));
  await db
    .update(reactions)
    .set({ categoryId: null })
    .where(eq(reactions.categoryId, categoryId));
  await db
    .update(behaviors)
    .set({ categoryId: null })
    .where(eq(behaviors.categoryId, categoryId));
}
