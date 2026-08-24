CREATE TABLE `userCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`passwordHash` varchar(512) NOT NULL,
	`resetTokenHash` varchar(128),
	`resetTokenExpiresAt` timestamp,
	`passwordUpdatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_credentials_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userOAuthIdentities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(40) NOT NULL,
	`providerSubject` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userOAuthIdentities_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_identity_provider_subject_unique` UNIQUE(`provider`,`providerSubject`)
);
--> statement-breakpoint
CREATE INDEX `user_credentials_reset_token_idx` ON `userCredentials` (`resetTokenHash`);--> statement-breakpoint
CREATE INDEX `oauth_identity_user_idx` ON `userOAuthIdentities` (`userId`);