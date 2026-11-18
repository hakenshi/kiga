import { relations } from "drizzle-orm";
import {
  behaviors,
  categories,
  emotions,
  moods,
  noteBehaviors,
  noteEmotions,
  noteImages,
  noteReactions,
  noteReplies,
  noteReposts,
  notes,
  noteThoughts,
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
  behaviors: many(behaviors),
  notes: many(notes),
}));

export const categoriesRelation = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  emotions: many(emotions),
  thoughts: many(thoughts),
  reactions: many(reactions),
  behaviors: many(behaviors),
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
  noteEmotions: many(noteEmotions),
}));

export const thoughtsRelation = relations(thoughts, ({ one, many }) => ({
  user: one(users, {
    fields: [thoughts.userId],
    references: [users.id],
  }),
  noteThoughts: many(noteThoughts),
}));

export const moodsRelations = relations(moods, ({ one, many }) => ({
  user: one(users, {
    fields: [moods.userId],
    references: [users.id],
  }),
  notes: many(notes),
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
  noteReactions: many(noteReactions),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  mood: one(moods, {
    fields: [notes.moodId],
    references: [moods.id],
  }),
  noteReactions: many(noteReactions),
  noteThoughts: many(noteThoughts),
  noteEmotions: many(noteEmotions),
  noteBehaviors: many(noteBehaviors),
  noteImages: many(noteImages),
  thread: many(noteReplies),
  reposts: many(noteReposts),
}));

export const noteRepliesRelations = relations(noteReplies, ({ one }) => ({
  note: one(notes, {
    fields: [noteReplies.noteId],
    references: [notes.id],
    relationName: "replyNote",
  }),
}));

export const noteRepostsRelations = relations(noteReposts, ({ one }) => ({
  note: one(notes, {
    fields: [noteReposts.noteId],
    references: [notes.id],
    relationName: "repostNote",
  }),
}));

export const noteReactionsRelations = relations(noteReactions, ({ one }) => ({
  note: one(notes, {
    fields: [noteReactions.noteId],
    references: [notes.id],
  }),
  reaction: one(reactions, {
    fields: [noteReactions.reactionId],
    references: [reactions.id],
  }),
}));

export const noteThoughtsRelations = relations(noteThoughts, ({ one }) => ({
  note: one(notes, {
    fields: [noteThoughts.noteId],
    references: [notes.id],
  }),
  thought: one(thoughts, {
    fields: [noteThoughts.thoughtsId],
    references: [thoughts.id],
  }),
}));

export const noteEmotionsRelations = relations(noteEmotions, ({ one }) => ({
  note: one(notes, {
    fields: [noteEmotions.noteId],
    references: [notes.id],
  }),
  emotion: one(emotions, {
    fields: [noteEmotions.emotionId],
    references: [emotions.id],
  }),
}));

export const noteImagesRelations = relations(noteImages, ({ one }) => ({
  note: one(notes, {
    fields: [noteImages.noteId],
    references: [notes.id],
  }),
}));

export const behaviorsRelations = relations(behaviors, ({ one, many }) => ({
  user: one(users, {
    fields: [behaviors.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [behaviors.categoryId],
    references: [categories.id],
  }),
  noteBehaviors: many(noteBehaviors),
}));

export const noteBehaviorsRelations = relations(noteBehaviors, ({ one }) => ({
  note: one(notes, {
    fields: [noteBehaviors.noteId],
    references: [notes.id],
  }),
  behavior: one(behaviors, {
    fields: [noteBehaviors.behaviorId],
    references: [behaviors.id],
  }),
}));
