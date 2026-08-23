CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` varchar(500) NOT NULL,
	`icon` varchar(80) NOT NULL,
	`conditionType` varchar(80) NOT NULL,
	`conditionConfig` json,
	`xpReward` int NOT NULL DEFAULT 0,
	`badgeId` int,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(500) NOT NULL,
	`icon` varchar(80) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT '#7C5CFC',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gamificationFeatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(500) NOT NULL,
	`icon` varchar(80),
	`category` enum('learning','creation','ai','analytics','premium') NOT NULL DEFAULT 'learning',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gamificationFeatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `gamification_features_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `levelFeatureUnlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`levelId` int NOT NULL,
	`featureId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `levelFeatureUnlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `level_feature_unlock_unique` UNIQUE(`levelId`,`featureId`)
);
--> statement-breakpoint
CREATE TABLE `missionDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` varchar(500) NOT NULL,
	`icon` varchar(80),
	`repeatType` enum('daily','weekly','special') NOT NULL DEFAULT 'daily',
	`metricType` enum('quiz_completed','questions_answered','score_threshold','study_minutes','ai_content_created') NOT NULL,
	`target` int NOT NULL,
	`xpReward` int NOT NULL,
	`conditionConfig` json,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `missionDefinitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `mission_definitions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `pointPriceRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` varchar(500),
	`pointCost` int NOT NULL,
	`conditionConfig` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pointPriceRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `point_price_rules_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `streakRewardClaims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`milestoneId` int NOT NULL,
	`streakKey` varchar(24) NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `streakRewardClaims_id` PRIMARY KEY(`id`),
	CONSTRAINT `streak_reward_claim_unique` UNIQUE(`userId`,`milestoneId`,`streakKey`)
);
--> statement-breakpoint
CREATE TABLE `streakRewardMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`days` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` varchar(500) NOT NULL,
	`xpReward` int NOT NULL,
	`badgeId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streakRewardMilestones_id` PRIMARY KEY(`id`),
	CONSTRAINT `streak_reward_milestones_days_unique` UNIQUE(`days`)
);
--> statement-breakpoint
CREATE TABLE `userAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`target` int NOT NULL DEFAULT 1,
	`status` enum('locked','unlocked') NOT NULL DEFAULT 'locked',
	`unlockedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_achievement_unique` UNIQUE(`userId`,`achievementId`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`sourceId` varchar(120),
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_badge_source_unique` UNIQUE(`userId`,`badgeId`,`sourceType`,`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `userMissionAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`missionDefinitionId` int NOT NULL,
	`periodKey` varchar(20) NOT NULL,
	`target` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`xpReward` int NOT NULL,
	`status` enum('available','completed','claimed','expired') NOT NULL DEFAULT 'available',
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMissionAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_mission_period_unique` UNIQUE(`userId`,`missionDefinitionId`,`periodKey`)
);
--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `xpBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `currentLevelId` int;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `longestStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `lastLearningAt` timestamp;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `gamificationOnboardedAt` timestamp;--> statement-breakpoint
ALTER TABLE `xpLevels` ADD `description` varchar(500);--> statement-breakpoint
ALTER TABLE `xpTransactions` ADD `balanceAfter` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `xpTransactions` ADD `dedupeKey` varchar(191);--> statement-breakpoint
ALTER TABLE `xpTransactions` ADD `metadata` json;--> statement-breakpoint
ALTER TABLE `xpTransactions` ADD CONSTRAINT `xp_transactions_dedupe_unique` UNIQUE(`dedupeKey`);--> statement-breakpoint
CREATE INDEX `achievements_active_order_idx` ON `achievements` (`isActive`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `badges_active_idx` ON `badges` (`isActive`);--> statement-breakpoint
CREATE INDEX `gamification_features_active_category_idx` ON `gamificationFeatures` (`isActive`,`category`);--> statement-breakpoint
CREATE INDEX `level_feature_unlock_feature_idx` ON `levelFeatureUnlocks` (`featureId`);--> statement-breakpoint
CREATE INDEX `mission_definitions_active_repeat_idx` ON `missionDefinitions` (`isActive`,`repeatType`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `point_price_rules_active_idx` ON `pointPriceRules` (`isActive`);--> statement-breakpoint
CREATE INDEX `streak_reward_claim_user_idx` ON `streakRewardClaims` (`userId`,`claimedAt`);--> statement-breakpoint
CREATE INDEX `user_achievement_user_status_idx` ON `userAchievements` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `user_badges_user_awarded_idx` ON `userBadges` (`userId`,`awardedAt`);--> statement-breakpoint
CREATE INDEX `user_missions_user_status_expiry_idx` ON `userMissionAssignments` (`userId`,`status`,`expiresAt`);
--> statement-breakpoint
INSERT INTO `badges` (`code`, `name`, `description`, `icon`, `color`, `isActive`)
SELECT 'first_quiz', 'Quiz Rookie', 'Hoàn thành Quiz đầu tiên.', 'Rocket', '#2563EB', true
WHERE NOT EXISTS (SELECT 1 FROM `badges` WHERE `code` = 'first_quiz');--> statement-breakpoint
INSERT INTO `badges` (`code`, `name`, `description`, `icon`, `color`, `isActive`)
SELECT 'perfect_score', 'Perfect Score', 'Đạt 100% trong một lượt làm bài.', 'Medal', '#7C5CFC', true
WHERE NOT EXISTS (SELECT 1 FROM `badges` WHERE `code` = 'perfect_score');--> statement-breakpoint
INSERT INTO `badges` (`code`, `name`, `description`, `icon`, `color`, `isActive`)
SELECT 'streak_7', '7 Day Learner', 'Duy trì nhịp học trong 7 ngày.', 'Flame', '#F59E0B', true
WHERE NOT EXISTS (SELECT 1 FROM `badges` WHERE `code` = 'streak_7');--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'Beginner', 0, 'Bắt đầu hành trình học tập.', 'Sparkles', 1, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 0);--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'Quiz Explorer', 250, 'Mở khóa tạo Quiz cơ bản.', 'Compass', 2, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 250);--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'AI Learner', 600, 'Mở khóa công cụ tạo câu hỏi bằng AI.', 'Bot', 3, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 600);--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'Quiz Builder', 1400, 'Mở khóa tạo Quiz nâng cao.', 'Wand2', 4, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 1400);--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'AI Strategist', 3000, 'Mở khóa AI Quiz Generator.', 'BrainCircuit', 5, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 3000);--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'Learning Analyst', 5500, 'Mở khóa phân tích học tập nâng cao.', 'ChartNoAxesCombined', 6, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 5500);--> statement-breakpoint
INSERT INTO `xpLevels` (`name`, `minXp`, `description`, `icon`, `displayOrder`, `isActive`)
SELECT 'Learning Legend', 9000, 'Mở khóa toàn bộ trải nghiệm Learning AI.', 'Crown', 7, true
WHERE NOT EXISTS (SELECT 1 FROM `xpLevels` WHERE `minXp` = 9000);--> statement-breakpoint
INSERT INTO `xpRules` (`code`, `name`, `trigger`, `conditionConfig`, `xpAmount`, `cooldownSeconds`, `dailyCap`, `status`, `createdByUserId`, `updatedByUserId`)
SELECT 'quiz.completed', 'Hoàn thành Quiz', 'quiz.submitted', NULL, 40, 0, NULL, 'active', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `xpRules` WHERE `code` = 'quiz.completed');--> statement-breakpoint
INSERT INTO `xpRules` (`code`, `name`, `trigger`, `conditionConfig`, `xpAmount`, `cooldownSeconds`, `dailyCap`, `status`, `createdByUserId`, `updatedByUserId`)
SELECT 'quiz.passed', 'Đạt mục tiêu Quiz', 'quiz.passed', NULL, 20, 0, NULL, 'active', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `xpRules` WHERE `code` = 'quiz.passed');--> statement-breakpoint
INSERT INTO `xpRules` (`code`, `name`, `trigger`, `conditionConfig`, `xpAmount`, `cooldownSeconds`, `dailyCap`, `status`, `createdByUserId`, `updatedByUserId`)
SELECT 'quiz.perfect', 'Hoàn thành Quiz tuyệt đối', 'quiz.perfect', NULL, 40, 0, NULL, 'active', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `xpRules` WHERE `code` = 'quiz.perfect');--> statement-breakpoint
INSERT INTO `gamificationFeatures` (`code`, `name`, `description`, `icon`, `category`, `isActive`)
SELECT 'create_quiz', 'Tạo Quiz cơ bản', 'Tạo và lưu bộ câu hỏi của riêng bạn.', 'FilePlus2', 'creation', true
WHERE NOT EXISTS (SELECT 1 FROM `gamificationFeatures` WHERE `code` = 'create_quiz');--> statement-breakpoint
INSERT INTO `gamificationFeatures` (`code`, `name`, `description`, `icon`, `category`, `isActive`)
SELECT 'ai_question_generation', 'Tạo câu hỏi bằng AI', 'Dùng AI để tạo câu hỏi theo chủ đề.', 'Bot', 'ai', true
WHERE NOT EXISTS (SELECT 1 FROM `gamificationFeatures` WHERE `code` = 'ai_question_generation');--> statement-breakpoint
INSERT INTO `gamificationFeatures` (`code`, `name`, `description`, `icon`, `category`, `isActive`)
SELECT 'advanced_quiz_creation', 'Tạo Quiz nâng cao', 'Khai thác đầy đủ công cụ biên soạn Quiz.', 'Wand2', 'creation', true
WHERE NOT EXISTS (SELECT 1 FROM `gamificationFeatures` WHERE `code` = 'advanced_quiz_creation');--> statement-breakpoint
INSERT INTO `gamificationFeatures` (`code`, `name`, `description`, `icon`, `category`, `isActive`)
SELECT 'ai_quiz_generator', 'AI Quiz Generator', 'Tạo nhanh Quiz từ mục tiêu học tập.', 'BrainCircuit', 'ai', true
WHERE NOT EXISTS (SELECT 1 FROM `gamificationFeatures` WHERE `code` = 'ai_quiz_generator');--> statement-breakpoint
INSERT INTO `gamificationFeatures` (`code`, `name`, `description`, `icon`, `category`, `isActive`)
SELECT 'learning_analytics', 'Phân tích học tập', 'Theo dõi sâu hiệu quả và tiến trình học tập.', 'ChartNoAxesCombined', 'analytics', true
WHERE NOT EXISTS (SELECT 1 FROM `gamificationFeatures` WHERE `code` = 'learning_analytics');--> statement-breakpoint
INSERT INTO `levelFeatureUnlocks` (`levelId`, `featureId`)
SELECT levelRow.`id`, featureRow.`id` FROM `xpLevels` levelRow CROSS JOIN `gamificationFeatures` featureRow
WHERE levelRow.`minXp` = 250 AND featureRow.`code` = 'create_quiz'
AND NOT EXISTS (SELECT 1 FROM `levelFeatureUnlocks` existing WHERE existing.`levelId` = levelRow.`id` AND existing.`featureId` = featureRow.`id`);--> statement-breakpoint
INSERT INTO `levelFeatureUnlocks` (`levelId`, `featureId`)
SELECT levelRow.`id`, featureRow.`id` FROM `xpLevels` levelRow CROSS JOIN `gamificationFeatures` featureRow
WHERE levelRow.`minXp` = 600 AND featureRow.`code` = 'ai_question_generation'
AND NOT EXISTS (SELECT 1 FROM `levelFeatureUnlocks` existing WHERE existing.`levelId` = levelRow.`id` AND existing.`featureId` = featureRow.`id`);--> statement-breakpoint
INSERT INTO `levelFeatureUnlocks` (`levelId`, `featureId`)
SELECT levelRow.`id`, featureRow.`id` FROM `xpLevels` levelRow CROSS JOIN `gamificationFeatures` featureRow
WHERE levelRow.`minXp` = 1400 AND featureRow.`code` = 'advanced_quiz_creation'
AND NOT EXISTS (SELECT 1 FROM `levelFeatureUnlocks` existing WHERE existing.`levelId` = levelRow.`id` AND existing.`featureId` = featureRow.`id`);--> statement-breakpoint
INSERT INTO `levelFeatureUnlocks` (`levelId`, `featureId`)
SELECT levelRow.`id`, featureRow.`id` FROM `xpLevels` levelRow CROSS JOIN `gamificationFeatures` featureRow
WHERE levelRow.`minXp` = 3000 AND featureRow.`code` = 'ai_quiz_generator'
AND NOT EXISTS (SELECT 1 FROM `levelFeatureUnlocks` existing WHERE existing.`levelId` = levelRow.`id` AND existing.`featureId` = featureRow.`id`);--> statement-breakpoint
INSERT INTO `levelFeatureUnlocks` (`levelId`, `featureId`)
SELECT levelRow.`id`, featureRow.`id` FROM `xpLevels` levelRow CROSS JOIN `gamificationFeatures` featureRow
WHERE levelRow.`minXp` = 5500 AND featureRow.`code` = 'learning_analytics'
AND NOT EXISTS (SELECT 1 FROM `levelFeatureUnlocks` existing WHERE existing.`levelId` = levelRow.`id` AND existing.`featureId` = featureRow.`id`);--> statement-breakpoint
INSERT INTO `missionDefinitions` (`code`, `title`, `description`, `icon`, `repeatType`, `metricType`, `target`, `xpReward`, `conditionConfig`, `displayOrder`, `isActive`)
SELECT 'daily_quiz_three', 'Hoàn thành 3 Quiz', 'Duy trì nhịp học bằng ba lượt hoàn thành hôm nay.', 'CircleCheckBig', 'daily', 'quiz_completed', 3, 100, NULL, 1, true
WHERE NOT EXISTS (SELECT 1 FROM `missionDefinitions` WHERE `code` = 'daily_quiz_three');--> statement-breakpoint
INSERT INTO `missionDefinitions` (`code`, `title`, `description`, `icon`, `repeatType`, `metricType`, `target`, `xpReward`, `conditionConfig`, `displayOrder`, `isActive`)
SELECT 'daily_score_eighty', 'Chinh phục mốc 80%', 'Đạt tối thiểu 80% trong một Quiz hôm nay.', 'Target', 'daily', 'score_threshold', 1, 150, JSON_OBJECT('minimumScore', 80), 2, true
WHERE NOT EXISTS (SELECT 1 FROM `missionDefinitions` WHERE `code` = 'daily_score_eighty');--> statement-breakpoint
INSERT INTO `missionDefinitions` (`code`, `title`, `description`, `icon`, `repeatType`, `metricType`, `target`, `xpReward`, `conditionConfig`, `displayOrder`, `isActive`)
SELECT 'daily_questions_five', 'Giải 5 câu hỏi', 'Trả lời ít nhất 5 câu hỏi trong ngày.', 'ListChecks', 'daily', 'questions_answered', 5, 30, NULL, 3, true
WHERE NOT EXISTS (SELECT 1 FROM `missionDefinitions` WHERE `code` = 'daily_questions_five');--> statement-breakpoint
INSERT INTO `achievements` (`code`, `title`, `description`, `icon`, `conditionType`, `conditionConfig`, `xpReward`, `badgeId`, `displayOrder`, `isActive`)
SELECT 'first_quiz', 'Quiz đầu tiên', 'Hoàn thành Quiz đầu tiên của bạn.', 'Rocket', 'quiz_completed', JSON_OBJECT('target', 1), 50, (SELECT `id` FROM `badges` WHERE `code` = 'first_quiz' LIMIT 1), 1, true
WHERE NOT EXISTS (SELECT 1 FROM `achievements` WHERE `code` = 'first_quiz');--> statement-breakpoint
INSERT INTO `achievements` (`code`, `title`, `description`, `icon`, `conditionType`, `conditionConfig`, `xpReward`, `badgeId`, `displayOrder`, `isActive`)
SELECT 'perfect_score', 'Điểm tuyệt đối', 'Đạt 100% trong một lượt làm bài.', 'Medal', 'perfect_score', JSON_OBJECT('minimumScore', 100), 100, (SELECT `id` FROM `badges` WHERE `code` = 'perfect_score' LIMIT 1), 2, true
WHERE NOT EXISTS (SELECT 1 FROM `achievements` WHERE `code` = 'perfect_score');--> statement-breakpoint
INSERT INTO `streakRewardMilestones` (`days`, `title`, `description`, `xpReward`, `badgeId`, `isActive`)
SELECT 3, 'Nhịp học 3 ngày', 'Giữ nhịp học trong 3 ngày liên tiếp.', 50, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM `streakRewardMilestones` WHERE `days` = 3);--> statement-breakpoint
INSERT INTO `streakRewardMilestones` (`days`, `title`, `description`, `xpReward`, `badgeId`, `isActive`)
SELECT 7, 'Nhịp học 7 ngày', 'Giữ nhịp học trong 7 ngày liên tiếp.', 150, (SELECT `id` FROM `badges` WHERE `code` = 'streak_7' LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM `streakRewardMilestones` WHERE `days` = 7);--> statement-breakpoint
INSERT INTO `streakRewardMilestones` (`days`, `title`, `description`, `xpReward`, `badgeId`, `isActive`)
SELECT 14, 'Nhịp học 14 ngày', 'Giữ nhịp học trong 14 ngày liên tiếp.', 400, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM `streakRewardMilestones` WHERE `days` = 14);--> statement-breakpoint
INSERT INTO `streakRewardMilestones` (`days`, `title`, `description`, `xpReward`, `badgeId`, `isActive`)
SELECT 30, 'Nhịp học 30 ngày', 'Giữ nhịp học trong 30 ngày liên tiếp.', 1000, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM `streakRewardMilestones` WHERE `days` = 30);
