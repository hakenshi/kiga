import db from "@/lib/db";
import {
  behaviors,
  entryBehaviors,
  entryEmotions,
  entryReactions,
  entryThoughts,
  journalEntries,
} from "../schema";
import { createJournalEntrySchema } from "../zod/zod-schemas";
import type {
  CreateJournalEntryInput,
  CreateJournalEntryOutput,
  CreateJournalEntryParams,
} from "../zod/zod-types";
import { and, desc, eq, isNull } from "drizzle-orm";

export type { CreateJournalEntryInput, CreateJournalEntryOutput, CreateJournalEntryParams };

export async function createJournalEntry(rawParams: CreateJournalEntryInput) {
  const params: CreateJournalEntryOutput = createJournalEntrySchema.parse(rawParams);

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

  if (params.emotions && params.emotions.length > 0) {
    await db.insert(entryEmotions).values(
      params.emotions.map((e) => ({
        entryId: entry.id,
        emotionId: e.id,
      }))
    );
  }

  if (params.thoughts && params.thoughts.length > 0) {
    await db.insert(entryThoughts).values(
      params.thoughts.map((t) => ({
        entryId: entry.id,
        thoughtsId: t.id,
      }))
    );
  }

  if (params.reactions && params.reactions.length > 0) {
    await db.insert(entryReactions).values(
      params.reactions.map((r) => ({
        entryId: entry.id,
        reactionId: r.id,
      }))
    );
  }

  if (params.behaviors && params.behaviors.length > 0) {
    for (const b of params.behaviors) {
      let bId = b.id;
      if (!bId && b.content?.trim()) {
        const [createdB] = await db
          .insert(behaviors)
          .values({
            userId: params.userId,
            content: b.content.trim(),
            orderIndex: Date.now(),
          })
          .returning();
        bId = createdB?.id;
      }
      if (bId) {
        await db.insert(entryBehaviors).values({
          entryId: entry.id,
          behaviorId: bId,
        });
      }
    }
  }

  return entry;
}

export async function getJournalEntries(
  userId: number,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.userId, userId),
      isNull(journalEntries.deletedAt)
    ),
    orderBy: [desc(journalEntries.date), desc(journalEntries.id)],
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
  })

}
