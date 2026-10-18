CREATE TABLE `entry_emotions` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`emotionId` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`emotionId`) REFERENCES `emotions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_emotions_entryId_unique` ON `entry_emotions` (`entryId`);--> statement-breakpoint
CREATE UNIQUE INDEX `entry_emotions_emotionId_unique` ON `entry_emotions` (`emotionId`);--> statement-breakpoint
CREATE TABLE `entry_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`reactionId` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reactionId`) REFERENCES `reactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_reactions_entryId_unique` ON `entry_reactions` (`entryId`);--> statement-breakpoint
CREATE UNIQUE INDEX `entry_reactions_reactionId_unique` ON `entry_reactions` (`reactionId`);--> statement-breakpoint
CREATE TABLE `entry_thoughts` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`thoughtsId` text NOT NULL,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`thoughtsId`) REFERENCES `thoughts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_thoughts_entryId_unique` ON `entry_thoughts` (`entryId`);--> statement-breakpoint
CREATE UNIQUE INDEX `entry_thoughts_thoughtsId_unique` ON `entry_thoughts` (`thoughtsId`);--> statement-breakpoint
DROP TABLE `journal_entry_items`;--> statement-breakpoint
DROP TABLE `user_profile_images`;--> statement-breakpoint
ALTER TABLE `profile_images` ADD `userId` text NOT NULL REFERENCES users(id);