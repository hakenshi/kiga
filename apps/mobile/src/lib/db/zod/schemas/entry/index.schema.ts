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

export const journalEntrySelectSchema = createSelectSchema(journalEntries).extend({
  entryBehaviors: entryBehaviorSelectSchema.array(),
  entryEmotions: entryEmotionsSelectSchema.array(),
  entryImages: entryImagesSelectSchema.array(),
  entryReactions: entryReactionsSelectSchema.array(),
  entryThoughts: entryThoughtsSelectSchema.array(),
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
