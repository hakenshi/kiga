CREATE TABLE `entry_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
