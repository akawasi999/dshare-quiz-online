CREATE TABLE `permissionRegistry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(120) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` varchar(600),
	`category` varchar(80) NOT NULL,
	`type` enum('boolean','limit','quota') NOT NULL DEFAULT 'boolean',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissionRegistry_id` PRIMARY KEY(`id`),
	CONSTRAINT `permission_registry_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlanPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`permissionId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`limitValue` int,
	`limitUnit` varchar(40),
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlanPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plan_permissions_unique` UNIQUE(`planId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `userPermissionOverrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissionId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`limitValue` int,
	`expiresAt` timestamp,
	`reason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPermissionOverrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_permission_overrides_unique` UNIQUE(`userId`,`permissionId`)
);
--> statement-breakpoint
CREATE INDEX `permission_registry_category_idx` ON `permissionRegistry` (`category`);--> statement-breakpoint
CREATE INDEX `subscription_plan_permissions_plan_idx` ON `subscriptionPlanPermissions` (`planId`);--> statement-breakpoint
CREATE INDEX `user_permission_overrides_user_idx` ON `userPermissionOverrides` (`userId`);