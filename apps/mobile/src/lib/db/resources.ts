import { and, asc, eq, isNull, or } from "drizzle-orm";
import db from "./index";
import {
  categories,
  emotions,
  reactions,
  thoughts,
  type CategoryType,
} from "./schema";
import { installSystemData } from "./install-system-data";

export interface ResourceItem {
  id: number;
  name: string;
  categoryId: number | null;
  orderIndex: number;
  userId: number | null;
}

export interface ResourceCategory {
  id: number;
  name: string;
  type: CategoryType;
  orderIndex: number;
  userId: number | null;
  items: ResourceItem[];
}

export async function getResourcesGrouped(
  type: CategoryType,
  userId?: number
): Promise<{ categories: ResourceCategory[]; uncategorized: ResourceItem[] }> {
  await installSystemData();

  const userCondition = userId
    ? or(isNull(categories.userId), eq(categories.userId, userId))
    : isNull(categories.userId);

  const cats = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, type),
        isNull(categories.deletedAt),
        userCondition
      )
    )
    .orderBy(asc(categories.orderIndex), asc(categories.id));

  let allItems: ResourceItem[] = [];

  const itemUserCondition = userId
    ? or(isNull(emotions.userId), eq(emotions.userId, userId))
    : isNull(emotions.userId);

  if (type === "thought") {
    const raw = await db
      .select({
        id: thoughts.id,
        name: thoughts.name,
        categoryId: thoughts.categoryId,
        orderIndex: thoughts.orderIndex,
        userId: thoughts.userId,
      })
      .from(thoughts)
      .where(and(isNull(thoughts.deletedAt), itemUserCondition))
      .orderBy(asc(thoughts.orderIndex), asc(thoughts.id));

    return {
      categories: [],
      uncategorized: raw,
    };
  }

  if (type === "emotion") {
    const raw = await db
      .select({
        id: emotions.id,
        name: emotions.name,
        categoryId: emotions.categoryId,
        orderIndex: emotions.orderIndex,
        userId: emotions.userId,
      })
      .from(emotions)
      .where(and(isNull(emotions.deletedAt), itemUserCondition))
      .orderBy(asc(emotions.orderIndex), asc(emotions.id));
    allItems = raw;
  } else if (type === "reaction") {
    const raw = await db
      .select({
        id: reactions.id,
        name: reactions.name,
        categoryId: reactions.categoryId,
        orderIndex: reactions.orderIndex,
        userId: reactions.userId,
      })
      .from(reactions)
      .where(and(isNull(reactions.deletedAt), itemUserCondition))
      .orderBy(asc(reactions.orderIndex), asc(reactions.id));
    allItems = raw;
  }

  const catMap = new Map<number, ResourceCategory>();
  for (const cat of cats) {
    catMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      type: cat.type,
      orderIndex: cat.orderIndex,
      userId: cat.userId,
      items: [],
    });
  }

  const uncategorized: ResourceItem[] = [];

  for (const item of allItems) {
    if (item.categoryId && catMap.has(item.categoryId)) {
      catMap.get(item.categoryId)!.items.push(item);
    } else {
      uncategorized.push(item);
    }
  }

  return {
    categories: Array.from(catMap.values()),
    uncategorized,
  };
}

export async function createResourceItem(
  type: CategoryType,
  name: string,
  categoryId: number | null = null,
  userId?: number
): Promise<ResourceItem> {
  const trimmed = name.trim();
  const values = {
    name: trimmed,
    categoryId: type === "thought" ? null : categoryId,
    orderIndex: Date.now(),
    userId: userId ?? null,
  };

  if (type === "emotion") {
    const [inserted] = await db.insert(emotions).values(values).returning();
    return inserted;
  } else if (type === "thought") {
    const [inserted] = await db.insert(thoughts).values(values).returning();
    return inserted;
  } else {
    const [inserted] = await db.insert(reactions).values(values).returning();
    return inserted;
  }
}

export async function createCategoryItem(
  type: CategoryType,
  name: string,
  userId?: number
) {
  const trimmed = name.trim();
  const [cat] = await db
    .insert(categories)
    .values({
      name: trimmed,
      type,
      orderIndex: Date.now(),
      userId: userId ?? null,
    })
    .returning();
  return cat;
}

export async function deleteResourceItem(type: CategoryType, id: number) {
  const now = new Date();
  if (type === "emotion") {
    await db.update(emotions).set({ deletedAt: now }).where(eq(emotions.id, id));
  } else if (type === "thought") {
    await db.update(thoughts).set({ deletedAt: now }).where(eq(thoughts.id, id));
  } else {
    await db.update(reactions).set({ deletedAt: now }).where(eq(reactions.id, id));
  }
}

export async function deleteCategoryItem(categoryId: number) {
  const now = new Date();
  await db
    .update(categories)
    .set({ deletedAt: now })
    .where(eq(categories.id, categoryId));

  // Move items to uncategorized
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
}

export async function updateItemCategoryAndOrder(
  type: CategoryType,
  itemId: number,
  categoryId: number | null,
  orderIndex: number
) {
  if (type === "emotion") {
    await db
      .update(emotions)
      .set({ categoryId, orderIndex })
      .where(eq(emotions.id, itemId));
  } else if (type === "thought") {
    await db
      .update(thoughts)
      .set({ categoryId, orderIndex })
      .where(eq(thoughts.id, itemId));
  } else {
    await db
      .update(reactions)
      .set({ categoryId, orderIndex })
      .where(eq(reactions.id, itemId));
  }
}
