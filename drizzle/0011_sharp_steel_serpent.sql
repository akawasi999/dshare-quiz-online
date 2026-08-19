CREATE TABLE `brandSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryColor` varchar(16) NOT NULL DEFAULT '#065BE5',
	`accentColor` varchar(16) NOT NULL DEFAULT '#3762D2',
	`successColor` varchar(16) NOT NULL DEFAULT '#007453',
	`attentionColor` varchar(16) NOT NULL DEFAULT '#DE1264',
	`pageColor` varchar(16) NOT NULL DEFAULT '#EBF4FF',
	`surfaceColor` varchar(16) NOT NULL DEFAULT '#FFFFFF',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandSettings_id` PRIMARY KEY(`id`)
);
