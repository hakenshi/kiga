PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_thoughts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`name` text NOT NULL,
	`orderIndex` integer DEFAULT 0 NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_thoughts`("id", "userId", "name", "orderIndex", "deletedAt") SELECT "id", "userId", "name", "orderIndex", "deletedAt" FROM `thoughts`;--> statement-breakpoint
DROP TABLE `thoughts`;--> statement-breakpoint
ALTER TABLE `__new_thoughts` RENAME TO `thoughts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;