import type { z } from "zod/v4";
import type { CategoryType } from "../schema";
import type {
  behaviorCategorySchema,
  behaviorInsertSchema,
  behaviorItemSchema,
  behaviorSelectSchema,
  birthDateSchema,
  categoryInsertSchema,
  categorySelectSchema,
  categoryWithItemsSchema,
  createBehaviorFormSchema,
  createCategoryFormSchema,
  createEmotionFormSchema,
  createJournalEntrySchema,
  createPostSchema,
  createReactionFormSchema,
  createReplySchema,
  createRepostSchema,
  createThoughtFormSchema,
  emotionInsertSchema,
  emotionSelectSchema,
  entryBehaviorItemSchema,
  entryBehaviorSelectSchema,
  entryBehaviorWithRelationSchema,
  entryEmotionItemSchema,
  entryEmotionSelectSchema,
  entryEmotionWithRelationSchema,
  entryImageInsertSchema,
  entryImageSelectSchema,
  entryReactionItemSchema,
  entryReactionSelectSchema,
  entryReactionWithRelationSchema,
  entryReplyInsertSchema,
  entryReplySelectSchema,
  entryRepostInsertSchema,
  entryRepostSelectSchema,
  entryThoughtItemSchema,
  entryThoughtSelectSchema,
  entryThoughtWithRelationSchema,
  entryThreadResultSchema,
  journalEntryInsertSchema,
  journalEntrySelectSchema,
  journalEntryUpdateSchema,
  journalEntryWithRelationsSchema,
  loginSchema,
  moodInsertSchema,
  moodSelectSchema,
  newEntrySchema,
  profileImageInsertSchema,
  profileImageSelectSchema,
  reactionInsertSchema,
  reactionSelectSchema,
  registerIdentitySchema,
  registerNameSchema,
  registerPinSchema,
  registerSchema,
  registerSecuritySchema,
  resourceCategorySchema,
  resourceItemSchema,
  thoughtInsertSchema,
  thoughtSelectSchema,
  updateJournalEntryParamsSchema,
  userInsertBaseSchema,
  userInsertSchema,
  userSelectBaseSchema,
  userWithRelationsSchema,
} from "./zod-schemas";

