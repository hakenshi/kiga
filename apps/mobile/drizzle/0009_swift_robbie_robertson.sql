PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text NOT NULL,
	`secondName` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`pin` text NOT NULL,
	`birthDate` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "firstName", "secondName", "username", "password", "pin", "birthDate", "createdAt") SELECT "id", "firstName", "secondName", "username", "password", "pin", "birthDate", "createdAt" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);