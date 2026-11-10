import db from "@/lib/db";
import {
  entryBehaviors,
  entryEmotions,
  entryImages,
  entryReactions,
  entryReplies,
  entryReposts,
  entryThoughts,
  journalEntries,
  moods,
} from "@/lib/db/schema";
import {
  createJournalEntrySchema,
  createPostSchema,
  createReplySchema,
  createRepostSchema,
  journalEntryUpdateSchema,
  updateJournalEntryParamsSchema,
} from "@/lib/db/zod/zod-schemas";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";

export abstract class EntryRepository {
  private static readonly DEFAULT_MOOD_NAMES: Record<number, string> = {
    1: "Muito Mal",
    2: "Mal",
    3: "Neutro",
    4: "Bem",
    5: "Muito Bem",
  };

  private static async ensureMood(moodId?: number | null): Promise<void> {
    if (!moodId) return;
    await db
      .insert(moods)
      .values({
        id: moodId,
        name: EntryRepository.DEFAULT_MOOD_NAMES[moodId] ?? "Neutro",
      })
      .onConflictDoNothing();
  }

  private static async syncRelations(
    entryId: number,
    relations: {
      emotions?: EntryEmotionItem[];
      thoughts?: EntryThoughtItem[];
      reactions?: EntryReactionItem[];
      behaviors?: EntryBehaviorItem[];
      images?: string[];
    },
    options: { replace?: boolean } = {}
  ): Promise<void> {
    const { replace = false } = options;

    if (replace) {
      if (relations.emotions !== undefined) await db.delete(entryEmotions).where(eq(entryEmotions.entryId, entryId));
      if (relations.thoughts !== undefined) await db.delete(entryThoughts).where(eq(entryThoughts.entryId, entryId));
      if (relations.reactions !== undefined) await db.delete(entryReactions).where(eq(entryReactions.entryId, entryId));
      if (relations.behaviors !== undefined) await db.delete(entryBehaviors).where(eq(entryBehaviors.entryId, entryId));
      if (relations.images !== undefined) await db.delete(entryImages).where(eq(entryImages.entryId, entryId));
    }

    const emotionIds = relations.emotions?.map((e) => e.id).filter((id): id is number => typeof id === "number") ?? [];
    if (emotionIds.length > 0) {
      await db.insert(entryEmotions).values(emotionIds.map((emotionId) => ({ entryId, emotionId }))).onConflictDoNothing();
    }

    const thoughtIds = relations.thoughts?.map((t) => t.id).filter((id): id is number => typeof id === "number") ?? [];
    if (thoughtIds.length > 0) {
      await db.insert(entryThoughts).values(thoughtIds.map((thoughtsId) => ({ entryId, thoughtsId }))).onConflictDoNothing();
    }

    const reactionIds = relations.reactions?.map((r) => r.id).filter((id): id is number => typeof id === "number") ?? [];
    if (reactionIds.length > 0) {
      await db.insert(entryReactions).values(reactionIds.map((reactionId) => ({ entryId, reactionId }))).onConflictDoNothing();
    }

    const behaviorIds = relations.behaviors?.map((b) => b.id).filter((id): id is number => typeof id === "number") ?? [];
    if (behaviorIds.length > 0) {
      await db.insert(entryBehaviors).values(behaviorIds.map((behaviorId) => ({ entryId, behaviorId }))).onConflictDoNothing();
    }

    const images = relations.images?.map((img) => img.trim()).filter(Boolean) ?? [];
    if (images.length > 0) {
      await db.insert(entryImages).values(images.map((imageUrl) => ({ entryId, imageUrl })));
    }
  }

  static async createPost(rawParams: CreatePostInput): Promise<JournalEntryWithRelations> {
    const params: CreatePostOutput = createPostSchema.parse(rawParams);
    await EntryRepository.ensureMood(params.moodId);

    const [entry] = await db
      .insert(journalEntries)
      .values({
        userId: params.userId,
        moodId: params.moodId ?? null,
        liked: false,
        entryType: "post",
        content: params.content,
        date: params.date ?? new Date(),
      })
      .returning();

    if (!entry) {
      throw new Error("Falha ao registrar relato no banco de dados.");
    }

    await EntryRepository.syncRelations(entry.id, params);

    const created = await EntryRepository.getById(entry.id);
    if (!created) {
      throw new Error("Falha ao carregar relato recém-criado.");
    }
    return created;
  }