declare global {
  interface Buffer extends Uint8Array { }

  // ─── 1. TABELAS BASE (SELECT VIA DRIZZLE-ZOD) ───────────────────────────
  type UserBase = z.infer<typeof userSelectBaseSchema>;
  type Category = z.infer<typeof categorySelectSchema>;
  type Emotion = z.infer<typeof emotionSelectSchema>;
  type Thought = z.infer<typeof thoughtSelectSchema>;
  type Reaction = z.infer<typeof reactionSelectSchema>;
  type Behavior = z.infer<typeof behaviorSelectSchema>;
  type Mood = z.infer<typeof moodSelectSchema>;
  type ProfileImage = z.infer<typeof profileImageSelectSchema>;
  type JournalEntry = z.infer<typeof journalEntrySelectSchema>;

  // ─── 2. TABELAS BASE (INSERT VIA DRIZZLE-ZOD) ───────────────────────────
  type UserInsertBase = z.infer<typeof userInsertBaseSchema>;
  type UserInsert = z.infer<typeof userInsertSchema>;
  type CategoryInsert = z.infer<typeof categoryInsertSchema>;
  type EmotionInsert = z.infer<typeof emotionInsertSchema>;
  type ThoughtInsert = z.infer<typeof thoughtInsertSchema>;
  type ReactionInsert = z.infer<typeof reactionInsertSchema>;
  type BehaviorInsert = z.infer<typeof behaviorInsertSchema>;
  type MoodInsert = z.infer<typeof moodInsertSchema>;
  type ProfileImageInsert = z.infer<typeof profileImageInsertSchema>;
  type EntryImageInsert = z.infer<typeof entryImageInsertSchema>;
  type JournalEntryInsert = z.infer<typeof journalEntryInsertSchema>;

  // ─── 3. TABELAS PIVOT / JUNÇÃO ──────────────────────────────────────────
  type EntryEmotion = z.infer<typeof entryEmotionSelectSchema>;
  type EntryThought = z.infer<typeof entryThoughtSelectSchema>;
  type EntryReaction = z.infer<typeof entryReactionSelectSchema>;
  type EntryBehavior = z.infer<typeof entryBehaviorSelectSchema>;
  type EntryImage = z.infer<typeof entryImageSelectSchema>;
  type EntryReply = z.infer<typeof entryReplySelectSchema>;
  type EntryReplyInsert = z.infer<typeof entryReplyInsertSchema>;
  type EntryReplyWithRelation = EntryReply & {
    parentEntry?: JournalEntryWithRelations | null;
  };
  type EntryRepost = z.infer<typeof entryRepostSelectSchema>;
  type EntryRepostInsert = z.infer<typeof entryRepostInsertSchema>;
  type EntryRepostWithRelation = EntryRepost & {
    parentEntry?: JournalEntryWithRelations | null;
  };

  type EntryEmotionWithRelation = z.infer<typeof entryEmotionWithRelationSchema>;
  type EntryThoughtWithRelation = z.infer<typeof entryThoughtWithRelationSchema>;
  type EntryReactionWithRelation = z.infer<typeof entryReactionWithRelationSchema>;
  type EntryBehaviorWithRelation = z.infer<typeof entryBehaviorWithRelationSchema>;

  type EntryEmotionItem = z.infer<typeof entryEmotionItemSchema>;
  type EntryThoughtItem = z.infer<typeof entryThoughtItemSchema>;
  type EntryReactionItem = z.infer<typeof entryReactionItemSchema>;
  type EntryBehaviorItem = z.infer<typeof entryBehaviorItemSchema>;

  // ─── 4. RELACIONAMENTOS (DRIZZLE RELATIONS) ─────────────────────────────
  type JournalEntryWithRelations = z.infer<typeof journalEntryWithRelationsSchema>;
  type CategoryWithItems = z.infer<typeof categoryWithItemsSchema>;
  type UserWithRelations = z.infer<typeof userWithRelationsSchema>;
  type EntryThreadResult = z.infer<typeof entryThreadResultSchema>;

  // User principal tipado com relacionamentos para a sessão Zustand
  type User = UserWithRelations;

  // ─── 5. RELATO DO DIÁRIO / ENTRY (POST, REPLY, REPOST E UPDATE) ──────────
  type CreatePostInput = z.input<typeof createPostSchema>;
  type CreatePostOutput = z.output<typeof createPostSchema>;

  type CreateReplyInput = z.input<typeof createReplySchema>;
  type CreateReplyOutput = z.output<typeof createReplySchema>;

  type CreateRepostInput = z.input<typeof createRepostSchema>;
  type CreateRepostOutput = z.output<typeof createRepostSchema>;

  type UpdateJournalEntryInput = z.input<typeof updateJournalEntryParamsSchema>;
  type UpdateJournalEntryOutput = z.output<typeof updateJournalEntryParamsSchema>;
  type UpdateJournalEntryPartialInput = z.input<typeof journalEntryUpdateSchema>;

  type NewEntrySchema = z.infer<typeof newEntrySchema>;
  type NewEntryInput = z.input<typeof newEntrySchema>;
  type CreateJournalEntryOutput = z.output<typeof createJournalEntrySchema>;
  type CreateJournalEntryInput = z.input<typeof createJournalEntrySchema>;
  type CreateJournalEntryParams = CreateJournalEntryInput;

  // ─── 6. AUTENTICAÇÃO E CADASTRO ──────────────────────────────────────────
  type LoginSchema = z.infer<typeof loginSchema>;
  type RegisterSchema = z.infer<typeof registerSchema>;

  type RegisterNameInput = z.input<typeof registerNameSchema>;
  type RegisterNameSchema = z.infer<typeof registerNameSchema>;

  type RegisterSecurityInput = z.input<typeof registerSecuritySchema>;
  type RegisterSecuritySchema = z.infer<typeof registerSecuritySchema>;

  type RegisterIdentitySchema = z.infer<typeof registerIdentitySchema>;
  type RegisterPinSchema = z.infer<typeof registerPinSchema>;

  // ─── 7. UI / DRAWER VIEW HELPERS E PROJEÇÕES ────────────────────────────
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

export type {
  User,
  UserBase,
  UserInsertBase,
  UserInsert,
  Category,
  CategoryInsert,
  Emotion,
  EmotionInsert,
  Thought,
  ThoughtInsert,
  Reaction,
  ReactionInsert,
  Behavior,
  BehaviorInsert,
  Mood,
  MoodInsert,
  ProfileImage,
  ProfileImageInsert,
  EntryImageInsert,
  JournalEntry,
  JournalEntryInsert,
  EntryEmotion,
  EntryThought,
  EntryReaction,
  EntryBehavior,
  EntryImage,
  EntryReply,
  EntryReplyInsert,
  EntryEmotionWithRelation,
  EntryThoughtWithRelation,
  EntryReactionWithRelation,
  EntryBehaviorWithRelation,
  EntryEmotionItem,
  EntryThoughtItem,
  EntryReactionItem,
  EntryBehaviorItem,
  JournalEntryWithRelations,
  CategoryWithItems,
  UserWithRelations,
  EntryThreadResult,
  CreatePostInput,
  CreatePostOutput,
  CreateReplyInput,
  CreateReplyOutput,
  CreateRepostInput,
  CreateRepostOutput,
  UpdateJournalEntryInput,
  UpdateJournalEntryOutput,
  UpdateJournalEntryPartialInput,
  NewEntrySchema,
  NewEntryInput,
  CreateJournalEntryOutput,
  CreateJournalEntryInput,
  CreateJournalEntryParams,
  LoginSchema,
  RegisterSchema,
  RegisterNameInput,
  RegisterNameSchema,
  RegisterSecurityInput,
  RegisterSecuritySchema,
  RegisterIdentitySchema,
  RegisterPinSchema,
  CreateCategoryFormSchema,
  CreateEmotionFormSchema,
  CreateThoughtFormSchema,
  CreateReactionFormSchema,
  CreateBehaviorFormSchema,
  ResourceItem,
  ResourceCategory,
  BehaviorItem,
  BehaviorCategory,
};
