ALTER TABLE `learnerProfiles` ADD `countryCode` varchar(2);--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `province` varchar(120);--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `pendingContactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `contactEmailVerificationTokenHash` varchar(128);--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `contactEmailVerificationExpiresAt` timestamp;