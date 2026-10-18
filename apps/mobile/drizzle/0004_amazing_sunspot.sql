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
	FOREIGN KEY (`moodId`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "userId", "moodId", "moodScore", "content", "date", "createdAt", "updatedAt") SELECT "id", "userId", "moodId", "moodScore", "content", "date", "createdAt", "updatedAt" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;