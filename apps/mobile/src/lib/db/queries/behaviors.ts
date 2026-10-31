import { and, asc, eq, isNull, or } from "drizzle-orm";
import db from "../index";
import { behaviors, categories } from "../schema";
import { installSystemData } from "../install-system-data";
import type { BehaviorCategory, BehaviorItem } from "../zod/zod-types";

export type { BehaviorCategory, BehaviorItem };

export async function getBehaviorsGrouped(
  userId?: number
): Promise<{ categories: BehaviorCategory[]; uncategorized: BehaviorItem[] }> {
  await installSystemData();

  // Behavior categories are system-provided (userId is null) or user custom
  const userCondition = userId
    ? or(isNull(categories.userId), eq(categories.userId, userId))
    : isNull(categories.userId);

  const cats = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, "behavior"),
        isNull(categories.deletedAt),
        userCondition
      )
    )
    .orderBy(asc(categories.orderIndex), asc(categories.id));

  const itemUserCondition = userId
    ? or(isNull(behaviors.userId), eq(behaviors.userId, userId))
    : isNull(behaviors.userId);

  const rawItems = await db
    .select({
      id: behaviors.id,
      content: behaviors.content,
      icon: behaviors.icon,
      categoryId: behaviors.categoryId,
      userId: behaviors.userId,
      orderIndex: behaviors.orderIndex,
    })
    .from(behaviors)
    .where(and(isNull(behaviors.deletedAt), itemUserCondition))
    .orderBy(asc(behaviors.orderIndex), asc(behaviors.id));

  const catMap = new Map<number, BehaviorCategory>();
  for (const cat of cats) {
    catMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      orderIndex: cat.orderIndex,
      items: [],
    });
  }

  const uncategorized: BehaviorItem[] = [];

  for (const item of rawItems) {
    const safeItem: BehaviorItem = {
      id: item.id,
      content: item.content || "",
      icon: item.icon,
      categoryId: item.categoryId,
      userId: item.userId,
      orderIndex: item.orderIndex,
    };

    if (item.categoryId && catMap.has(item.categoryId)) {
      catMap.get(item.categoryId)!.items.push(safeItem);
    } else {
      uncategorized.push(safeItem);
    }
  }

  return {
    categories: Array.from(catMap.values()),
    uncategorized,
  };
}

export async function createBehavior(
  content: string,
  icon?: string | null,
  categoryId?: number | null,
  userId?: number
): Promise<BehaviorItem> {
  const trimmed = content.trim();
  const [inserted] = await db
    .insert(behaviors)
    .values({
      content: trimmed,
      icon: icon || null,
      categoryId: categoryId || null,
      orderIndex: Date.now(),
      userId: userId ?? null,
    })
    .returning();

  return {
    id: inserted.id,
    content: inserted.content || "",
    icon: inserted.icon,
    categoryId: inserted.categoryId,
    userId: inserted.userId,
    orderIndex: inserted.orderIndex,
  };
}

export async function deleteBehavior(id: number): Promise<void> {
  await db
    .update(behaviors)
    .set({ deletedAt: new Date() })
    .where(eq(behaviors.id, id));
}
