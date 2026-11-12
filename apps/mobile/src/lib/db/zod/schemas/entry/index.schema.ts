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

export const journalEntryInsertSchema = createInsertSchema(journalEntries)
  .extend({
    behaviors: z.array(z.number()).optional(),
    emotions: z.array(z.number()).optional(),
    images: z.array(z.string()).optional(),
    reactions: z.array(z.number()).optional(),
    thoughts: z.array(z.number()).optional(),
  })

export const journalEntryUpdateSchema = journalEntryInsertSchema.partial();
