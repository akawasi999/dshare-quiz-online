CREATE TABLE `quizCreatorDraftVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`draftKey` varchar(96) NOT NULL,
	`title` varchar(220) NOT NULL DEFAULT '',
	`payload` json NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizCreatorDraftVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `quiz_creator_draft_version_user_key_saved_idx` ON `quizCreatorDraftVersions` (`userId`,`draftKey`,`savedAt`);