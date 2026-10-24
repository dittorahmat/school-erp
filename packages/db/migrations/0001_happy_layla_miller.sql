CREATE TABLE `inventory_asset_units` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`asset_tag` text NOT NULL,
	`serial_number` text,
	`location_id` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`condition` text DEFAULT 'good' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `inventory_locations`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_asset_units_asset_tag_unique` ON `inventory_asset_units` (`asset_tag`);--> statement-breakpoint
CREATE TABLE `inventory_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_categories_name_unique` ON `inventory_categories` (`name`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`unit` text NOT NULL,
	`min_stock_alert` integer DEFAULT 0 NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_items_code_unique` ON `inventory_items` (`code`);--> statement-breakpoint
CREATE TABLE `inventory_loans` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`borrower_id` text NOT NULL,
	`approver_id` text,
	`loan_date` integer NOT NULL,
	`expected_return_date` integer NOT NULL,
	`actual_return_date` integer,
	`purpose` text NOT NULL,
	`out_condition` text DEFAULT 'good' NOT NULL,
	`return_condition` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`inspection_notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `inventory_asset_units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`borrower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_locations_name_unique` ON `inventory_locations` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_locations_code_unique` ON `inventory_locations` (`code`);--> statement-breakpoint
CREATE TABLE `inventory_requisitions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`approver_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`reference_user` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reference_user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `academic_years` ADD `start_date` text;--> statement-breakpoint
ALTER TABLE `academic_years` ADD `end_date` text;