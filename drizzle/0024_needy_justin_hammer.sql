CREATE TABLE `quizCreatorDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`draftKey` varchar(96) NOT NULL,
	`quizId` int,
	`title` varchar(220) NOT NULL DEFAULT '',
	`payload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizCreatorDrafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `quiz_creator_draft_user_key_unique` UNIQUE(`userId`,`draftKey`)
);
--> statement-breakpoint
CREATE INDEX `quiz_creator_draft_user_updated_idx` ON `quizCreatorDrafts` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `quiz_creator_draft_quiz_idx` ON `quizCreatorDrafts` (`quizId`);