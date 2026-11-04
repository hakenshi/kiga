import db from "@/lib/db";
import {
  behaviors,
  emotions,
  entryBehaviors,
  entryEmotions,
  entryImages,
  entryReactions,
  entryThoughts,
  journalEntries,
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
import { and, desc, eq, isNull } from "drizzle-orm";

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

export async function createJournalEntry(
  rawParams: CreateJournalEntryInput
): Promise<JournalEntryWithRelations> {
  const params: CreateJournalEntryOutput = createJournalEntrySchema.parse(rawParams);

  let moodRow: Mood | null = null;
  if (params.moodId) {
    const [existingMood] = await db
      .select()
      .from(moods)
      .where(eq(moods.id, params.moodId))
      .limit(1);

    if (existingMood) {
      moodRow = existingMood;
    } else {
      const [createdMood] = await db
        .insert(moods)
        .values({
          id: params.moodId,
          name: DEFAULT_MOOD_NAMES[params.moodId] ?? "Neutro",
          userId: null,
        })
        .returning();
      moodRow = createdMood ?? null;
    }
  }

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
    throw new Error("Falha ao registrar entry no banco de dados.");
  }

  const insertedEmotions: EntryEmotionWithRelation[] = [];
  if (params.emotions && params.emotions.length > 0) {
    for (const e of params.emotions) {
      let emotionRow: Emotion | undefined;
      if (e.id) {
        const [found] = await db
          .select()
          .from(emotions)
          .where(eq(emotions.id, e.id))
          .limit(1);
        emotionRow = found;
      } else if (e.name.trim()) {
        const [existing] = await db
          .select()
          .from(emotions)
          .where(and(eq(emotions.name, e.name.trim()), isNull(emotions.userId)))
          .limit(1);
        if (existing) {
          emotionRow = existing;
        } else {
          const [created] = await db
            .insert(emotions)
            .values({ name: e.name.trim(), userId: null })
            .returning();
          emotionRow = created;
        }
      }
      const emotionId = emotionRow?.id ?? e.id;
      if (emotionId) {
        const [piv] = await db
          .insert(entryEmotions)
          .values({
            entryId: entry.id,
            emotionId,
          })
          .returning();
        if (piv) {
          insertedEmotions.push({
            ...piv,
            emotion:
              emotionRow ?? {
                id: emotionId,
                name: e.name.trim(),
                userId: null,
                categoryId: null,
                orderIndex: 0,
                deletedAt: null,
              },
          });
        }
      }
    }
  }

  const insertedThoughts: EntryThoughtWithRelation[] = [];
  if (params.thoughts && params.thoughts.length > 0) {
    for (const t of params.thoughts) {
      let thoughtRow: Thought | undefined;
      if (t.id) {
        const [found] = await db
          .select()
          .from(thoughts)
          .where(eq(thoughts.id, t.id))
          .limit(1);
        thoughtRow = found;
      } else if (t.name.trim()) {
        const [existing] = await db
          .select()
          .from(thoughts)
          .where(and(eq(thoughts.name, t.name.trim()), isNull(thoughts.userId)))
          .limit(1);
        if (existing) {
          thoughtRow = existing;
        } else {
          const [created] = await db
            .insert(thoughts)
            .values({ name: t.name.trim(), userId: null })
            .returning();
          thoughtRow = created;
        }
      }
      const thoughtsId = thoughtRow?.id ?? t.id;
      if (thoughtsId) {
        const [piv] = await db
          .insert(entryThoughts)
          .values({
            entryId: entry.id,
            thoughtsId,
          })
          .returning();
        if (piv) {
          insertedThoughts.push({
            ...piv,
            thought:
              thoughtRow ?? {
                id: thoughtsId,
                name: t.name.trim(),
                userId: null,
                categoryId: null,
                orderIndex: 0,
                deletedAt: null,
              },
          });
        }
      }
    }
  }

  const insertedReactions: EntryReactionWithRelation[] = [];
  if (params.reactions && params.reactions.length > 0) {
    for (const r of params.reactions) {
      let reactionRow: Reaction | undefined;
      if (r.id) {
        const [found] = await db
          .select()
          .from(reactions)
          .where(eq(reactions.id, r.id))
          .limit(1);
        reactionRow = found;
      } else if (r.name.trim()) {
        const [existing] = await db
          .select()
          .from(reactions)
          .where(and(eq(reactions.name, r.name.trim()), isNull(reactions.userId)))
          .limit(1);
        if (existing) {
          reactionRow = existing;
        } else {
          const [created] = await db
            .insert(reactions)
            .values({ name: r.name.trim(), userId: null })
            .returning();
          reactionRow = created;
        }
      }
      const reactionId = reactionRow?.id ?? r.id;
      if (reactionId) {
        const [piv] = await db
          .insert(entryReactions)
          .values({
            entryId: entry.id,
            reactionId,
          })
          .returning();
        if (piv) {
          insertedReactions.push({
            ...piv,
            reaction:
              reactionRow ?? {
                id: reactionId,
                name: r.name.trim(),
                userId: null,
                categoryId: null,
                orderIndex: 0,
                deletedAt: null,
              },
          });
        }
      }
    }
  }

  const insertedBehaviors: EntryBehaviorWithRelation[] = [];
  if (params.behaviors && params.behaviors.length > 0) {
    for (const b of params.behaviors) {
      let behaviorRow: Behavior | undefined;
      if (b.id) {
        const [found] = await db
          .select()
          .from(behaviors)
          .where(eq(behaviors.id, b.id))
          .limit(1);
        behaviorRow = found;
      } else if (b.content?.trim()) {
        const [existing] = await db
          .select()
          .from(behaviors)
          .where(and(eq(behaviors.content, b.content.trim()), isNull(behaviors.userId)))
          .limit(1);
        if (existing) {
          behaviorRow = existing;
        } else {
          const [createdB] = await db
            .insert(behaviors)
            .values({
              userId: null,
              content: b.content.trim(),
              icon: b.icon ?? null,
              orderIndex: Date.now(),
            })
            .returning();
          behaviorRow = createdB;
        }
      }
      const bId = behaviorRow?.id ?? b.id;
      if (bId) {
        const [piv] = await db
          .insert(entryBehaviors)
          .values({
            entryId: entry.id,
            behaviorId: bId,
          })
          .returning();
        if (piv) {
          insertedBehaviors.push({
            ...piv,
            behavior:
              behaviorRow ?? {
                id: bId,
                content: b.content?.trim() ?? null,
                icon: b.icon ?? null,
                userId: null,
                categoryId: null,
                orderIndex: 0,
                deletedAt: null,
                createdAt: new Date(),
              },
          });
        }
      }
    }
  }

  const insertedImages: EntryImage[] = [];
  if (params.images && params.images.length > 0) {
    for (const imageUrl of params.images) {
      const trimmedUrl = imageUrl.trim();
      if (trimmedUrl) {
        const [createdImg] = await db
          .insert(entryImages)
          .values({
            entryId: entry.id,
            imageUrl: trimmedUrl,
          })
          .returning();
        if (createdImg) {
          insertedImages.push(createdImg);
        }
      }
    }
  }

  return {
    ...entry,
    mood: moodRow,
    entryEmotions: insertedEmotions,
    entryThoughts: insertedThoughts,
    entryReactions: insertedReactions,
    entryBehaviors: insertedBehaviors,
    entryImages: insertedImages,
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
      isNull(journalEntries.deletedAt)
    ),
    orderBy: [desc(journalEntries.date), desc(journalEntries.fixed), desc(journalEntries.id)],
    limit,
    offset,
    with: {
      mood: true,
      entryEmotions: { with: { emotion: true } },
      entryThoughts: { with: { thought: true } },
      entryBehaviors: { with: { behavior: true } },
      entryReactions: { with: { reaction: true } },
      entryImages: true,
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
    },
  });

  return (entry as JournalEntryWithRelations) ?? null;
}

