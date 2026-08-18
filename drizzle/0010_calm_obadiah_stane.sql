ALTER TABLE `questions` ADD `creatorUserId` int;--> statement-breakpoint
CREATE INDEX `questions_creator_idx` ON `questions` (`creatorUserId`);