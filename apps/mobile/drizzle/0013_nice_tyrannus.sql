CREATE TABLE `behaviors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`content` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entry_behaviors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entryId` integer NOT NULL,
	`behaviorId` integer NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`behaviorId`) REFERENCES `behaviors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_behaviors_behaviorId_entryId_unique` ON `entry_behaviors` (`behaviorId`,`entryId`);