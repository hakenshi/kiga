import { relations } from "drizzle-orm";
import {
  categories,
  emotions,
  entryEmotions,
  entryImages,
  entryReactions,
  entryThoughts,
  journalEntries,
  moods,
  profileImages,
  reactions,
  thoughts,
  users,
} from "./schema";

export const userRelation = relations(users, ({ many }) => ({
  profileImages: many(profileImages),
  categories: many(categories),
  emotions: many(emotions),
  thoughts: many(thoughts),
  moods: many(moods),
  reactions: many(reactions),
  journalEntries: many(journalEntries),
}));

export const categoriesRelation = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  emotions: many(emotions),
  thoughts: many(thoughts),
  reactions: many(reactions),
}));

export const userProfileImagesRelation = relations(profileImages, ({ one }) => ({
  user: one(users, {
    fields: [profileImages.userId],
    references: [users.id],
  }),
}));

export const emotionsRelation = relations(emotions, ({ one, many }) => ({
  user: one(users, {
    fields: [emotions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [emotions.categoryId],
    references: [categories.id],
  }),
  entryEmotions: many(entryEmotions),
}));

export const thoughtsRelation = relations(thoughts, ({ one, many }) => ({
  user: one(users, {
    fields: [thoughts.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [thoughts.categoryId],
    references: [categories.id],
  }),
  entryThoughts: many(entryThoughts),
}));

export const moodsRelations = relations(moods, ({ one, many }) => ({
  user: one(users, {
    fields: [moods.userId],
    references: [users.id],
  }),
  journalEntries: many(journalEntries),
}));

export const reactionsRelations = relations(reactions, ({ one, many }) => ({
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [reactions.categoryId],
    references: [categories.id],
  }),
  entryReactions: many(entryReactions),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  mood: one(moods, {
    fields: [journalEntries.moodId],
    references: [moods.id],
  }),
  entryReactions: many(entryReactions),
  entryThoughts: many(entryThoughts),
  entryEmotions: many(entryEmotions),
  entryImages: many(entryImages),
}));

export const entryReactionsRelations = relations(entryReactions, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [entryReactions.entryId],
    references: [journalEntries.id],
  }),
  reaction: one(reactions, {
    fields: [entryReactions.reactionId],
    references: [reactions.id],
  }),
}));

export const entryThoughtsRelations = relations(entryThoughts, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [entryThoughts.entryId],
    references: [journalEntries.id],
  }),
  thought: one(thoughts, {
    fields: [entryThoughts.thoughtsId],
    references: [thoughts.id],
  }),
}));

export const entryEmotionsRelations = relations(entryEmotions, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [entryEmotions.entryId],
    references: [journalEntries.id],
  }),
  emotion: one(emotions, {
    fields: [entryEmotions.emotionId],
    references: [emotions.id],
  }),
}));

export const entryImagesRelations = relations(entryImages, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [entryImages.entryId],
    references: [journalEntries.id],
  }),
}))
