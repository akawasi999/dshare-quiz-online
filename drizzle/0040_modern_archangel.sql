ALTER TABLE `siteSettings` ADD `termsContent` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `termsUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `privacyContent` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `privacyUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `supportTitle` varchar(180);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `supportDescription` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `supportEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `supportPhone` varchar(80);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `supportHours` varchar(320);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `supportUpdatedAt` timestamp;