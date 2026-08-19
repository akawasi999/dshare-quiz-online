CREATE TABLE `membershipGroupPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` enum('basic','pro','premium') NOT NULL,
	`canCreateQuiz` boolean NOT NULL DEFAULT true,
	`canUseAi` boolean NOT NULL DEFAULT true,
	`canExportData` boolean NOT NULL DEFAULT false,
	`canViewAdvancedReports` boolean NOT NULL DEFAULT false,
	`canReceivePrioritySupport` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membershipGroupPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_group_permissions_tier_unique` UNIQUE(`tier`)
);
