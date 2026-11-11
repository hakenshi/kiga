CREATE TABLE `entry_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entry_reposts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`moodId` integer,
	`liked` integer DEFAULT false NOT NULL,
	`fixed` integer DEFAULT false NOT NULL,
	`entryType` text,
	`title` text,
	`content` text NOT NULL,
	`date` integer NOT NULL,
	`deletedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moodId`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "userId", "moodId", "liked", "fixed", "entryType", "title", "content", "date", "deletedAt", "createdAt", "updatedAt") SELECT "id", "userId", "moodId", "liked", "fixed", "entryType", "title", "content", "date", "deletedAt", "createdAt", "updatedAt" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;