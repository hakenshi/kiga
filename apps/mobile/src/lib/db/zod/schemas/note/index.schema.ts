import { notes } from "@/lib/db/schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import z from "zod";
import { noteEmotionsSelectSchema } from "@/lib/db/zod/schemas/note/emotion.schema";
import { noteBehaviorSelectSchema } from "@/lib/db/zod/schemas/note/behavior.schema";
import { noteReactionsSelectSchema } from "@/lib/db/zod/schemas/note/reaction.schema";
import { noteRepliesSelectSchema } from "@/lib/db/zod/schemas/note/reply.schema";
import { noteImagesSelectSchema } from "@/lib/db/zod/schemas/note/image.schema";
import { noteRepostSelectSchema } from "@/lib/db/zod/schemas/note/repost.schema";
import { noteThoughtsSelectSchema } from "@/lib/db/zod/schemas/note/thought.schema";
import { behaviorSelectSchema } from "@/lib/db/zod/schemas/behavior/index.schema";
import { emotionSelectSchema } from "@/lib/db/zod/schemas/emotion/index.schema";
import { moodSelectSchema } from "@/lib/db/zod/schemas/mood/index.schema";
import { reactionSelectSchema } from "@/lib/db/zod/schemas/reaction/index.schema";
import { thoughtSelectSchema } from "@/lib/db/zod/schemas/thought/index.schema";

const noteSelectBaseSchema = createSelectSchema(notes).extend({
  noteBehaviors: noteBehaviorSelectSchema.extend({ behavior: behaviorSelectSchema }).array(),
  noteEmotions: noteEmotionsSelectSchema.extend({ emotion: emotionSelectSchema }).array(),
  noteImages: noteImagesSelectSchema.array(),
  noteReactions: noteReactionsSelectSchema.extend({ reaction: reactionSelectSchema }).array(),
  noteThoughts: noteThoughtsSelectSchema.extend({ thought: thoughtSelectSchema }).array(),
  mood: moodSelectSchema.nullable(),
  isRepost: z.boolean(),
  isPureRepost: z.boolean(),
  reposts: noteRepostSelectSchema.array(),
});

export const noteReplySelectSchema = noteSelectBaseSchema.extend({
  thread: z.tuple([]).default([]),
});

export const noteSelectSchema = noteSelectBaseSchema.extend({
  thread: noteRepliesSelectSchema.extend({ reply: noteReplySelectSchema }).array(),
});

const noteInsertBaseSchema = createInsertSchema(notes)
  .extend({
    noteBehaviors: z.array(z.number()).optional(),
    noteEmotions: z.array(z.number()).optional(),
    noteImages: z.array(z.string()).optional(),
    noteReactions: z.array(z.number()).optional(),
    noteThoughts: z.array(z.number()).optional(),
  })
  .omit({
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  });

export const noteInsertSchema = noteInsertBaseSchema.omit({
  id: true,
});

export const noteUpdateSchema = noteInsertBaseSchema.partial();
