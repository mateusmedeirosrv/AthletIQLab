ALTER TYPE "public"."ai_feature" ADD VALUE IF NOT EXISTS 'chat_workout_creation';--> statement-breakpoint
CREATE TYPE "public"."workout_creation_conversation_status" AS ENUM('in_progress', 'awaiting_authorization', 'authorized', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."ai_chat_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "workout_creation_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personal_id" uuid NOT NULL,
	"client_id" uuid,
	"status" "workout_creation_conversation_status" DEFAULT 'in_progress' NOT NULL,
	"modality" text,
	"goal" text,
	"detected_restrictions" text DEFAULT '[]' NOT NULL,
	"proposed_workout" jsonb,
	"resulting_workout_id" uuid,
	"total_turns" smallint DEFAULT 0 NOT NULL,
	"tokens_input" integer DEFAULT 0 NOT NULL,
	"tokens_output" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(8, 5) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"authorized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "ai_chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"quick_replies" jsonb,
	"selected_quick_reply" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_creation_conversations" ADD CONSTRAINT "wcc_personal_id_fk" FOREIGN KEY ("personal_id") REFERENCES "public"."personals"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_creation_conversations" ADD CONSTRAINT "wcc_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."students"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_creation_conversations" ADD CONSTRAINT "wcc_resulting_workout_id_fk" FOREIGN KEY ("resulting_workout_id") REFERENCES "public"."workouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."workout_creation_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_convos_personal_status" ON "workout_creation_conversations" USING btree ("personal_id","status");--> statement-breakpoint
CREATE INDEX "idx_ai_convos_personal_created" ON "workout_creation_conversations" USING btree ("personal_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_messages_conv" ON "ai_chat_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
ALTER TABLE "workout_creation_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ai_conv_all_by_personal" ON "workout_creation_conversations" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = personal_id) WITH CHECK (auth.uid() = personal_id);--> statement-breakpoint
CREATE POLICY "ai_chat_messages_by_personal" ON "ai_chat_messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (conversation_id IN (SELECT id FROM workout_creation_conversations WHERE personal_id = auth.uid())) WITH CHECK (conversation_id IN (SELECT id FROM workout_creation_conversations WHERE personal_id = auth.uid()));
