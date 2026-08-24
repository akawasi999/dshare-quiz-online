CREATE TABLE `oauthProviderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(40) NOT NULL,
	`clientId` varchar(320),
	`clientSecretCiphertext` text,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oauthProviderSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_provider_settings_provider_unique` UNIQUE(`provider`)
);
