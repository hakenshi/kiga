import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import db from "@/lib/db";
import { behaviors, categories } from "@/lib/db/schema";
import { resolveCategoryId } from "./resource-repository";
import type { BehaviorCategory, BehaviorItem } from "@/lib/db/zod/zod-types";

export type { BehaviorCategory, BehaviorItem };

export async function getUserBehaviors(
  userId?: number
): Promise<BehaviorItem[]> {
  if (!userId) return [];

  const rawItems = await db
    .select({
      id: behaviors.id,
      content: behaviors.content,
      icon: behaviors.icon,
      categoryId: behaviors.categoryId,
      categoryName: categories.name,
      userId: behaviors.userId,
      orderIndex: behaviors.orderIndex,
    })
    .from(behaviors)
    .leftJoin(
      categories,
      and(eq(behaviors.categoryId, categories.id), isNull(categories.deletedAt))
    )
    .where(
      and(
        isNull(behaviors.deletedAt),
        eq(behaviors.userId, userId),
        isNotNull(behaviors.icon)
      )
    )
    .orderBy(asc(behaviors.orderIndex), asc(behaviors.id));

  return rawItems.map((item) => ({
    id: item.id,
    content: item.content || "",
    icon: item.icon,
    categoryId: item.categoryId,
    categoryName: item.categoryName ?? null,
    userId: item.userId,
    orderIndex: item.orderIndex,
  }));
}

export async function createBehavior(
  content: string,
  icon?: string | null,
  categoryNameOrId?: string | number | null,
  userId?: number
): Promise<BehaviorItem> {
  const trimmed = content.trim();
  const resolvedCat = await resolveCategoryId(
    "behavior",
    categoryNameOrId,
    userId
  );

  const [inserted] = await db
    .insert(behaviors)
    .values({
      content: trimmed,
      icon: icon || null,
      categoryId: resolvedCat.id,
      orderIndex: Date.now(),
      userId: userId ?? 1,
    })
    .returning();

  return {
    id: inserted.id,
    content: inserted.content || "",
    icon: inserted.icon,
    categoryId: inserted.categoryId,
    categoryName: resolvedCat.name,
    userId: inserted.userId,
    orderIndex: inserted.orderIndex,
  };
}

export async function deleteBehaviors(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(behaviors)
    .set({ deletedAt: new Date() })
    .where(and(inArray(behaviors.id, ids), isNotNull(behaviors.userId)));
}
