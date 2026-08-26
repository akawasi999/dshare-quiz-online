CREATE TABLE `quizStudioAiHistories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('chat','enhancement') NOT NULL,
	`label` varchar(220) NOT NULL,
	`payload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizStudioAiHistories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `quiz_studio_ai_history_user_created_idx` ON `quizStudioAiHistories` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `quiz_studio_ai_history_user_kind_idx` ON `quizStudioAiHistories` (`userId`,`kind`);