ALTER TABLE `journal_entries` RENAME TO `notes`;--> statement-breakpoint
ALTER TABLE `notes` RENAME COLUMN `entryType` TO `noteType`;--> statement-breakpoint
UPDATE `notes` SET `noteType` = 'note' WHERE `noteType` = 'post';--> statement-breakpoint
DROP INDEX IF EXISTS `entry_behaviors_behaviorId_entryId_unique`;--> statement-breakpoint
ALTER TABLE `entry_behaviors` RENAME TO `note_behaviors`;--> statement-breakpoint
ALTER TABLE `note_behaviors` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
CREATE UNIQUE INDEX `note_behaviors_behaviorId_noteId_unique` ON `note_behaviors` (`behaviorId`,`noteId`);--> statement-breakpoint
DROP INDEX IF EXISTS `entry_emotions_entryId_emotionId_unique`;--> statement-breakpoint
ALTER TABLE `entry_emotions` RENAME TO `note_emotions`;--> statement-breakpoint
ALTER TABLE `note_emotions` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
CREATE UNIQUE INDEX `note_emotions_noteId_emotionId_unique` ON `note_emotions` (`noteId`,`emotionId`);--> statement-breakpoint
ALTER TABLE `entry_images` RENAME TO `note_images`;--> statement-breakpoint
ALTER TABLE `note_images` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
DROP INDEX IF EXISTS `entry_reactions_entryId_reactionId_unique`;--> statement-breakpoint
ALTER TABLE `entry_reactions` RENAME TO `note_reactions`;--> statement-breakpoint
ALTER TABLE `note_reactions` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
CREATE UNIQUE INDEX `note_reactions_noteId_reactionId_unique` ON `note_reactions` (`noteId`,`reactionId`);--> statement-breakpoint
ALTER TABLE `entry_replies` RENAME TO `note_replies`;--> statement-breakpoint
ALTER TABLE `note_replies` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
ALTER TABLE `entry_reposts` RENAME TO `note_reposts`;--> statement-breakpoint
ALTER TABLE `note_reposts` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
DROP INDEX IF EXISTS `entry_thoughts_entryId_thoughtsId_unique`;--> statement-breakpoint
ALTER TABLE `entry_thoughts` RENAME TO `note_thoughts`;--> statement-breakpoint
ALTER TABLE `note_thoughts` RENAME COLUMN `entryId` TO `noteId`;--> statement-breakpoint
CREATE UNIQUE INDEX `note_thoughts_noteId_thoughtsId_unique` ON `note_thoughts` (`noteId`,`thoughtsId`);
