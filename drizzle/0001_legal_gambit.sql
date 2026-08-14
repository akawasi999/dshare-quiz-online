CREATE TABLE `attemptAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedOptionIds` json NOT NULL,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`savedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attemptAnswers_id` PRIMARY KEY(`id`),
	CONSTRAINT `attempt_answer_unique` UNIQUE(`attemptId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `attemptSecurityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`eventType` enum('copy','paste','context_menu','tab_hidden','fullscreen_exit') NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attemptSecurityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`quizId` int NOT NULL,
	`mode` enum('training','testing') NOT NULL,
	`status` enum('in_progress','submitted','expired') NOT NULL DEFAULT 'in_progress',
	`questionOrder` json NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`score` int NOT NULL DEFAULT 0,
	`correctCount` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 0,
	`passed` boolean NOT NULL DEFAULT false,
	`violationCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bugReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`attemptId` int,
	`details` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`moderatorNote` text,
	`rewardPoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `bugReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`accent` varchar(24) NOT NULL DEFAULT '#C7A76C',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `discussionPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`userId` int NOT NULL,
	`parentId` int,
	`body` text NOT NULL,
	`status` enum('visible','hidden') NOT NULL DEFAULT 'visible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discussionPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learnerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('basic','pro','premium') NOT NULL DEFAULT 'basic',
	`pointBalance` int NOT NULL DEFAULT 0,
	`referralCode` varchar(20) NOT NULL,
	`referredByCode` varchar(20),
	`avatarUrl` varchar(1024),
	`bio` varchar(500),
	`isBanned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_profiles_user_unique` UNIQUE(`userId`),
	CONSTRAINT `learner_profiles_referral_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`summary` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`),
	CONSTRAINT `lessons_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `paymentRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCustomerId` varchar(255),
	`itemType` enum('points','membership') NOT NULL,
	`itemCode` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_records_intent_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `questionOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`body` text NOT NULL,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `questionOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`prompt` text NOT NULL,
	`type` enum('single','multiple','true_false','fill_blank','image','matching') NOT NULL DEFAULT 'single',
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`explanation` text,
	`tags` json NOT NULL,
	`imageUrl` varchar(1024),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`questionId` int NOT NULL,
	`points` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`),
	CONSTRAINT `quiz_question_unique` UNIQUE(`quizId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`slug` varchar(240) NOT NULL,
	`summary` text,
	`mode` enum('training','testing') NOT NULL DEFAULT 'training',
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`accessTier` enum('basic','pro','premium') NOT NULL DEFAULT 'basic',
	`durationSeconds` int NOT NULL DEFAULT 900,
	`passingScore` int NOT NULL DEFAULT 70,
	`entryPointCost` int NOT NULL DEFAULT 0,
	`completionReward` int NOT NULL DEFAULT 0,
	`questionCount` int NOT NULL DEFAULT 0,
	`randomizeQuestions` boolean NOT NULL DEFAULT true,
	`randomizeOptions` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quizzes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `walletTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('top_up','quiz_fee','quiz_reward','referral_reward','report_reward','admin_adjustment','plan_upgrade') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`referenceType` varchar(60),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `attempt_answers_attempt_idx` ON `attemptAnswers` (`attemptId`);--> statement-breakpoint
CREATE INDEX `attempt_security_events_attempt_idx` ON `attemptSecurityEvents` (`attemptId`);--> statement-breakpoint
CREATE INDEX `attempts_user_idx` ON `attempts` (`userId`);--> statement-breakpoint
CREATE INDEX `attempts_quiz_idx` ON `attempts` (`quizId`);--> statement-breakpoint
CREATE INDEX `attempts_status_idx` ON `attempts` (`status`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `auditLogs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `bug_reports_status_idx` ON `bugReports` (`status`);--> statement-breakpoint
CREATE INDEX `bug_reports_question_idx` ON `bugReports` (`questionId`);--> statement-breakpoint
CREATE INDEX `discussion_posts_quiz_idx` ON `discussionPosts` (`quizId`);--> statement-breakpoint
CREATE INDEX `lessons_subject_idx` ON `lessons` (`subjectId`);--> statement-breakpoint
CREATE INDEX `payment_records_user_idx` ON `paymentRecords` (`userId`);--> statement-breakpoint
CREATE INDEX `question_options_question_idx` ON `questionOptions` (`questionId`);--> statement-breakpoint
CREATE INDEX `questions_lesson_idx` ON `questions` (`lessonId`);--> statement-breakpoint
CREATE INDEX `questions_difficulty_idx` ON `questions` (`difficulty`);--> statement-breakpoint
CREATE INDEX `quiz_questions_quiz_idx` ON `quizQuestions` (`quizId`);--> statement-breakpoint
CREATE INDEX `quizzes_lesson_idx` ON `quizzes` (`lessonId`);--> statement-breakpoint
CREATE INDEX `quizzes_publish_idx` ON `quizzes` (`isPublished`);--> statement-breakpoint
CREATE INDEX `subjects_category_idx` ON `subjects` (`categoryId`);--> statement-breakpoint
CREATE INDEX `wallet_transactions_user_idx` ON `walletTransactions` (`userId`);