export async function updateJournalEntry(
  rawParams: UpdateJournalEntryParams
): Promise<JournalEntryWithRelations> {
  const { entryId } = rawParams;

  if (rawParams.moodId) {
    const [existingMood] = await db
      .select()
      .from(moods)
      .where(eq(moods.id, rawParams.moodId))
      .limit(1);

    if (!existingMood) {
      await db
        .insert(moods)
        .values({
          id: rawParams.moodId,
          name: DEFAULT_MOOD_NAMES[rawParams.moodId] ?? "Neutro",
          userId: null,
        })
        .onConflictDoNothing();
    }
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
    const processedEmotionIds = new Set<number>();

    for (const e of rawParams.emotions) {
      let emotionRow: Emotion | undefined;
      if (e.id) {
        const [found] = await db
          .select()
          .from(emotions)
          .where(eq(emotions.id, e.id))
          .limit(1);
        emotionRow = found;
      } else if (e.name.trim()) {
        const [existing] = await db
          .select()
          .from(emotions)
          .where(and(eq(emotions.name, e.name.trim()), isNull(emotions.userId)))
          .limit(1);
        if (existing) {
          emotionRow = existing;
        } else {
          const [created] = await db
            .insert(emotions)
            .values({ name: e.name.trim(), userId: null })
            .returning();
          emotionRow = created;
        }
      }

      const emotionId = emotionRow?.id ?? e.id;
      if (emotionId && !processedEmotionIds.has(emotionId)) {
        processedEmotionIds.add(emotionId);
        await db
          .insert(entryEmotions)
          .values({
            entryId,
            emotionId,
          })
          .onConflictDoNothing();
      }
    }
  }

  if (rawParams.thoughts !== undefined) {
    await db.delete(entryThoughts).where(eq(entryThoughts.entryId, entryId));
    const processedThoughtIds = new Set<number>();

    for (const t of rawParams.thoughts) {
      let thoughtRow: Thought | undefined;
      if (t.id) {
        const [found] = await db
          .select()
          .from(thoughts)
          .where(eq(thoughts.id, t.id))
          .limit(1);
        thoughtRow = found;
      } else if (t.name.trim()) {
        const [existing] = await db
          .select()
          .from(thoughts)
          .where(and(eq(thoughts.name, t.name.trim()), isNull(thoughts.userId)))
          .limit(1);
        if (existing) {
          thoughtRow = existing;
        } else {
          const [created] = await db
            .insert(thoughts)
            .values({ name: t.name.trim(), userId: null })
            .returning();
          thoughtRow = created;
        }
      }

      const thoughtsId = thoughtRow?.id ?? t.id;
      if (thoughtsId && !processedThoughtIds.has(thoughtsId)) {
        processedThoughtIds.add(thoughtsId);
        await db
          .insert(entryThoughts)
          .values({
            entryId,
            thoughtsId,
          })
          .onConflictDoNothing();
      }
    }
  }

  if (rawParams.reactions !== undefined) {
    await db.delete(entryReactions).where(eq(entryReactions.entryId, entryId));
    const processedReactionIds = new Set<number>();

    for (const r of rawParams.reactions) {
      let reactionRow: Reaction | undefined;
      if (r.id) {
        const [found] = await db
          .select()
          .from(reactions)
          .where(eq(reactions.id, r.id))
          .limit(1);
        reactionRow = found;
      } else if (r.name.trim()) {
        const [existing] = await db
          .select()
          .from(reactions)
          .where(and(eq(reactions.name, r.name.trim()), isNull(reactions.userId)))
          .limit(1);
        if (existing) {
          reactionRow = existing;
        } else {
          const [created] = await db
            .insert(reactions)
            .values({ name: r.name.trim(), userId: null })
            .returning();
          reactionRow = created;
        }
      }

      const reactionId = reactionRow?.id ?? r.id;
      if (reactionId && !processedReactionIds.has(reactionId)) {
        processedReactionIds.add(reactionId);
        await db
          .insert(entryReactions)
          .values({
            entryId,
            reactionId,
          })
          .onConflictDoNothing();
      }
    }
  }

  if (rawParams.behaviors !== undefined) {
    await db.delete(entryBehaviors).where(eq(entryBehaviors.entryId, entryId));
    const processedBehaviorIds = new Set<number>();

    for (const b of rawParams.behaviors) {
      let behaviorRow: Behavior | undefined;
      if (b.id) {
        const [found] = await db
          .select()
          .from(behaviors)
          .where(eq(behaviors.id, b.id))
          .limit(1);
        behaviorRow = found;
      } else if (b.content?.trim()) {
        const [existing] = await db
          .select()
          .from(behaviors)
          .where(and(eq(behaviors.content, b.content.trim()), isNull(behaviors.userId)))
          .limit(1);
        if (existing) {
          behaviorRow = existing;
        } else {
          const [createdB] = await db
            .insert(behaviors)
            .values({
              userId: null,
              content: b.content.trim(),
              icon: b.icon ?? null,
              orderIndex: Date.now(),
            })
            .returning();
          behaviorRow = createdB;
        }
      }

      const bId = behaviorRow?.id ?? b.id;
      if (bId && !processedBehaviorIds.has(bId)) {
        processedBehaviorIds.add(bId);
        await db
          .insert(entryBehaviors)
          .values({
            entryId,
            behaviorId: bId,
          })
          .onConflictDoNothing();
      }
    }
  }

  if (rawParams.images !== undefined) {
    await db.delete(entryImages).where(eq(entryImages.entryId, entryId));
    const seenImages = new Set<string>();

    for (const imageUrl of rawParams.images) {
      const trimmedUrl = imageUrl.trim();
      if (trimmedUrl && !seenImages.has(trimmedUrl)) {
        seenImages.add(trimmedUrl);
        await db
          .insert(entryImages)
          .values({
            entryId,
            imageUrl: trimmedUrl,
          });
      }
    }
  }

  const updated = await getJournalEntryById(entryId);
  if (!updated) {
    throw new Error(`Entrada #${entryId} não encontrada após atualização.`);
  }

  return updated;
}
