CREATE TABLE `routeErrorEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`path` varchar(512) NOT NULL,
	`referrerPath` varchar(512),
	`userId` int,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routeErrorEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `route_error_events_occurred_idx` ON `routeErrorEvents` (`occurredAt`);--> statement-breakpoint
CREATE INDEX `route_error_events_path_idx` ON `routeErrorEvents` (`path`);