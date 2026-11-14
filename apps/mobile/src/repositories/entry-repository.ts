import db from "@/lib/db";
import { entryBehaviors, entryEmotions, entryImages, entryReactions, entryReplies, entryReposts, entryThoughts, journalEntries } from "@/lib/db/schema";
import { entryBehaviorInsertSchema } from "@/lib/db/zod/schemas/entry/behavior.schema";
import { entryEmotionsInsertSchema } from "@/lib/db/zod/schemas/entry/emotion.schema";
import { entryImagesInsertSchema } from "@/lib/db/zod/schemas/entry/image.schema";
import { journalEntryInsertSchema, journalEntrySelectSchema, journalEntryUpdateSchema } from "@/lib/db/zod/schemas/entry/index.schema";
import { entryReactionsInsertSchema } from "@/lib/db/zod/schemas/entry/reaction.schema";
import { entryRepliesInsertSchema } from "@/lib/db/zod/schemas/entry/reply.schema";
import { entryRepostInsertSchema } from "@/lib/db/zod/schemas/entry/repost.schema";
import { entryThoughtsInsertSchema } from "@/lib/db/zod/schemas/entry/thought.schema";
import { DatabaseException } from "@/lib/exceptions/database/index.exception";
import { NotFoundException } from "@/lib/exceptions/not-found/index.exception";
import { and, desc, eq, isNull } from "drizzle-orm";
import { BaseRepository, Tx } from "./base-repository";

export interface EntryFilterOptions {
  userId: number;
}

export class EntryRepository extends BaseRepository {
  public static async findMany(userId: number, options: { limit: number, offset: number }): Promise<JournalEntry[]> {
    const { limit = 20, offset = 0 } = options
    const entries = await db.query.journalEntries.findMany({
      where: and(
        eq(journalEntries.userId, userId),
        isNull(journalEntries.deletedAt)
      ),
      orderBy: [desc(journalEntries.fixed), desc(journalEntries.deletedAt), desc(journalEntries.id)],
      limit,
      offset,
      with: {
        entryBehaviors: { with: { behavior: true } },
        entryEmotions: { with: { emotion: true } },
        entryImages: true,
        entryReactions: { with: { reaction: true } },
        entryThoughts: { with: { thought: true } },
        mood: true,
        thread: true,
        reposts: true
      },
    });
    return entries.map(entry => {
      const isRepost = entry.entryType === "repost";
      return journalEntrySelectSchema.parse({
        ...entry,
        isRepost,
        isPureRepost: isRepost && entry.content.trim().length === 0,
      });
    });
  }

  public static async findOne(entryId: number) {
    return this.readEntry(db, entryId);
  }

