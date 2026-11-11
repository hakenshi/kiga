import db from "@/lib/db"
import { entryBehaviors, entryEmotions, entryImages, entryReactions, entryReplies, entryReposts, entryThoughts, journalEntries } from "@/lib/db/schema"
import { journalEntryInsertSchema, journalEntryUpdateSchema } from "@/lib/db/zod/schemas/entry/index.schema"
import { entryBehaviorInsertSchema } from "@/lib/db/zod/schemas/entry/behavior.schema"
import { entryEmotionsInsertSchema } from "@/lib/db/zod/schemas/entry/emotion.schema"
import { entryImagesInsertSchema } from "@/lib/db/zod/schemas/entry/image.schema"
import { entryReactionsInsertSchema } from "@/lib/db/zod/schemas/entry/reaction.schema"
import { entryRepliesInsertSchema } from "@/lib/db/zod/schemas/entry/reply.schema"
import { entryRepostInsertSchema } from "@/lib/db/zod/schemas/entry/repost.schema"
import { entryThoughtsInsertSchema } from "@/lib/db/zod/schemas/entry/thought.schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import { BaseRepository, Tx } from "./base-repository"

export class EntryRepository extends BaseRepository {
  public static async findMany(userId: number, options: { limit: number, offset: number }) {
    const { limit = 20, offset = 0 } = options
    return db.query.journalEntries.findMany({
      where: and(
        eq(journalEntries.userId, userId),
        isNull(journalEntries.deletedAt)
      ),
      orderBy: [desc(journalEntries.fixed), desc(journalEntries.deletedAt), desc(journalEntries.id)],
      limit,
      offset,
      with: {
        entryBehaviors: true,
        entryEmotions: true,
        entryImages: true,
        entryReactions: true,
        entryThoughts: true,
        mood: true,
        reposts: true,
        thread: true,
      }
    })
  }

  public static async findOne(userId: number) {
    return db.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.userId, userId),
        isNull(journalEntries.deletedAt)
      ),
      orderBy: [desc(journalEntries.fixed), desc(journalEntries.deletedAt), desc(journalEntries.id)],
      with: {
        entryBehaviors: true,
        entryEmotions: true,
        entryImages: true,
        entryReactions: true,
        entryThoughts: true,
        mood: true,
        reposts: true,
        thread: true,
      }
    })
  }
  // public static search(query: string, filters: any) { }
  public static create(data: JournalEntryInsert) {
    return db.transaction((tx) => {
      const [newEntry] = this.insert(tx, data, journalEntryInsertSchema, journalEntries)

      if (!newEntry) {
        throw new Error("Falha ao criar novo registro")
      }

      this.insertRelations(tx, newEntry.id, data)

      if (data.entryType === "reply") {
        this.reply(tx, newEntry.id)
      }
      else if (data.entryType === "repost") {
        this.repost(tx, newEntry.id)
      }

      return newEntry
    })
  }
  private static reply(tx: Tx, entryId: number) {
    this.insert(tx, { entryId }, entryRepliesInsertSchema, entryReplies)
  }
  private static repost(tx: Tx, entryId: number) {
    this.insert(tx, { entryId }, entryRepostInsertSchema, entryReposts)
  }

  private static insertRelations(tx: Tx, entryId: number, data: JournalEntryUpdate) {
    const { behaviors = [], emotions = [], images = [], reactions = [], thoughts = [] } = data

    behaviors.forEach((behaviorId) => this.insert(tx, { entryId, behaviorId }, entryBehaviorInsertSchema, entryBehaviors))
    emotions.forEach((emotionId) => this.insert(tx, { entryId, emotionId }, entryEmotionsInsertSchema, entryEmotions))
    images.forEach((imageUrl) => this.insert(tx, { entryId, imageUrl }, entryImagesInsertSchema, entryImages))
    reactions.forEach((reactionId) => this.insert(tx, { entryId, reactionId }, entryReactionsInsertSchema, entryReactions))
    thoughts.forEach((thoughtsId) => this.insert(tx, { entryId, thoughtsId }, entryThoughtsInsertSchema, entryThoughts))
  }

  public static update(entryId: number, data: JournalEntryUpdate) {
    const safeData = journalEntryUpdateSchema.safeParse(data)
    if (!safeData.success) {
      throw new Error(safeData.error.message)
    }

    const values = safeData.data

    return db.transaction((tx) => {
      const [updatedEntry] = tx.update(journalEntries).set(values).where(eq(journalEntries.id, entryId)).returning().all()

      if (!updatedEntry) {
        throw new Error("Falha ao atualizar registro")
      }

      if (values.behaviors) tx.delete(entryBehaviors).where(eq(entryBehaviors.entryId, entryId)).run()
      if (values.emotions) tx.delete(entryEmotions).where(eq(entryEmotions.entryId, entryId)).run()
      if (values.images) tx.delete(entryImages).where(eq(entryImages.entryId, entryId)).run()
      if (values.reactions) tx.delete(entryReactions).where(eq(entryReactions.entryId, entryId)).run()
      if (values.thoughts) tx.delete(entryThoughts).where(eq(entryThoughts.entryId, entryId)).run()

      this.insertRelations(tx, entryId, values)

      return updatedEntry
    })
  }
  public static async delete(entryId: number) {
    return await db.delete(journalEntries).where(eq(journalEntries.id, entryId)).returning()
  }
}
