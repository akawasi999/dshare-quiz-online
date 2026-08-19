ALTER TABLE `subscriptionPlans` ADD `benefits` json;--> statement-breakpoint
ALTER TABLE `subscriptionPlans` ADD `payosEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptionPlans` ADD `payosRewardPoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptionPlans` ADD `membershipMonths` int DEFAULT 1 NOT NULL;