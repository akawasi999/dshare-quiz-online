CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`tier` enum('basic','pro','premium') NOT NULL,
	`description` varchar(500),
	`monthlyPrice` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `userGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userGroupMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_group_members_user_unique` UNIQUE(`userId`),
	CONSTRAINT `user_group_members_group_user_unique` UNIQUE(`groupId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `userGroupPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`permissionKey` varchar(80) NOT NULL,
	`isAllowed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userGroupPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_group_permissions_unique` UNIQUE(`groupId`,`permissionKey`)
);
--> statement-breakpoint
CREATE TABLE `userGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int,
	`name` varchar(120) NOT NULL,
	`description` varchar(500),
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userGroups_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_groups_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE INDEX `user_group_members_group_idx` ON `userGroupMembers` (`groupId`);--> statement-breakpoint
CREATE INDEX `user_group_permissions_group_idx` ON `userGroupPermissions` (`groupId`);--> statement-breakpoint
CREATE INDEX `user_groups_plan_idx` ON `userGroups` (`planId`);