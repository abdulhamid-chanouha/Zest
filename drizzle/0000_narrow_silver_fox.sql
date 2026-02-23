CREATE TABLE `recipe_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`shared_by` text NOT NULL,
	`shared_with_user_id` text,
	`shared_with_email` text,
	`share_token` text NOT NULL,
	`access` text DEFAULT 'read' NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_shares_share_token_unique` ON `recipe_shares` (`share_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_shares_recipe_user_unique` ON `recipe_shares` (`recipe_id`,`shared_with_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_shares_recipe_email_unique` ON `recipe_shares` (`recipe_id`,`shared_with_email`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`cuisine` text,
	`prep_time_minutes` integer,
	`cook_time_minutes` integer,
	`servings` integer,
	`ingredients_json` text NOT NULL,
	`instructions` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'to_try' NOT NULL,
	`tags_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recipes_status_check" CHECK("recipes"."status" in ('favorite', 'to_try', 'made_before'))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);