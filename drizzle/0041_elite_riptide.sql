CREATE TABLE `supportFaqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportFaqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(320),
	`message` text NOT NULL,
	`status` enum('new','read','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `support_faq_position_idx` ON `supportFaqs` (`position`,`isEnabled`);--> statement-breakpoint
CREATE INDEX `support_message_status_created_idx` ON `supportMessages` (`status`,`createdAt`);--> statement-breakpoint
INSERT INTO `supportFaqs` (`question`, `answer`, `position`, `isEnabled`)
SELECT 'Tôi có thể tạo Quiz như thế nào?', 'Bạn có thể bắt đầu từ nút Tạo Quiz, sau đó nhập thủ công hoặc dùng các công cụ AI được cấp theo gói tài khoản.', 1, true
WHERE NOT EXISTS (SELECT 1 FROM `supportFaqs`);--> statement-breakpoint
INSERT INTO `supportFaqs` (`question`, `answer`, `position`, `isEnabled`)
SELECT 'Point được sử dụng vào việc gì?', 'Point được dùng cho các hoạt động và quyền lợi được hiển thị rõ trên từng Quiz hoặc gói học.', 2, true
WHERE NOT EXISTS (SELECT 1 FROM `supportFaqs`);--> statement-breakpoint
INSERT INTO `supportFaqs` (`question`, `answer`, `position`, `isEnabled`)
SELECT 'Làm thế nào để xem lại kết quả Quiz?', 'Sau khi hoàn thành Quiz, bạn có thể xem phần kết quả để kiểm tra đáp án, tỷ lệ đúng và các gợi ý ôn tập.', 3, true
WHERE NOT EXISTS (SELECT 1 FROM `supportFaqs`);
