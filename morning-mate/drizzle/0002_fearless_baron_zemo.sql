CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(50) DEFAULT 'landing_page',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_email_unique` UNIQUE(`email`)
);
