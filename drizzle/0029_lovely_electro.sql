CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`parentId` int,
	`path` varchar(2000) NOT NULL,
	`depth` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int NOT NULL,
	`deletedAt` timestamp,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `topics_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `lessonId` int;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `topicId` int;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `authorUserId` int;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `status` enum('draft','published','locked','archived') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `lockedAt` timestamp;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `lockedByUserId` int;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `lockedFromStatus` enum('draft','published','locked','archived');--> statement-breakpoint
ALTER TABLE `quizzes` ADD `lockReason` varchar(500);--> statement-breakpoint
ALTER TABLE `quizzes` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `topics_parent_order_idx` ON `topics` (`parentId`,`sortOrder`,`name`);--> statement-breakpoint
CREATE INDEX `topics_status_deleted_idx` ON `topics` (`status`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `topics_path_idx` ON `topics` (`path`);--> statement-breakpoint
CREATE INDEX `quizzes_topic_status_idx` ON `quizzes` (`topicId`,`status`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `quizzes_author_active_idx` ON `quizzes` (`authorUserId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `quizzes_published_active_idx` ON `quizzes` (`publishedAt`,`deletedAt`);