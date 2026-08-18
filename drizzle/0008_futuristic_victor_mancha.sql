CREATE TABLE `aiUsageEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('explain','assist') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiUsageEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `quizzes` ADD `creatorUserId` int;--> statement-breakpoint
CREATE INDEX `ai_usage_events_user_created_idx` ON `aiUsageEvents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `quizzes_creator_idx` ON `quizzes` (`creatorUserId`);