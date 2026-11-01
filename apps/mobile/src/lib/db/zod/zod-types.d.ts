import type { z } from "zod/v4";
import type { CategoryType } from "../schema";
import type {
  behaviorInsertSchema,
  behaviorSelectSchema,
  birthDateSchema,
  categoryInsertSchema,
  categorySelectSchema,
  categoryWithItemsSchema,
  createJournalEntrySchema,
  emotionInsertSchema,
  emotionSelectSchema,
  entryBehaviorSelectSchema,
  entryBehaviorWithRelationSchema,
  entryBehaviorItemSchema,
  entryEmotionSelectSchema,
  entryEmotionWithRelationSchema,
  entryEmotionItemSchema,
  entryImageSelectSchema,
  entryReactionSelectSchema,
  entryReactionWithRelationSchema,
  entryReactionItemSchema,
  entryThoughtSelectSchema,
  entryThoughtWithRelationSchema,
  entryThoughtItemSchema,
  journalEntryInsertSchema,
  journalEntrySelectSchema,
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
  thoughtInsertSchema,
  thoughtSelectSchema,
  userInsertBaseSchema,
  userInsertSchema,
  userSelectBaseSchema,
  userWithRelationsSchema,
  journalEntryUpdateSchema
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
  type JournalEntryInsert = z.infer<typeof journalEntryInsertSchema>;

  // ─── 3. TABELAS PIVOT / JUNÇÃO ──────────────────────────────────────────
  type EntryEmotion = z.infer<typeof entryEmotionSelectSchema>;
  type EntryThought = z.infer<typeof entryThoughtSelectSchema>;
  type EntryReaction = z.infer<typeof entryReactionSelectSchema>;
  type EntryBehavior = z.infer<typeof entryBehaviorSelectSchema>;
  type EntryImage = z.infer<typeof entryImageSelectSchema>;

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

  // User principal tipado com relacionamentos para a sessão Zustand
  type User = UserWithRelations;

  // ─── 5. RELATO DO DIÁRIO / ENTRY ─────────────────────────────────────────
  type NewEntrySchema = z.infer<typeof newEntrySchema>;
  type NewEntryInput = z.input<typeof newEntrySchema>;
  type CreateJournalEntryOutput = z.output<typeof createJournalEntrySchema>;
  type CreateJournalEntryInput = z.input<typeof createJournalEntrySchema>;
  type CreateJournalEntryParams = CreateJournalEntryInput;

  type UpdateJournalEntryInput = z.input<typeof journalEntryUpdateSchema>;

  // ─── 6. AUTENTICAÇÃO E CADASTRO ──────────────────────────────────────────
  type LoginSchema = z.infer<typeof loginSchema>;
  type RegisterSchema = z.infer<typeof registerSchema>;

  type RegisterNameInput = z.input<typeof registerNameSchema>;
  type RegisterNameSchema = z.infer<typeof registerNameSchema>;

  type RegisterSecurityInput = z.input<typeof registerSecuritySchema>;
  type RegisterSecuritySchema = z.infer<typeof registerSecuritySchema>;

  type RegisterIdentitySchema = z.infer<typeof registerIdentitySchema>;
  type RegisterPinSchema = z.infer<typeof registerPinSchema>;

  // ─── 7. UI / DRAWER VIEW HELPERS ────────────────────────────────────────
  type ResourceItem = {
    id: number;
    name: string;
    categoryId: number | null;
    orderIndex: number;
    userId: number | null;
  };

  type ResourceCategory = {
    id: number;
    name: string;
    type?: CategoryType;
    orderIndex: number;
    userId: number | null;
    items: ResourceItem[];
  };

  type BehaviorItem = {
    id: number;
    content: string;
    icon: string | null;
    categoryId: number | null;
    userId: number | null;
    orderIndex: number;
  };

  type BehaviorCategory = {
    id: number;
    name: string;
    orderIndex: number;
    items: BehaviorItem[];
  };
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
  JournalEntry,
  JournalEntryInsert,
  EntryEmotion,
  EntryThought,
  EntryReaction,
  EntryBehavior,
  EntryImage,
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
  ResourceItem,
  ResourceCategory,
  BehaviorItem,
  BehaviorCategory,
};
