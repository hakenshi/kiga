import { isNull } from "drizzle-orm";
import db from "./index";
import {
  behaviors,
  categories,
  emotions,
  moods,
  reactions,
  thoughts,
  type CategoryType,
} from "./schema";
import initialData from "../data/initial-data.json";

let hasInstalled = false;

export async function installSystemData(database = db): Promise<void> {
  if (hasInstalled) return;

  try {
    // Check if system categories already exist (userId is null)
    const existingCats = await database
      .select({ id: categories.id })
      .from(categories)
      .where(isNull(categories.userId))
      .limit(1);

    if (existingCats.length > 0) {
      hasInstalled = true;
      return;
    }

    // 1. Install Default Moods (userId: null)
    if (initialData.moods && initialData.moods.length > 0) {
      const existingMoods = await database
        .select({ id: moods.id })
        .from(moods)
        .where(isNull(moods.userId))
        .limit(1);

      if (existingMoods.length === 0) {
        await database.insert(moods).values(
          initialData.moods.map((m) => ({
            name: m.name,
            userId: null,
          }))
        );
      }
    }

    // 2. Install Categories and their items (userId: null)
    for (let cIdx = 0; cIdx < initialData.categories.length; cIdx++) {
      const cat = initialData.categories[cIdx];
      const type = cat.type as CategoryType;

      const [insertedCat] = await database
        .insert(categories)
        .values({
          name: cat.name,
          type,
          orderIndex: cIdx,
          userId: null,
        })
        .returning();

      if (!insertedCat) continue;

      if (type === "emotion") {
        const emotionItems = cat.items.map((item: any, iIdx: number) => ({
          name: typeof item === "string" ? item : item.name,
          categoryId: insertedCat.id,
          orderIndex: iIdx,
          userId: null,
        }));
        await database.insert(emotions).values(emotionItems);
      } else if (type === "reaction") {
        const reactionItems = cat.items.map((item: any, iIdx: number) => ({
          name: typeof item === "string" ? item : item.name,
          categoryId: insertedCat.id,
          orderIndex: iIdx,
          userId: null,
        }));
        await database.insert(reactions).values(reactionItems);
      } else if (type === "behavior") {
        const behaviorItems = cat.items.map((item: any, iIdx: number) => ({
          content: typeof item === "string" ? item : item.content,
          icon: typeof item === "object" ? item.icon ?? null : null,
          categoryId: insertedCat.id,
          orderIndex: iIdx,
          userId: null,
        }));
        await database.insert(behaviors).values(behaviorItems);
      }
    }

    // 3. Install Default Free Thoughts (userId: null)
    if (initialData.thoughts && initialData.thoughts.length > 0) {
      const existingThoughts = await database
        .select({ id: thoughts.id })
        .from(thoughts)
        .where(isNull(thoughts.userId))
        .limit(1);

      if (existingThoughts.length === 0) {
        await database.insert(thoughts).values(
          initialData.thoughts.map((name, idx) => ({
            name,
            categoryId: null,
            orderIndex: idx,
            userId: null,
          }))
        );
      }
    }

    hasInstalled = true;
  } catch (err) {
    console.error("Erro ao instalar dados iniciais do sistema:", err);
  }
}
