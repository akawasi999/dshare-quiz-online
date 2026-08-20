CREATE TABLE `emailDeliverySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(40) NOT NULL DEFAULT 'resend',
	`apiKeyCiphertext` text,
	`fromEmail` varchar(320),
	`isEnabled` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailDeliverySettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `confirmationEmailSentAt` timestamp;