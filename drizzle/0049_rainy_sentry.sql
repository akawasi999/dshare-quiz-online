ALTER TABLE `userCredentials` ADD `failedLoginAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userCredentials` ADD `loginLockedUntil` timestamp;