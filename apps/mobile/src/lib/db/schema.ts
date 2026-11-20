import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const genderEnum = ["male", "female", "non_binary", "other", "prefer_not_to_say"] as const;
export type Gender = (typeof genderEnum)[number];

export const pronounEnum = ["he_him", "she_her", "they_them", "other"] as const;
export type Pronoun = (typeof pronounEnum)[number];

export const noteTypeEnum = ["note", "reply", "repost"] as const;
export type NoteType = (typeof noteTypeEnum)[number];

export const categoryTypeEnum = ["emotion", "reaction", "behavior"] as const;
export type CategoryType = (typeof categoryTypeEnum)[number];

export const seeds = sqliteTable("seeds", {
  version: integer().primaryKey(),
  apliedAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date())
})

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  firstName: text().notNull(),
  secondName: text().notNull(),
  username: text().notNull().unique(),
  password: text().notNull(),
  pin: text().notNull(),
  birthDate: integer({ mode: "timestamp" }).notNull(),
  gender: text({ enum: genderEnum }),
  pronoun: text({ enum: pronounEnum }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date())
});

export const profileImages = sqliteTable("profile_images", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text().notNull()
});

export const categories = sqliteTable("categories", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  type: text({ enum: categoryTypeEnum }).notNull(),
  name: text().notNull(),
  orderIndex: integer().notNull().default(0),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer({ mode: "timestamp" }),
});

export const moods = sqliteTable("moods", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  label: text().notNull(),
  icon: text().notNull(),
  color: text().notNull(),
  border: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
});

export const thoughts = sqliteTable("thoughts", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  orderIndex: integer().notNull().default(0),
  deletedAt: integer({ mode: "timestamp" }),
});

export const emotions = sqliteTable("emotions", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer().references(() => categories.id, { onDelete: "set null" }),
  name: text().notNull(),
  orderIndex: integer().notNull().default(0),
  deletedAt: integer({ mode: "timestamp" }),
});

export const reactions = sqliteTable("reactions", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer().references(() => categories.id, { onDelete: "set null" }),
  name: text().notNull(),
  orderIndex: integer().notNull().default(0),
  deletedAt: integer({ mode: "timestamp" }),
});

export const notes = sqliteTable("notes", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  moodId: integer().references(() => moods.id, { onDelete: "set null" }),
  liked: integer({ mode: "boolean" }).notNull().default(false),
  fixed: integer({ mode: "boolean" }).notNull().default(false),
  noteType: text({ enum: noteTypeEnum }),
  content: text().notNull(),
  date: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer({ mode: "timestamp" }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
});

export const noteReactions = sqliteTable("note_reactions", {
  id: integer().primaryKey({ autoIncrement: true }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }), reactionId: integer().notNull().references(() => reactions.id, { onDelete: "cascade" }),
}, (t) => [unique().on(t.noteId, t.reactionId),]);

export const noteEmotions = sqliteTable("note_emotions", {
  id: integer().primaryKey({ autoIncrement: true }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }),
  emotionId: integer().notNull().references(() => emotions.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.noteId, t.emotionId),
]);

export const noteThoughts = sqliteTable("note_thoughts", {
  id: integer().primaryKey({ autoIncrement: true }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }),
  thoughtsId: integer().notNull().references(() => thoughts.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.noteId, t.thoughtsId),
]);

export const noteImages = sqliteTable("note_images", {
  id: integer().primaryKey({ autoIncrement: true }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }),
  imageUrl: text().notNull(),
});

export const behaviors = sqliteTable("behaviors", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id),
  categoryId: integer().references(() => categories.id, { onDelete: "set null" }),
  content: text(),
  icon: text(),
  orderIndex: integer().notNull().default(0),
  deletedAt: integer({ mode: "timestamp" }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const noteBehaviors = sqliteTable("note_behaviors", {
  id: integer().primaryKey({ autoIncrement: true }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }),
  behaviorId: integer().notNull().references(() => behaviors.id),
}, (t) => [unique().on(t.behaviorId, t.noteId)])


export const noteReplies = sqliteTable("note_replies", {
  // Compartilha o ID do registro que contém o texto e os recursos da resposta.
  id: integer().primaryKey().references(() => notes.id, { onDelete: "cascade" }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }),
})

export const noteReposts = sqliteTable("note_reposts", {
  id: integer().primaryKey({ autoIncrement: true }),
  noteId: integer().notNull().references(() => notes.id, { onDelete: "cascade" }),
});
