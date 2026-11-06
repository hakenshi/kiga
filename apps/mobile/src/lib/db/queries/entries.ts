import db from "@/lib/db";
import {
  behaviors,
  emotions,
  entryBehaviors,
  entryEmotions,
  entryImages,
  entryReactions,
  entryReplies,
  entryReposts,
  entryThoughts,
  journalEntries,
  type JournalEntryType,
  moods,
  reactions,
  thoughts,
} from "../schema";
import { createJournalEntrySchema } from "../zod/zod-schemas";
import type {
  CreateJournalEntryInput,
  CreateJournalEntryOutput,
  CreateJournalEntryParams,
} from "../zod/zod-types";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";

export type { CreateJournalEntryInput, CreateJournalEntryOutput, CreateJournalEntryParams };

export type UpdateJournalEntryParams = {
  entryId: number;
  userId?: number;
  content: string;
  moodId?: number | null;
  date?: Date;
  emotions?: EntryEmotionItem[];
  thoughts?: EntryThoughtItem[];
  reactions?: EntryReactionItem[];
  behaviors?: EntryBehaviorItem[];
  images?: string[];
};

const DEFAULT_MOOD_NAMES: Record<number, string> = {
  1: "Muito Mal",
  2: "Mal",
  3: "Neutro",
  4: "Bem",
  5: "Muito Bem",
};

export interface EntryThreadResult {
  rootEntry: JournalEntryWithRelations;
  replies: JournalEntryWithRelations[];
}

export async function createJournalEntry(
  rawParams: CreateJournalEntryInput
): Promise<JournalEntryWithRelations> {
  const params: CreateJournalEntryOutput = createJournalEntrySchema.parse(rawParams);

  if (params.moodId) {
    await db
      .insert(moods)
      .values({
        id: params.moodId,
        name: DEFAULT_MOOD_NAMES[params.moodId] ?? "Neutro",
      })
      .onConflictDoNothing();
  }

  const [entry] = await db
    .insert(journalEntries)
    .values({
      userId: params.userId,
      moodId: params.moodId ?? null,
      liked: false,
      entryType: params.entryType ?? "post",
      content: params.content,
      date: params.date ?? new Date(),
    })
    .returning();

  if (!entry) {
    throw new Error("Falha ao registrar entry no banco de dados.");
  }

  if (params.parentEntryId) {
    if (params.entryType === "repost") {
      await db.insert(entryReposts).values({
        entryId: entry.id,
        parentEntryId: params.parentEntryId,
      });
    } else {
      const existingReply = await db.query.entryReplies.findFirst({
        where: eq(entryReplies.entryId, params.parentEntryId),
      });
      await db.insert(entryReplies).values({
        entryId: entry.id,
        parentEntryId: existingReply ? existingReply.parentEntryId : params.parentEntryId,
      });
    }
  }

  if (params.emotions && params.emotions.length > 0) {
    const valid = params.emotions.filter((e) => e.id);
    if (valid.length > 0) {
      await db
        .insert(entryEmotions)
        .values(valid.map((e) => ({ entryId: entry.id, emotionId: e.id! })))
        .onConflictDoNothing();
    }
  }

  if (params.thoughts && params.thoughts.length > 0) {
    const thoughtIds: number[] = [];
    for (const t of params.thoughts) {
      if (t.id) {
        thoughtIds.push(t.id);
      } else if (t.name?.trim()) {
        const [created] = await db
          .insert(thoughts)
          .values({ name: t.name.trim() })
          .onConflictDoNothing()
          .returning({ id: thoughts.id });
        if (created?.id) {
          thoughtIds.push(created.id);
        } else {
          const found = await db.query.thoughts.findFirst({ where: eq(thoughts.name, t.name.trim()) });
          if (found) thoughtIds.push(found.id);
        }
      }
    }
    if (thoughtIds.length > 0) {
      await db
        .insert(entryThoughts)
        .values(thoughtIds.map((id) => ({ entryId: entry.id, thoughtsId: id })))
        .onConflictDoNothing();
    }
  }

  if (params.reactions && params.reactions.length > 0) {
    const valid = params.reactions.filter((r) => r.id);
    if (valid.length > 0) {
      await db
        .insert(entryReactions)
        .values(valid.map((r) => ({ entryId: entry.id, reactionId: r.id! })))
        .onConflictDoNothing();
    }
  }

  if (params.behaviors && params.behaviors.length > 0) {
    const behaviorIds: number[] = [];
    for (const b of params.behaviors) {
      if (b.id) {
        behaviorIds.push(b.id);
      } else if (b.content?.trim()) {
        const [created] = await db
          .insert(behaviors)
          .values({ content: b.content.trim(), icon: b.icon ?? null })
          .returning({ id: behaviors.id });
        if (created?.id) behaviorIds.push(created.id);
      }
    }
    if (behaviorIds.length > 0) {
      await db
        .insert(entryBehaviors)
        .values(behaviorIds.map((id) => ({ entryId: entry.id, behaviorId: id })))
        .onConflictDoNothing();
    }
  }

  if (params.images && params.images.length > 0) {
    const uniqueImages = Array.from(new Set(params.images.map((img) => img.trim()).filter(Boolean)));
    if (uniqueImages.length > 0) {
      await db.insert(entryImages).values(
        uniqueImages.map((imageUrl) => ({ entryId: entry.id, imageUrl }))
      );
    }
  }

  const created = await getJournalEntryById(entry.id);
  if (!created) {
    throw new Error("Falha ao carregar relato recém-criado.");
  }

  return created;
}

