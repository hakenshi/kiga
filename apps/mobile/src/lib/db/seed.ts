import { eq } from "drizzle-orm";
import { behaviors, categories, emotions, moods, reactions, seeds, thoughts, type CategoryType } from "./schema";
import db from ".";
import { defaultCategories } from "../data/categories";
import { defaultBehaviors } from "../data/behaviors";
import { defaultEmotions } from "../data/emotions";
import { defaultThoughts } from "../data/thoughts";
import { defaultReactions } from "../data/reactions";
import { defaultMoods } from "../data/moods";

export function seedDatabase() {
  db.transaction(tx => {
    console.log("began seeding process...")
    const applied = tx.select().from(seeds).where(eq(seeds.version, 1)).get()

    if (applied) {
      console.log("seeding process already concluded, exiting.")
      return
    }


    console.log("seeding categories")

    const seededCategories: { id: number; type: CategoryType }[] = []
    defaultCategories.forEach(category => {
      seededCategories.push(tx.insert(categories).values(category).returning({ id: categories.id, type: categories.type }).get())
    })
    console.table(seededCategories)
    console.log("seeding behaviors")
    const seededBehaviors = defaultBehaviors.map(behavior => {
      const category = seededCategories[behavior.categoryId - 1]
      console.log(category)
      if (!category || category.type !== "behavior") throw new Error("Categoria de comportamento não encontrada no seed")
      return { ...behavior, categoryId: category.id }
    })
    console.table(seededBehaviors)
    console.log("seeding emotions: ")
    const seededEmotions = defaultEmotions.map(emotion => {
      const category = seededCategories[emotion.categoryId - 1]
      console.log(category)
      if (!category || category.type !== "emotion") throw new Error("Categoria de emoção não encontrada no seed")
      return { ...emotion, categoryId: category.id }
    })
    console.table(seededEmotions)
    console.log("seeding reactions: ")
    const seededReactions = defaultReactions.map(reaction => {
      const category = seededCategories[reaction.categoryId - 1]
      console.log(category)
      if (!category || category.type !== "reaction") throw new Error("Categoria de reação não encontrada no seed")
      return { ...reaction, categoryId: category.id }
    })
    console.table(seededReactions)
    console.log("inserting values onto behaviors")
    tx.insert(behaviors).values(seededBehaviors).run()
    console.log("inserting values onto emotions")
    tx.insert(emotions).values(seededEmotions).run()
    console.log("inserting values onto reactions")
    tx.insert(reactions).values(seededReactions).run()
    console.log("inserting values onto thoughts")
    tx.insert(thoughts).values(defaultThoughts).run()
    console.log("inserting moods")
    tx.insert(moods).values(defaultMoods).run()

    console.log("inserting seed versioning.")
    tx.insert(seeds).values({ version: 1 }).run()
    console.log("seed concluded.")
  })
}
