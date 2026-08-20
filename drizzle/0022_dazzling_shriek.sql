CREATE TABLE `aiAssistantConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiAssistantConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiAssistantSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('manus','gemini') NOT NULL DEFAULT 'manus',
	`model` varchar(120) NOT NULL DEFAULT 'gpt-5-mini',
	`apiKeyCiphertext` text,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`welcomeMessage` varchar(500) NOT NULL DEFAULT 'Chào bạn, tôi là Dshare AI Assistant. Tôi có thể giúp bạn lập kế hoạch ôn tập, giải thích khái niệm và gợi ý cách học hiệu quả.',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiAssistantSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ai_assistant_conversations_user_created_idx` ON `aiAssistantConversations` (`userId`,`createdAt`);