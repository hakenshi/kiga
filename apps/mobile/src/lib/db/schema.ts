import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const genderEnum = ["male", "female", "non_binary", "other", "prefer_not_to_say"] as const;
export type Gender = (typeof genderEnum)[number];

export const pronounEnum = ["he_him", "she_her", "they_them", "other"] as const;
export type Pronoun = (typeof pronounEnum)[number];

export const journalEntryType = ["post", "reply", "repost"] as const;
export type JournalEntryType = (typeof journalEntryType)[number];

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

export const moods = sqliteTable("moods", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
});

export const thoughts = sqliteTable("thoughts", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
});

export const emotions = sqliteTable("emotions", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
});

export const reactions = sqliteTable("reactions", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  moodId: integer().references(() => moods.id, { onDelete: "set null" }),
  liked: integer({ mode: "boolean" }).notNull(),
  entryType: text({ enum: journalEntryType }),
  title: text(),
  content: text().notNull(),
  date: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer({ mode: "timestamp" }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
});

export const entryReactions = sqliteTable("entry_reactions", {
  id: integer().primaryKey({ autoIncrement: true }),
  entryId: integer().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  reactionId: integer().notNull().references(() => reactions.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.entryId, t.reactionId),
]);

export const entryEmotions = sqliteTable("entry_emotions", {
  id: integer().primaryKey({ autoIncrement: true }),
  entryId: integer().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  emotionId: integer().notNull().references(() => emotions.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.entryId, t.emotionId),
]);

export const entryThoughts = sqliteTable("entry_thoughts", {
  id: integer().primaryKey({ autoIncrement: true }),
  entryId: integer().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  thoughtsId: integer().notNull().references(() => thoughts.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.entryId, t.thoughtsId),
]);

export const entryImages = sqliteTable("entry_images", {
  id: integer().primaryKey({ autoIncrement: true }),
  entryId: integer().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  imageUrl: text().notNull(),
});