  static async createReply(rawParams: CreateReplyInput): Promise<JournalEntryWithRelations> {
    const params: CreateReplyOutput = createReplySchema.parse(rawParams);
    await EntryRepository.ensureMood(params.moodId);

    const [entry] = await db
      .insert(journalEntries)
      .values({
        userId: params.userId,
        moodId: params.moodId ?? null,
        liked: false,
        entryType: "reply",
        content: params.content,
        date: params.date ?? new Date(),
      })
      .returning();

    if (!entry) {
      throw new Error("Falha ao registrar resposta no banco de dados.");
    }

    const existingReply = await db.query.entryReplies.findFirst({
      where: eq(entryReplies.entryId, params.parentEntryId),
    });
    await db.insert(entryReplies).values({
      entryId: entry.id,
      parentEntryId: existingReply ? existingReply.parentEntryId : params.parentEntryId,
    });

    await EntryRepository.syncRelations(entry.id, params);

    const created = await EntryRepository.getById(entry.id);
    if (!created) {
      throw new Error("Falha ao carregar reflexão recém-criada.");
    }
    return created;
  }

  static async createRepost(rawParams: CreateRepostInput): Promise<JournalEntryWithRelations> {
    const params: CreateRepostOutput = createRepostSchema.parse(rawParams);
    await EntryRepository.ensureMood(params.moodId);

    const [entry] = await db
      .insert(journalEntries)
      .values({
        userId: params.userId,
        moodId: params.moodId ?? null,
        liked: false,
        entryType: "repost",
        content: params.content ?? "",
        date: params.date ?? new Date(),
      })
      .returning();

    if (!entry) {
      throw new Error("Falha ao registrar republicação no banco de dados.");
    }

    await db.insert(entryReposts).values({
      entryId: entry.id,
      parentEntryId: params.parentEntryId,
    });

    await EntryRepository.syncRelations(entry.id, params);

    const created = await EntryRepository.getById(entry.id);
    if (!created) {
      throw new Error("Falha ao carregar momento revisitado recém-criado.");
    }
    return created;
  }

  static async createJournalEntry(
    rawParams: CreateJournalEntryInput
  ): Promise<JournalEntryWithRelations> {
    const params: CreateJournalEntryOutput = createJournalEntrySchema.parse(rawParams);

    if (params.entryType === "repost" && params.parentEntryId) {
      return EntryRepository.createRepost({
        ...params,
        parentEntryId: params.parentEntryId,
      });
    }

    if (params.entryType === "reply" && params.parentEntryId) {
      return EntryRepository.createReply({
        ...params,
        parentEntryId: params.parentEntryId,
      });
    }

    return EntryRepository.createPost(params);
  }

  static async update(
    rawParams: UpdateJournalEntryInput
  ): Promise<JournalEntryWithRelations> {
    const params: UpdateJournalEntryOutput = updateJournalEntryParamsSchema.parse(rawParams);
    const { entryId } = params;

    await EntryRepository.ensureMood(params.moodId);

    await db
      .update(journalEntries)
      .set({
        ...(params.content !== undefined ? { content: params.content } : {}),
        ...(params.moodId !== undefined ? { moodId: params.moodId } : {}),
        ...(params.date !== undefined ? { date: params.date } : {}),
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, entryId));

    await EntryRepository.syncRelations(entryId, params, { replace: true });

    const updated = await EntryRepository.getById(entryId);
    if (!updated) {
      throw new Error(`Entrada #${entryId} não encontrada após atualização.`);
    }

    return updated;
  }

  static async updatePartial(
    entryId: number,
    newEntryData: UpdateJournalEntryPartialInput
  ): Promise<void> {
    const data = journalEntryUpdateSchema.parse(newEntryData);
    await db
      .update(journalEntries)
      .set(data)
      .where(eq(journalEntries.id, entryId));
  }

  static async delete(entryId: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
  }

  static async getById(entryId: number): Promise<JournalEntryWithRelations | null> {
    const entry = await db.query.journalEntries.findFirst({
      where: and(
        eq(journalEntries.id, entryId),
        isNull(journalEntries.deletedAt)
      ),
      with: {
        mood: true,
        entryEmotions: { with: { emotion: true } },
        entryThoughts: { with: { thought: true } },
        entryBehaviors: { with: { behavior: true } },
        entryReactions: { with: { reaction: true } },
        entryImages: true,
        parentRepost: {
          with: {
            parentEntry: {
              with: {
                mood: true,
                entryEmotions: { with: { emotion: true } },
                entryThoughts: { with: { thought: true } },
                entryBehaviors: { with: { behavior: true } },
                entryReactions: { with: { reaction: true } },
                entryImages: true,
              },
            },
          },
        },
        parentReply: {
          with: {
            parentEntry: {
              with: {
                mood: true,
                entryEmotions: { with: { emotion: true } },
                entryThoughts: { with: { thought: true } },
                entryBehaviors: { with: { behavior: true } },
                entryReactions: { with: { reaction: true } },
                entryImages: true,
              },
            },
          },
        },
      },
    });

    return (entry as JournalEntryWithRelations) ?? null;
  }

