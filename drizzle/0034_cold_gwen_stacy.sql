ALTER TABLE `quizzes` MODIFY COLUMN `status` enum('draft','pending_review','rejected','published','locked','archived') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `lockedFromStatus` enum('draft','pending_review','rejected','published','locked','archived');--> statement-breakpoint
ALTER TABLE `quizzes` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `reviewedByUserId` int;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `reviewReason` text;