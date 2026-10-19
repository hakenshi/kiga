ALTER TABLE `thoughts` RENAME COLUMN "name" TO "firstName";--> statement-breakpoint
ALTER TABLE `thoughts` ADD `secondName` text NOT NULL;