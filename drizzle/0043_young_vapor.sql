ALTER TABLE `walletTransactions` MODIFY COLUMN `type` enum('top_up','quiz_fee','quiz_reward','referral_reward','report_reward','admin_adjustment','plan_upgrade','ai_question_generation','ai_quiz_generation','premium_feature','refund') NOT NULL;--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD `balanceBefore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD `dedupeKey` varchar(191);--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD `metadata` json;--> statement-breakpoint
ALTER TABLE `walletTransactions` ADD CONSTRAINT `wallet_transactions_dedupe_unique` UNIQUE(`dedupeKey`);