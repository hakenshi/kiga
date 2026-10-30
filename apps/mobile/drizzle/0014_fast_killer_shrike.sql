ALTER TABLE `behaviors` ADD `categoryId` integer REFERENCES categories(id);--> statement-breakpoint
ALTER TABLE `behaviors` ADD `icon` text;--> statement-breakpoint
ALTER TABLE `behaviors` ADD `orderIndex` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `behaviors` ADD `deletedAt` integer;--> statement-breakpoint
ALTER TABLE `behaviors` ADD `createdAt` integer NOT NULL;