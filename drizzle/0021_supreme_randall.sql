CREATE TABLE `quizSourceHistories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceUrl` varchar(2048) NOT NULL,
	`sourceName` varchar(220) NOT NULL,
	`sourceType` enum('youtube','web') NOT NULL,
	`sourceCharacterCount` int NOT NULL DEFAULT 0,
	`lastQuestionCount` int NOT NULL DEFAULT 5,
	`lastDifficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`useCount` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizSourceHistories_id` PRIMARY KEY(`id`),
	CONSTRAINT `quiz_source_history_user_url_unique` UNIQUE(`userId`,`sourceUrl`)
);
--> statement-breakpoint
CREATE INDEX `quiz_source_history_user_used_idx` ON `quizSourceHistories` (`userId`,`lastUsedAt`);