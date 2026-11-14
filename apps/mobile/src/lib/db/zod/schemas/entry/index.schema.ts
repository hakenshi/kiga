import {
  journalEntries,
} from "@/lib/db/schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import z from "zod";
import { entryEmotionsSelectSchema } from "@/lib/db/zod/schemas/entry/emotion.schema";
import { entryBehaviorSelectSchema } from "@/lib/db/zod/schemas/entry/behavior.schema";
import { entryReactionsSelectSchema } from "@/lib/db/zod/schemas/entry/reaction.schema";
import { entryRepliesSelectSchema } from "@/lib/db/zod/schemas/entry/reply.schema";
import { entryImagesSelectSchema } from "@/lib/db/zod/schemas/entry/image.schema";
import { entryRepostSelectSchema } from "@/lib/db/zod/schemas/entry/repost.schema";
import { entryThoughtsSelectSchema } from "@/lib/db/zod/schemas/entry/thought.schema";
import { behaviorSelectSchema } from "@/lib/db/zod/schemas/behavior/index.schema";
import { emotionSelectSchema } from "@/lib/db/zod/schemas/emotion/index.schema";
import { moodSelectSchema } from "@/lib/db/zod/schemas/mood/index.schema";
import { reactionSelectSchema } from "@/lib/db/zod/schemas/reaction/index.schema";
import { thoughtSelectSchema } from "@/lib/db/zod/schemas/thought/index.schema";

export const journalEntrySelectSchema = createSelectSchema(journalEntries).extend({
  entryBehaviors: entryBehaviorSelectSchema.extend({ behavior: behaviorSelectSchema }).array(),
  entryEmotions: entryEmotionsSelectSchema.extend({ emotion: emotionSelectSchema }).array(),
  entryImages: entryImagesSelectSchema.array(),
  entryReactions: entryReactionsSelectSchema.extend({ reaction: reactionSelectSchema }).array(),
  entryThoughts: entryThoughtsSelectSchema.extend({ thought: thoughtSelectSchema }).array(),
  mood: moodSelectSchema.nullable(),
  isRepost: z.boolean(),
  isPureRepost: z.boolean(),
  thread: entryRepliesSelectSchema.array(),
  reposts: entryRepostSelectSchema.array(),
});

const journalEntryInsertBaseSchema = createInsertSchema(journalEntries)
  .extend({
    entryBehaviors: z.array(z.number()).optional(),
    entryEmotions: z.array(z.number()).optional(),
    entryImages: z.array(z.string()).optional(),
    entryReactions: z.array(z.number()).optional(),
    entryThoughts: z.array(z.number()).optional(),
  }).omit({
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  })


export const journalEntryInsertSchema = journalEntryInsertBaseSchema.omit({
  id: true
})

export const journalEntryUpdateSchema = journalEntryInsertSchema.partial();
