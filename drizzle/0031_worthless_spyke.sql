CREATE TABLE `xpLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`minXp` int NOT NULL,
	`icon` varchar(80),
	`rewardMetadata` json,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `xpLevels_id` PRIMARY KEY(`id`),
	CONSTRAINT `xp_levels_min_xp_unique` UNIQUE(`minXp`)
);
--> statement-breakpoint
CREATE TABLE `xpRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(160) NOT NULL,
	`trigger` varchar(100) NOT NULL,
	`conditionConfig` json,
	`xpAmount` int NOT NULL,
	`cooldownSeconds` int NOT NULL DEFAULT 0,
	`dailyCap` int,
	`effectiveAt` timestamp,
	`expiresAt` timestamp,
	`status` enum('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `xpRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `xp_rules_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `xpTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`sourceId` varchar(120),
	`ruleId` int,
	`reason` varchar(500) NOT NULL,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xpTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `xp_levels_active_order_idx` ON `xpLevels` (`isActive`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `xp_rules_status_trigger_idx` ON `xpRules` (`status`,`trigger`);--> statement-breakpoint
CREATE INDEX `xp_transactions_user_created_idx` ON `xpTransactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `xp_transactions_rule_idx` ON `xpTransactions` (`ruleId`);--> statement-breakpoint
CREATE INDEX `xp_transactions_source_idx` ON `xpTransactions` (`sourceType`,`sourceId`);