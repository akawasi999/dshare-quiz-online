ALTER TABLE `subscriptionPlans` ADD `promoPrice` int;--> statement-breakpoint
ALTER TABLE `subscriptionPlans` ADD `displayOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userGroups` ADD `displayOrder` int DEFAULT 0 NOT NULL;