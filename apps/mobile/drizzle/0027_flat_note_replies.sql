PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_note_replies` (
	`id` integer PRIMARY KEY NOT NULL,
	`noteId` integer NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_note_replies`("id", "noteId") SELECT "id", "noteId" FROM `note_replies`;--> statement-breakpoint
DROP TABLE `note_replies`;--> statement-breakpoint
ALTER TABLE `__new_note_replies` RENAME TO `note_replies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;