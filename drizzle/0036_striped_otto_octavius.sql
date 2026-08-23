CREATE TABLE `seoSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googleAnalyticsMeasurementId` varchar(32),
	`googleSearchConsoleVerification` varchar(255),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seoSettings_id` PRIMARY KEY(`id`)
);
