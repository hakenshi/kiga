ALTER TABLE `thoughts` RENAME COLUMN "firstName" TO "name";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "name" TO "firstName";--> statement-breakpoint
ALTER TABLE `thoughts` DROP COLUMN `secondName`;--> statement-breakpoint
ALTER TABLE `users` ADD `secondName` text NOT NULL;