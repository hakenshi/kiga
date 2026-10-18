PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entry_emotions` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`emotionId` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`emotionId`) REFERENCES `emotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_emotions`("id", "entryId", "emotionId") SELECT "id", "entryId", "emotionId" FROM `entry_emotions`;--> statement-breakpoint
DROP TABLE `entry_emotions`;--> statement-breakpoint
ALTER TABLE `__new_entry_emotions` RENAME TO `entry_emotions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_emotions_entryId_emotionId_unique` ON `entry_emotions` (`entryId`,`emotionId`);--> statement-breakpoint
CREATE TABLE `__new_entry_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`reactionId` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reactionId`) REFERENCES `reactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_reactions`("id", "entryId", "reactionId") SELECT "id", "entryId", "reactionId" FROM `entry_reactions`;--> statement-breakpoint
DROP TABLE `entry_reactions`;--> statement-breakpoint
ALTER TABLE `__new_entry_reactions` RENAME TO `entry_reactions`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_reactions_entryId_reactionId_unique` ON `entry_reactions` (`entryId`,`reactionId`);--> statement-breakpoint
CREATE TABLE `__new_entry_thoughts` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`thoughtsId` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`thoughtsId`) REFERENCES `thoughts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entry_thoughts`("id", "entryId", "thoughtsId") SELECT "id", "entryId", "thoughtsId" FROM `entry_thoughts`;--> statement-breakpoint
DROP TABLE `entry_thoughts`;--> statement-breakpoint
ALTER TABLE `__new_entry_thoughts` RENAME TO `entry_thoughts`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_thoughts_entryId_thoughtsId_unique` ON `entry_thoughts` (`entryId`,`thoughtsId`);--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`moodId` text,
	`moodScore` integer NOT NULL,
	`content` text NOT NULL,
	`date` integer NOT NULL,
	`deletedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moodId`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "userId", "moodId", "moodScore", "content", "date", "deletedAt", "createdAt", "updatedAt") SELECT "id", "userId", "moodId", "moodScore", "content", "date", "deletedAt", "createdAt", "updatedAt" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
CREATE TABLE `__new_emotions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_emotions`("id", "userId", "name", "deletedAt") SELECT "id", "userId", "name", "deletedAt" FROM `emotions`;--> statement-breakpoint
DROP TABLE `emotions`;--> statement-breakpoint
ALTER TABLE `__new_emotions` RENAME TO `emotions`;