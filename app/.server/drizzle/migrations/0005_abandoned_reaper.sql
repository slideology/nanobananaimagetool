CREATE TABLE `guest_credit_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text,
	`used_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`usage_count` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_credit_usage_ip_address_unique` ON `guest_credit_usage` (`ip_address`);--> statement-breakpoint
CREATE INDEX `guest_credit_usage_ip_unique` ON `guest_credit_usage` (`ip_address`);--> statement-breakpoint
CREATE INDEX `guest_credit_usage_used_at_idx` ON `guest_credit_usage` (`used_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `has_received_login_bonus` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL;--> statement-breakpoint
-- 为现有用户设置默认值，假设现有用户都已经获得过奖励，避免给老用户额外积分
UPDATE `users` SET `has_received_login_bonus` = 1, `updated_at` = strftime('%s', 'now') WHERE `id` > 0;--> statement-breakpoint
CREATE INDEX `users_login_bonus_idx` ON `users` (`has_received_login_bonus`);