  static async getParent(
    entryId: number
  ): Promise<JournalEntryWithRelations | null> {
    const replyLink = await db.query.entryReplies.findFirst({
      where: eq(entryReplies.entryId, entryId),
    });
    if (replyLink) {
      return EntryRepository.getById(replyLink.parentEntryId);
    }

    const repostLink = await db.query.entryReposts.findFirst({
      where: eq(entryReposts.entryId, entryId),
    });
    if (repostLink) {
      return EntryRepository.getById(repostLink.parentEntryId);
    }

    return null;
  }

  static async getThread(
    entryId: number
  ): Promise<EntryThreadResult | null> {
    const entry = await EntryRepository.getById(entryId);
    if (!entry) return null;

    let rootId = entry.id;
    if (entry.entryType === "reply") {
      const parentLink = await db.query.entryReplies.findFirst({
        where: eq(entryReplies.entryId, entry.id),
      });
      if (parentLink) {
        rootId = parentLink.parentEntryId;
      }
    }

    const rootEntry = rootId === entry.id ? entry : await EntryRepository.getById(rootId);
    if (!rootEntry) return null;

    const replyLinks = await db.query.entryReplies.findMany({
      where: eq(entryReplies.parentEntryId, rootId),
    });

    const replyEntryIds = replyLinks.map((r) => r.entryId);
    if (replyEntryIds.length === 0) {
      return { rootEntry, replies: [] };
    }

    const allReplies = await db.query.journalEntries.findMany({
      where: and(
        inArray(journalEntries.id, replyEntryIds),
        eq(journalEntries.entryType, "reply"),
        isNull(journalEntries.deletedAt)
      ),
      orderBy: [asc(journalEntries.date), asc(journalEntries.id)],
      with: {
        mood: true,
        entryEmotions: { with: { emotion: true } },
        entryThoughts: { with: { thought: true } },
        entryBehaviors: { with: { behavior: true } },
        entryReactions: { with: { reaction: true } },
        entryImages: true,
      },
    });

    return {
      rootEntry,
      replies: (allReplies as JournalEntryWithRelations[]) ?? [],
    };
  }

  static async getFeed(
    userId: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<JournalEntryWithRelations[]> {
    const { limit = 20, offset = 0 } = options;

    return db.query.journalEntries.findMany({
      where: and(
        eq(journalEntries.userId, userId),
        isNull(journalEntries.deletedAt),
        or(
          eq(journalEntries.entryType, "post"),
          eq(journalEntries.entryType, "repost"),
          isNull(journalEntries.entryType)
        )
      ),
      orderBy: [desc(journalEntries.fixed), desc(journalEntries.date), desc(journalEntries.id)],
      limit,
      offset,
      with: {
        mood: true,
        entryEmotions: { with: { emotion: true } },
        entryThoughts: { with: { thought: true } },
        entryBehaviors: { with: { behavior: true } },
        entryReactions: { with: { reaction: true } },
        entryImages: true,
        parentRepost: {
          with: {
            parentEntry: {
              with: {
                mood: true,
                entryEmotions: { with: { emotion: true } },
                entryThoughts: { with: { thought: true } },
                entryBehaviors: { with: { behavior: true } },
                entryReactions: { with: { reaction: true } },
                entryImages: true,
              },
            },
          },
        },
        parentReply: {
          with: {
            parentEntry: {
              with: {
                mood: true,
                entryEmotions: { with: { emotion: true } },
                entryThoughts: { with: { thought: true } },
                entryBehaviors: { with: { behavior: true } },
                entryReactions: { with: { reaction: true } },
                entryImages: true,
              },
            },
          },
        },
      },
    });
  }
}

// ─── ALIASES PARA COMPATIBILIDADE E CONVENIÊNCIA ───────────────────────────
export const createPost = EntryRepository.createPost;
export const createReply = EntryRepository.createReply;
export const createRepost = EntryRepository.createRepost;
export const createJournalEntry = EntryRepository.createJournalEntry;
export const updateJournalEntry = EntryRepository.update;
export const deleteJournalEntry = EntryRepository.delete;
export const updateEntryPartial = EntryRepository.updatePartial;
export const getJournalEntries = EntryRepository.getFeed;
export const getJournalEntryById = EntryRepository.getById;
export const getEntryWithThread = EntryRepository.getThread;
export const getParentEntry = EntryRepository.getParent;
