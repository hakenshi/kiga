CREATE TABLE `emotions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`moodId` text NOT NULL,
	`moodScore` integer NOT NULL,
	`content` text NOT NULL,
	`date` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moodId`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `journal_entry_items` (
	`id` text PRIMARY KEY NOT NULL,
	`entryId` text NOT NULL,
	`thoughtsId` text,
	`emotionsId` text,
	`reactionsId` text,
	FOREIGN KEY (`entryId`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`thoughtsId`) REFERENCES `thoughts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`emotionsId`) REFERENCES `emotions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reactionsId`) REFERENCES `reactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `moods` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profile_images` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `thoughts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_profile_images` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`profileImageId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profileImageId`) REFERENCES `profile_images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`pin` integer NOT NULL,
	`birthDate` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);