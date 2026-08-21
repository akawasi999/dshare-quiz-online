ALTER TABLE `quizzes` ADD `visibility` enum('public','private') DEFAULT 'public' NOT NULL;--> statement-breakpoint
CREATE INDEX `quizzes_visibility_idx` ON `quizzes` (`visibility`);