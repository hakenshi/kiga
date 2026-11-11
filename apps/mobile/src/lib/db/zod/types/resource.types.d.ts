import type { z } from "zod/v4";
import type {
  behaviorCategorySchema,
  behaviorInsertSchema,
  behaviorItemSchema,
  behaviorSelectSchema,
  categoryInsertSchema,
  categorySelectSchema,
  categoryWithItemsSchema,
  createBehaviorFormSchema,
  createCategoryFormSchema,
  createEmotionFormSchema,
  createReactionFormSchema,
  createThoughtFormSchema,
  emotionInsertSchema,
  emotionSelectSchema,
  moodInsertSchema,
  moodSelectSchema,
  reactionInsertSchema,
  reactionSelectSchema,
  resourceCategorySchema,
  resourceItemSchema,
  thoughtInsertSchema,
  thoughtSelectSchema,
} from "../schemas/resource.schema";

declare global {
  type Category = z.infer<typeof categorySelectSchema>;
  type CategoryInsert = z.infer<typeof categoryInsertSchema>;
  type CategoryWithItems = z.infer<typeof categoryWithItemsSchema>;

  type Emotion = z.infer<typeof emotionSelectSchema>;
  type EmotionInsert = z.infer<typeof emotionInsertSchema>;

  type Thought = z.infer<typeof thoughtSelectSchema>;
  type ThoughtInsert = z.infer<typeof thoughtInsertSchema>;

  type Reaction = z.infer<typeof reactionSelectSchema>;
  type ReactionInsert = z.infer<typeof reactionInsertSchema>;

  type Behavior = z.infer<typeof behaviorSelectSchema>;
  type BehaviorInsert = z.infer<typeof behaviorInsertSchema>;

  type Mood = z.infer<typeof moodSelectSchema>;
  type MoodInsert = z.infer<typeof moodInsertSchema>;

  type CreateCategoryFormSchema = z.infer<typeof createCategoryFormSchema>;
  type CreateEmotionFormSchema = z.infer<typeof createEmotionFormSchema>;
  type CreateThoughtFormSchema = z.infer<typeof createThoughtFormSchema>;
  type CreateReactionFormSchema = z.infer<typeof createReactionFormSchema>;
  type CreateBehaviorFormSchema = z.infer<typeof createBehaviorFormSchema>;

  type ResourceItem = z.infer<typeof resourceItemSchema>;
  type ResourceCategory = z.infer<typeof resourceCategorySchema>;
  type BehaviorItem = z.infer<typeof behaviorItemSchema>;
  type BehaviorCategory = z.infer<typeof behaviorCategorySchema>;
}
