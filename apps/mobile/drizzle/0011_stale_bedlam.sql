CREATE TABLE `entry_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	`imageUrl` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_emotions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`name` text NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_emotions`("id", "userId", "name", "deletedAt") SELECT "id", "userId", "name", "deletedAt" FROM `emotions`;--> statement-breakpoint
DROP TABLE `emotions`;--> statement-breakpoint
ALTER TABLE `__new_emotions` RENAME TO `emotions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_entry_emotions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	`emotionId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`emotionId`) REFERENCES `emotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_emotions`("id", "entryId", "emotionId") SELECT "id", "entryId", "emotionId" FROM `entry_emotions`;--> statement-breakpoint
DROP TABLE `entry_emotions`;--> statement-breakpoint
ALTER TABLE `__new_entry_emotions` RENAME TO `entry_emotions`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_emotions_entryId_emotionId_unique` ON `entry_emotions` (`entryId`,`emotionId`);--> statement-breakpoint
CREATE TABLE `__new_entry_reactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	`reactionId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reactionId`) REFERENCES `reactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_reactions`("id", "entryId", "reactionId") SELECT "id", "entryId", "reactionId" FROM `entry_reactions`;--> statement-breakpoint
DROP TABLE `entry_reactions`;--> statement-breakpoint
ALTER TABLE `__new_entry_reactions` RENAME TO `entry_reactions`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_reactions_entryId_reactionId_unique` ON `entry_reactions` (`entryId`,`reactionId`);--> statement-breakpoint
CREATE TABLE `__new_entry_thoughts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	`thoughtsId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`thoughtsId`) REFERENCES `thoughts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_thoughts`("id", "entryId", "thoughtsId") SELECT "id", "entryId", "thoughtsId" FROM `entry_thoughts`;--> statement-breakpoint
DROP TABLE `entry_thoughts`;--> statement-breakpoint
ALTER TABLE `__new_entry_thoughts` RENAME TO `entry_thoughts`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_thoughts_entryId_thoughtsId_unique` ON `entry_thoughts` (`entryId`,`thoughtsId`);--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`moodId` integer,
	`liked` integer NOT NULL,
	`entryType` text,
	`content` text NOT NULL,
	`date` integer NOT NULL,
	`deletedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moodId`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "userId", "moodId", "liked", "entryType", "content", "date", "deletedAt", "createdAt", "updatedAt") SELECT "id", "userId", "moodId", "liked", "entryType", "content", "date", "deletedAt", "createdAt", "updatedAt" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
CREATE TABLE `__new_moods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`name` text NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_moods`("id", "userId", "name", "deletedAt") SELECT "id", "userId", "name", "deletedAt" FROM `moods`;--> statement-breakpoint
DROP TABLE `moods`;--> statement-breakpoint
ALTER TABLE `__new_moods` RENAME TO `moods`;--> statement-breakpoint
CREATE TABLE `__new_profile_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_profile_images`("id", "userId", "url") SELECT "id", "userId", "url" FROM `profile_images`;--> statement-breakpoint
DROP TABLE `profile_images`;--> statement-breakpoint
ALTER TABLE `__new_profile_images` RENAME TO `profile_images`;--> statement-breakpoint
CREATE TABLE `__new_reactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`name` text NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_reactions`("id", "userId", "name", "deletedAt") SELECT "id", "userId", "name", "deletedAt" FROM `reactions`;--> statement-breakpoint
DROP TABLE `reactions`;--> statement-breakpoint
ALTER TABLE `__new_reactions` RENAME TO `reactions`;--> statement-breakpoint
CREATE TABLE `__new_thoughts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`name` text NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_thoughts`("id", "userId", "name", "deletedAt") SELECT "id", "userId", "name", "deletedAt" FROM `thoughts`;--> statement-breakpoint
DROP TABLE `thoughts`;--> statement-breakpoint
ALTER TABLE `__new_thoughts` RENAME TO `thoughts`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`firstName` text NOT NULL,
	`secondName` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`pin` text NOT NULL,
	`birthDate` integer NOT NULL,
	`gender` text,
	`pronoun` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "firstName", "secondName", "username", "password", "pin", "birthDate", "gender", "pronoun", "createdAt") SELECT "id", "firstName", "secondName", "username", "password", "pin", "birthDate", "gender", "pronoun", "createdAt" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);