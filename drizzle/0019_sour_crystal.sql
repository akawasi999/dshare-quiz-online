CREATE TABLE `paymentEmailDeliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentRecordId` int,
	`recipient` varchar(320) NOT NULL,
	`kind` enum('payment_confirmation','test') NOT NULL,
	`status` enum('sent','failed') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`providerMessageId` varchar(255),
	`errorMessage` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentEmailDeliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `payment_email_deliveries_payment_idx` ON `paymentEmailDeliveries` (`paymentRecordId`);--> statement-breakpoint
CREATE INDEX `payment_email_deliveries_created_idx` ON `paymentEmailDeliveries` (`createdAt`);