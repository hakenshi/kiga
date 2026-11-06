CREATE TABLE `entry_reposts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	`parentEntryId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parentEntryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT OR IGNORE INTO `entry_reposts` (`entryId`, `parentEntryId`)
SELECT `er`.`entryId`, `er`.`parentEntryId`
FROM `entry_replies` `er`
JOIN `journal_entries` `je` ON `je`.`id` = `er`.`entryId`
WHERE `je`.`entryType` = 'repost';
