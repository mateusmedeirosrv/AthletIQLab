CREATE TABLE "nps_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	"comment" text,
	"trigger" text,
	"app_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- RLS
ALTER TABLE "nps_responses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Only the user themselves can insert/read their NPS response
CREATE POLICY "nps_own_user" ON "nps_responses"
  FOR ALL USING (user_id = auth.uid());
