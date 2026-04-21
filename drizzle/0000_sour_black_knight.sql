CREATE TABLE `bug_details` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`severity` text DEFAULT 's3' NOT NULL,
	`reproduction_steps` text,
	`expected_result` text,
	`actual_result` text,
	`environment` text,
	`fixed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bug_details_work_item_id_unique` ON `bug_details` (`work_item_id`);--> statement-breakpoint
CREATE TABLE `classification_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`memo_work_item_id` text NOT NULL,
	`target_type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`parse_source` text,
	`parse_error` text,
	`applied_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`memo_work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "classification_candidates_target_type_check" CHECK("classification_candidates"."target_type" in ('task', 'bug', 'idea', 'implementation', 'future_feature', 'memo'))
);
--> statement-breakpoint
CREATE TABLE `export_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`format` text NOT NULL,
	`content_hash` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`value_hypothesis` text,
	`target_user` text,
	`feasibility` text,
	`decision` text,
	`promoted_work_item_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`promoted_work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ideas_work_item_id_unique` ON `ideas` (`work_item_id`);--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`source_format` text DEFAULT 'json' NOT NULL,
	`error_message` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`finished_at` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `local_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`display_name` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reference_services` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`repository_id` text,
	`name` text NOT NULL,
	`url` text,
	`reference_point` text,
	`strengths` text,
	`concerns` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reference_services_workspace_updated_idx` ON `reference_services` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`provider` text DEFAULT 'manual' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`html_url` text,
	`github_host` text,
	`github_owner` text,
	`github_repo` text,
	`github_full_name` text,
	`production_status` text DEFAULT 'development' NOT NULL,
	`criticality` text DEFAULT 'medium' NOT NULL,
	`current_focus` text,
	`next_version_id` text,
	`is_favorite` integer DEFAULT false NOT NULL,
	`sort_order` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "repositories_provider_check" CHECK("repositories"."provider" in ('manual', 'github')),
	CONSTRAINT "repositories_production_status_check" CHECK("repositories"."production_status" in ('planning', 'development', 'active_production', 'maintenance', 'paused')),
	CONSTRAINT "repositories_criticality_check" CHECK("repositories"."criticality" in ('high', 'medium', 'low'))
);
--> statement-breakpoint
CREATE INDEX `repositories_workspace_updated_idx` ON `repositories` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `repository_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`repository_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_date` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `status_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `status_histories_work_item_idx` ON `status_histories` (`work_item_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_workspace_name_uidx` ON `tags` (`workspace_id`,`name`);--> statement-breakpoint
CREATE TABLE `tech_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`repository_id` text,
	`name` text NOT NULL,
	`category` text,
	`adoption_status` text DEFAULT 'candidate' NOT NULL,
	`reason` text,
	`official_url` text,
	`concerns` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tech_notes_workspace_updated_idx` ON `tech_notes` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `work_item_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_item_id`) REFERENCES `work_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_item_tags_work_item_tag_uidx` ON `work_item_tags` (`work_item_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `work_items` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`repository_id` text,
	`scope` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`status` text NOT NULL,
	`resolution` text,
	`priority` text DEFAULT 'p2' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`source_ref` text,
	`privacy_level` text DEFAULT 'normal' NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`target_version_id` text,
	`due_at` text,
	`external_url` text,
	`external_provider` text,
	`external_id` text,
	`status_changed_at` text,
	`completed_at` text,
	`closed_at` text,
	`archived_at` text,
	`deleted_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_version_id`) REFERENCES `repository_versions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "work_items_scope_check" CHECK("work_items"."scope" in ('repository', 'inbox', 'global')),
	CONSTRAINT "work_items_type_check" CHECK("work_items"."type" in ('task', 'bug', 'idea', 'implementation', 'future_feature', 'memo')),
	CONSTRAINT "work_items_priority_check" CHECK("work_items"."priority" in ('p0', 'p1', 'p2', 'p3', 'p4')),
	CONSTRAINT "work_items_source_type_check" CHECK("work_items"."source_type" in ('manual', 'chatgpt', 'github', 'web', 'import', 'system')),
	CONSTRAINT "work_items_privacy_level_check" CHECK("work_items"."privacy_level" in ('normal', 'confidential', 'secret', 'no_ai')),
	CONSTRAINT "work_items_scope_repository_consistency" CHECK((("work_items"."scope" = 'repository' and "work_items"."repository_id" is not null) or ("work_items"."scope" in ('inbox', 'global') and "work_items"."repository_id" is null))),
	CONSTRAINT "work_items_external_provider_check" CHECK("work_items"."external_provider" is null or "work_items"."external_provider" = 'github')
);
--> statement-breakpoint
CREATE INDEX `work_items_workspace_updated_idx` ON `work_items` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `work_items_repository_idx` ON `work_items` (`repository_id`);--> statement-breakpoint
CREATE INDEX `work_items_inbox_idx` ON `work_items` (`workspace_id`,`type`,`status`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "workspace_members_role_check" CHECK("workspace_members"."role" in ('owner', 'member'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_workspace_user_uidx` ON `workspace_members` (`workspace_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`archived_at` text,
	`deleted_at` text,
	FOREIGN KEY (`owner_user_id`) REFERENCES `local_users`(`id`) ON UPDATE no action ON DELETE cascade
);
