ALTER TABLE `questions` MODIFY COLUMN `lessonId` int;--> statement-breakpoint
ALTER TABLE `questions` ADD `topicId` int;--> statement-breakpoint
CREATE INDEX `questions_topic_idx` ON `questions` (`topicId`);