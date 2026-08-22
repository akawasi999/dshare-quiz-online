CREATE TABLE `userNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('account_plan','account_permission','quiz_approved','quiz_rejected') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(512),
	`metadata` json,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_notifications_user_unread_created_idx` ON `userNotifications` (`userId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `user_notifications_user_created_idx` ON `userNotifications` (`userId`,`createdAt`);