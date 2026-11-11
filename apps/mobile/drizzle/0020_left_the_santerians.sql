DROP TABLE `entry_replies`;--> statement-breakpoint
DROP TABLE `entry_reposts`;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `parentId` integer REFERENCES journal_entries(id);