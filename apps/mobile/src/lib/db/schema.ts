import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  username: text().notNull().unique(),
  password: text().notNull(),
  pin: integer({ mode: "number" }).notNull(),
  birthDate: integer({ mode: "timestamp" }).notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date())
})

export const profileImages = sqliteTable("profile_images", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text().notNull()
})

export const moods = sqliteTable("moods", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
})

export const thoughts = sqliteTable("thoughts", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
})

export const emotions = sqliteTable("emotions", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
})

export const reactions = sqliteTable("reactions", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  deletedAt: integer({ mode: "timestamp" }),
})

export const journalEntries = sqliteTable("journal_entries", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  moodId: text().references(() => moods.id, { onDelete: "set null" }),
  moodScore: integer().notNull(),
  content: text().notNull(),
  date: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer({ mode: "timestamp" }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
})

export const entryReactions = sqliteTable("entry_reactions", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryId: text().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  reactionId: text().notNull().references(() => reactions.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.entryId, t.reactionId),
])

export const entryEmotions = sqliteTable("entry_emotions", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryId: text().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  emotionId: text().notNull().references(() => emotions.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.entryId, t.emotionId),
])

export const entryThoughts = sqliteTable("entry_thoughts", {
  id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryId: text().notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  thoughtsId: text().notNull().references(() => thoughts.id, { onDelete: "cascade" }),
}, t => [
  unique().on(t.entryId, t.thoughtsId),
])

