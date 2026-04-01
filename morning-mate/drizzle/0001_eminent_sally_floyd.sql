CREATE TABLE `childProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`age` int,
	`schoolTime` varchar(5),
	`reward` varchar(100),
	`language` enum('en','es') NOT NULL DEFAULT 'en',
	`enabledTasks` text,
	`stars` int DEFAULT 0,
	`streak` int DEFAULT 0,
	`completedDays` text,
	`lastCompletedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `childProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('freemium','starter','plus','gold') NOT NULL DEFAULT 'freemium',
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`status` enum('active','canceled','past_due','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
