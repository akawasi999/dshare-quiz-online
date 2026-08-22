ALTER TABLE `topics` ADD `allowQuizCreation` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `topics` ADD `requireQuizModeration` boolean DEFAULT false NOT NULL;