CREATE TABLE `siteNavigationItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(100) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteNavigationItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`homePageUrl` varchar(1024) NOT NULL DEFAULT 'https://dsharequiz-jxleeaps.manus.space',
	`boardTitle` varchar(180) NOT NULL DEFAULT 'Dshare Quiz Online',
	`metaDescription` varchar(320) NOT NULL DEFAULT 'Nền tảng tạo Quiz, học tập và chia sẻ kiến thức trực tuyến.',
	`defaultEmailAddress` varchar(320),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `site_navigation_position_idx` ON `siteNavigationItems` (`position`,`isEnabled`);
--> statement-breakpoint
INSERT INTO `siteNavigationItems` (`label`, `url`, `position`, `isEnabled`) VALUES
  ('Giới thiệu về chúng tôi', '/#ve-dshare', 1, true),
  ('Khám phá', '/explore', 2, true),
  ('Bảng giá', '/pricing', 3, true),
  ('Blog', '/explore', 4, true),
  ('Hỗ trợ khách hàng', '/account', 5, true);
