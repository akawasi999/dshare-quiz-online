ALTER TABLE `paymentRecords` ADD `payosOrderCode` bigint;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `payosOrderCode` bigint;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `payosPaymentLinkId` varchar(255);--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `amount` int;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `currency` varchar(8) DEFAULT 'VND' NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `status` enum('pending','paid','cancelled','failed','expired') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `pointAmount` int;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `targetTier` enum('basic','pro','premium');--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `description` varchar(500);--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `webhookReference` varchar(255);--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `webhookPayload` json;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD CONSTRAINT `payment_records_payos_order_unique` UNIQUE(`payosOrderCode`);--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD CONSTRAINT `payment_records_payos_link_unique` UNIQUE(`payosPaymentLinkId`);--> statement-breakpoint
CREATE INDEX `payment_records_status_idx` ON `paymentRecords` (`status`);
