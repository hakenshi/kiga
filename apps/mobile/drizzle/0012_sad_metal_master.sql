CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`orderIndex` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `emotions` ADD `categoryId` integer REFERENCES categories(id);--> statement-breakpoint
ALTER TABLE `emotions` ADD `orderIndex` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `title` text;--> statement-breakpoint
ALTER TABLE `reactions` ADD `categoryId` integer REFERENCES categories(id);--> statement-breakpoint
ALTER TABLE `reactions` ADD `orderIndex` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `thoughts` ADD `categoryId` integer REFERENCES categories(id);--> statement-breakpoint
ALTER TABLE `thoughts` ADD `orderIndex` integer DEFAULT 0 NOT NULL;