export async function getParentEntry(
  entryId: number
): Promise<JournalEntryWithRelations | null> {
  const replyLink = await db.query.entryReplies.findFirst({
    where: eq(entryReplies.entryId, entryId),
  });
  if (replyLink) {
    return getJournalEntryById(replyLink.parentEntryId);
  }

  const repostLink = await db.query.entryReposts.findFirst({
    where: eq(entryReposts.entryId, entryId),
  });
  if (repostLink) {
    return getJournalEntryById(repostLink.parentEntryId);
  }

  return null;
}

export async function getEntryWithThread(
  entryId: number
): Promise<EntryThreadResult | null> {
  const entry = await getJournalEntryById(entryId);
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

  const rootEntry = rootId === entry.id ? entry : await getJournalEntryById(rootId);
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

export async function getJournalEntries(
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

export async function getJournalEntryById(
  entryId: number
): Promise<JournalEntryWithRelations | null> {
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

export async function updateJournalEntry(
  rawParams: UpdateJournalEntryParams
): Promise<JournalEntryWithRelations> {
  const { entryId } = rawParams;

  if (rawParams.moodId) {
    await db
      .insert(moods)
      .values({
        id: rawParams.moodId,
        name: DEFAULT_MOOD_NAMES[rawParams.moodId] ?? "Neutro",
      })
      .onConflictDoNothing();
  }

  await db
    .update(journalEntries)
    .set({
      content: rawParams.content,
      moodId: rawParams.moodId ?? null,
      ...(rawParams.date ? { date: rawParams.date } : {}),
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, entryId));

  if (rawParams.emotions !== undefined) {
    await db.delete(entryEmotions).where(eq(entryEmotions.entryId, entryId));
    const valid = rawParams.emotions.filter((e) => e.id);
    if (valid.length > 0) {
      await db
        .insert(entryEmotions)
        .values(valid.map((e) => ({ entryId, emotionId: e.id! })))
        .onConflictDoNothing();
    }
  }

  if (rawParams.thoughts !== undefined) {
    await db.delete(entryThoughts).where(eq(entryThoughts.entryId, entryId));
    const thoughtIds = rawParams.thoughts.filter((t) => t.id).map((t) => t.id!);
    if (thoughtIds.length > 0) {
      await db
        .insert(entryThoughts)
        .values(thoughtIds.map((id) => ({ entryId, thoughtsId: id })))
        .onConflictDoNothing();
    }
  }

  if (rawParams.reactions !== undefined) {
    await db.delete(entryReactions).where(eq(entryReactions.entryId, entryId));
    const valid = rawParams.reactions.filter((r) => r.id);
    if (valid.length > 0) {
      await db
        .insert(entryReactions)
        .values(valid.map((r) => ({ entryId, reactionId: r.id! })))
        .onConflictDoNothing();
    }
  }

  if (rawParams.behaviors !== undefined) {
    await db.delete(entryBehaviors).where(eq(entryBehaviors.entryId, entryId));
    const valid = rawParams.behaviors.filter((b) => b.id);
    if (valid.length > 0) {
      await db
        .insert(entryBehaviors)
        .values(valid.map((b) => ({ entryId, behaviorId: b.id! })))
        .onConflictDoNothing();
    }
  }

  if (rawParams.images !== undefined) {
    await db.delete(entryImages).where(eq(entryImages.entryId, entryId));
    const unique = Array.from(new Set(rawParams.images.map((img) => img.trim()).filter(Boolean)));
    if (unique.length > 0) {
      await db.insert(entryImages).values(unique.map((imageUrl) => ({ entryId, imageUrl })));
    }
  }

  const updated = await getJournalEntryById(entryId);
  if (!updated) {
    throw new Error(`Entrada #${entryId} não encontrada após atualização.`);
  }

  return updated;
}
