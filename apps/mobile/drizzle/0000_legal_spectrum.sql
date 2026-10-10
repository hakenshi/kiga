CREATE TABLE `thoughts` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`mood` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
