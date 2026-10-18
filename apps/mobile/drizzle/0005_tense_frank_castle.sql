PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`moodId` text,
	`moodScore` integer NOT NULL,
	`content` text NOT NULL,
	`date` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moodId`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "userId", "moodId", "moodScore", "content", "date", "createdAt", "updatedAt") SELECT "id", "userId", "moodId", "moodScore", "content", "date", "createdAt", "updatedAt" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX `entry_emotions_entryId_unique`;--> statement-breakpoint
DROP INDEX `entry_emotions_emotionId_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_emotions_entryId_emotionId_unique` ON `entry_emotions` (`entryId`,`emotionId`);--> statement-breakpoint
DROP INDEX `entry_reactions_entryId_unique`;--> statement-breakpoint
DROP INDEX `entry_reactions_reactionId_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_reactions_entryId_reactionId_unique` ON `entry_reactions` (`entryId`,`reactionId`);--> statement-breakpoint
DROP INDEX `entry_thoughts_entryId_unique`;--> statement-breakpoint
DROP INDEX `entry_thoughts_thoughtsId_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `entry_thoughts_entryId_thoughtsId_unique` ON `entry_thoughts` (`entryId`,`thoughtsId`);--> statement-breakpoint
ALTER TABLE `emotions` ADD `deletedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `moods` ADD `deletedAt` integer;--> statement-breakpoint
ALTER TABLE `reactions` ADD `deletedAt` integer;--> statement-breakpoint
ALTER TABLE `thoughts` ADD `deletedAt` integer;