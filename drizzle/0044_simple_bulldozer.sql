CREATE TABLE `gamificationCelebrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('level_up','badge_awarded') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` varchar(500) NOT NULL,
	`xpAmount` int NOT NULL DEFAULT 0,
	`icon` varchar(80),
	`metadata` json,
	`sourceKey` varchar(191) NOT NULL,
	`seenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gamificationCelebrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `gamification_celebration_source_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
CREATE INDEX `gamification_celebration_user_seen_created_idx` ON `gamificationCelebrations` (`userId`,`seenAt`,`createdAt`);
--> statement-breakpoint
INSERT INTO `pointPriceRules` (`code`, `name`, `description`, `pointCost`, `isActive`)
SELECT 'ai_essay_feedback', 'Nhận xét bài tự luận AI', 'Phân tích bài làm theo rubric.', 15, true
WHERE NOT EXISTS (SELECT 1 FROM `pointPriceRules` WHERE `code` = 'ai_essay_feedback');
--> statement-breakpoint
INSERT INTO `pointPriceRules` (`code`, `name`, `description`, `pointCost`, `isActive`)
SELECT 'ai_image_analysis', 'Phân tích ảnh học tập AI', 'Đọc và giải thích bài tập trong ảnh.', 10, true
WHERE NOT EXISTS (SELECT 1 FROM `pointPriceRules` WHERE `code` = 'ai_image_analysis');
--> statement-breakpoint
INSERT INTO `pointPriceRules` (`code`, `name`, `description`, `pointCost`, `isActive`)
SELECT 'ai_voice_transcription', 'Chuyển giọng nói AI', 'Chuyển âm thanh học tập thành văn bản.', 10, true
WHERE NOT EXISTS (SELECT 1 FROM `pointPriceRules` WHERE `code` = 'ai_voice_transcription');
--> statement-breakpoint
INSERT INTO `pointPriceRules` (`code`, `name`, `description`, `pointCost`, `isActive`)
SELECT 'ai_question_generation', 'Tạo câu hỏi AI', 'Sinh một câu hỏi có đáp án bằng AI.', 8, true
WHERE NOT EXISTS (SELECT 1 FROM `pointPriceRules` WHERE `code` = 'ai_question_generation');
--> statement-breakpoint
INSERT INTO `pointPriceRules` (`code`, `name`, `description`, `pointCost`, `isActive`)
SELECT 'ai_question_enhancement', 'Nâng cao câu hỏi AI', 'Giải thích, viết lại hoặc tối ưu câu hỏi.', 5, true
WHERE NOT EXISTS (SELECT 1 FROM `pointPriceRules` WHERE `code` = 'ai_question_enhancement');
--> statement-breakpoint
INSERT INTO `missionDefinitions` (`code`, `title`, `description`, `icon`, `repeatType`, `metricType`, `target`, `xpReward`, `displayOrder`, `isActive`)
SELECT 'weekly_quiz_five', 'Chinh phục 5 Quiz mỗi tuần', 'Hoàn thành năm Quiz trong tuần để nhận phần thưởng XP.', 'CalendarDays', 'weekly', 'quiz_completed', 5, 240, 20, true
WHERE NOT EXISTS (SELECT 1 FROM `missionDefinitions` WHERE `code` = 'weekly_quiz_five');