  private static readEntry(connection: typeof db | Tx, entryId: number): JournalEntry | undefined {
    const entry = connection.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.id, entryId),
        isNull(journalEntries.deletedAt)
      ),
      with: {
        entryBehaviors: { with: { behavior: true } },
        entryEmotions: { with: { emotion: true } },
        entryImages: true,
        entryReactions: { with: { reaction: true } },
        entryThoughts: { with: { thought: true } },
        mood: true,
        reposts: true,
        thread: true,
      },
    }).sync();
    if (!entry) return entry;
    const isRepost = entry.entryType === "repost";
    return journalEntrySelectSchema.parse({
      ...entry,
      isRepost,
      isPureRepost: isRepost && entry.content.trim().length === 0,
    });
  }
  public static search(query: string, filters: EntryFilterOptions): JournalEntry[] {
    const entries = db.query.journalEntries.findMany({
      where: and(
        eq(journalEntries.userId, filters.userId),
        isNull(journalEntries.deletedAt),
        this.searchText(journalEntries.content, query.trim()),
      ),
      orderBy: [desc(journalEntries.fixed), desc(journalEntries.deletedAt), desc(journalEntries.id)],
      with: {
        entryBehaviors: { with: { behavior: true } },
        entryEmotions: { with: { emotion: true } },
        entryImages: true,
        entryReactions: { with: { reaction: true } },
        entryThoughts: { with: { thought: true } },
        mood: true,
        thread: true,
        reposts: true,
      },
    }).sync();

    return entries.map(entry => {
      const isRepost = entry.entryType === "repost";
      return journalEntrySelectSchema.parse({
        ...entry,
        isRepost,
        isPureRepost: isRepost && entry.content.trim().length === 0,
      });
    });
  }
  public static create(data: JournalEntryInsert) {
    return db.transaction((tx) => {
      const [newEntry] = this.insert(tx, data, journalEntryInsertSchema, journalEntries)

      if (!newEntry) {
        throw new DatabaseException("Falha ao criar novo registro")
      }

      this.insertRelations(tx, newEntry.id, data)

      if (data.entryType === "reply") {
        this.reply(tx, newEntry.id)
      }
      else if (data.entryType === "repost") {
        this.repost(tx, newEntry.id)
      }

      const entry = this.readEntry(tx, newEntry.id);
      if (!entry) {
        throw new DatabaseException("Falha ao consultar o registro criado");
      }
      return entry;
    })
  }
  private static reply(tx: Tx, entryId: number) {
    this.insert(tx, { entryId }, entryRepliesInsertSchema, entryReplies)
  }
  private static repost(tx: Tx, entryId: number) {
    this.insert(tx, { entryId }, entryRepostInsertSchema, entryReposts)
  }

  private static insertRelations(tx: Tx, entryId: number, data: JournalEntryUpdate) {
    const { entryBehaviors: behaviors = [], entryEmotions: emotions = [], entryImages: images = [], entryReactions: reactions = [], entryThoughts: thoughts = [] } = data

    behaviors.forEach((behaviorId) => this.insert(tx, { entryId, behaviorId }, entryBehaviorInsertSchema, entryBehaviors))
    emotions.forEach((emotionId) => this.insert(tx, { entryId, emotionId }, entryEmotionsInsertSchema, entryEmotions))
    images.forEach((imageUrl) => this.insert(tx, { entryId, imageUrl }, entryImagesInsertSchema, entryImages))
    reactions.forEach((reactionId) => this.insert(tx, { entryId, reactionId }, entryReactionsInsertSchema, entryReactions))
    thoughts.forEach((thoughtsId) => this.insert(tx, { entryId, thoughtsId }, entryThoughtsInsertSchema, entryThoughts))
  }

  public static update(entryId: number, data: JournalEntryUpdate) {
    const values = journalEntryUpdateSchema.parse(data);
    const {
      entryBehaviors: behaviors,
      entryEmotions: emotions,
      entryImages: images,
      entryReactions: reactions,
      entryThoughts: thoughts,
      ...entryValues
    } = values;

    return db.transaction((tx) => {
      const [updatedEntry] = tx.update(journalEntries)
        .set({ ...entryValues, updatedAt: new Date() })
        .where(eq(journalEntries.id, entryId)).returning().all()

      if (!updatedEntry) {
        throw new NotFoundException("Não foi possível atualizar o relato: registro não encontrado.")
      }

      if (behaviors) tx.delete(entryBehaviors).where(eq(entryBehaviors.entryId, entryId)).run()
      if (emotions) tx.delete(entryEmotions).where(eq(entryEmotions.entryId, entryId)).run()
      if (images) tx.delete(entryImages).where(eq(entryImages.entryId, entryId)).run()
      if (reactions) tx.delete(entryReactions).where(eq(entryReactions.entryId, entryId)).run()
      if (thoughts) tx.delete(entryThoughts).where(eq(entryThoughts.entryId, entryId)).run()

      this.insertRelations(tx, entryId, values)

      const entry = this.readEntry(tx, entryId);
      if (!entry) {
        throw new DatabaseException("Falha ao consultar o registro atualizado");
      }
      return entry;
    })
  }
  public static async delete(entryId: number) {
    return await db.delete(journalEntries).where(eq(journalEntries.id, entryId)).returning()
  }
}
