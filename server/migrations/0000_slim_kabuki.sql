CREATE TABLE `flow_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`duration` integer NOT NULL,
	`status` text NOT NULL,
	`tags` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roadmap_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roadmap_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`sub` text NOT NULL,
	`status` text NOT NULL,
	`status_class` text NOT NULL,
	`progress` integer NOT NULL,
	`icon` text NOT NULL,
	`icon_wrap` text NOT NULL,
	`meta` text NOT NULL,
	`current` integer,
	`blocked` integer,
	`position_x` integer NOT NULL,
	`position_y` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `flow_user_id_idx` ON `flow_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `flow_status_idx` ON `flow_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `flow_created_idx` ON `flow_sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `roadmap_edge_user_id_idx` ON `roadmap_edges` (`user_id`);--> statement-breakpoint
CREATE INDEX `roadmap_node_user_id_idx` ON `roadmap_nodes` (`user_id`);--> statement-breakpoint
CREATE INDEX `task_user_id_idx` ON `tasks` (`user_id`);--> statement-breakpoint
CREATE INDEX `task_due_date_idx` ON `tasks` (`due_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);