import { eq } from "drizzle-orm";
import { behaviors, categories, emotions, moods, reactions, seeds, thoughts, users, type CategoryType } from "./schema";
import db from ".";
import { defaultCategories } from "../data/categories";
import { defaultBehaviors } from "../data/behaviors";
import { defaultEmotions } from "../data/emotions";
import { defaultThoughts } from "../data/thoughts";
import { defaultReactions } from "../data/reactions";
import { defaultMoods } from "../data/moods";
import * as Crypto from "expo-crypto"

export function seedDatabase() {
  db.transaction(async tx => {
    console.log("began seeding process...")
    const applied = tx.select().from(seeds).where(eq(seeds.version, 1)).get()

    if (applied) {
      console.log("seeding process already concluded, exiting.")
      return
    }

    console.log("seeding user")

    const password = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, "123456")

    const [user] = await db.insert(users).values({
      gender: "male",
      pronoun: "he_him",
      birthDate: new Date("2003-08-18"),
      firstName: "Felipe",
      secondName: "Kafka",
      pin: "5123",
      password,
      username: "yoru",
    }).returning()

    if (!user) {
      console.log("failed to create user")
      return
    }

    console.log("user: ", user)

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
