CREATE TABLE "blog_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"keyword" text NOT NULL,
	"status" text DEFAULT 'keyword_analysis' NOT NULL,
	"keyword_analysis" jsonb,
	"subtitles" jsonb,
	"research_data" jsonb,
	"business_info" jsonb,
	"generated_content" text,
	"seo_metrics" jsonb,
	"reference_links" jsonb,
	"generated_images" jsonb,
	"reference_blog_links" jsonb,
	"custom_morphemes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "completed_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text,
	"keyword" text NOT NULL,
	"content" text NOT NULL,
	"reference_data" jsonb,
	"seo_metrics" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_type" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" text DEFAULT 'bank_transfer',
	"payment_status" text DEFAULT 'pending',
	"depositor_name" text,
	"confirmation_note" text,
	"confirmed_by" integer,
	"confirmed_at" timestamp,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer,
	"session_name" text NOT NULL,
	"session_description" text,
	"keyword" text NOT NULL,
	"keyword_analysis" jsonb,
	"subtitles" jsonb,
	"research_data" jsonb,
	"business_info" jsonb,
	"generated_content" text,
	"seo_metrics" jsonb,
	"reference_links" jsonb,
	"generated_images" jsonb,
	"reference_blog_links" jsonb,
	"custom_morphemes" text,
	"chat_history" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"project_id" integer,
	"tokens_used" integer DEFAULT 0,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_business_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name" text NOT NULL,
	"business_type" text NOT NULL,
	"expertise" text NOT NULL,
	"differentiators" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"password" text,
	"name" text,
	"profile_image" text,
	"phone" text,
	"google_id" text,
	"kakao_id" text,
	"naver_id" text,
	"is_email_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_admin" boolean DEFAULT false,
	"subscription_tier" text DEFAULT 'basic',
	"subscription_expires_at" timestamp,
	"can_generate_content" boolean DEFAULT false,
	"can_generate_images" boolean DEFAULT false,
	"can_use_chatbot" boolean DEFAULT false,
	"admin_override_plan" text,
	"admin_override_expires_at" timestamp,
	"admin_override_note" text,
	"total_tokens_used" integer DEFAULT 0,
	"monthly_tokens_used" integer DEFAULT 0,
	"last_token_reset_at" timestamp DEFAULT now(),
	"free_generation_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_kakao_id_unique" UNIQUE("kakao_id"),
	CONSTRAINT "users_naver_id_unique" UNIQUE("naver_id")
);
--> statement-breakpoint
ALTER TABLE "blog_projects" ADD CONSTRAINT "blog_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_project_id_blog_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."blog_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_projects" ADD CONSTRAINT "completed_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sessions" ADD CONSTRAINT "project_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sessions" ADD CONSTRAINT "project_sessions_project_id_blog_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."blog_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_project_id_blog_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."blog_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_business_info" ADD CONSTRAINT "user_business_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");