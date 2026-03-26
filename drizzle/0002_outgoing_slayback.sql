ALTER TABLE "books" DROP CONSTRAINT "books_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "books" DROP CONSTRAINT "books_lane_id_user_lanes_id_fk";
--> statement-breakpoint
ALTER TABLE "reading_goals" DROP CONSTRAINT "reading_goals_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "swimlanes" DROP CONSTRAINT "swimlanes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_lanes" DROP CONSTRAINT "user_lanes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_lane_id_user_lanes_id_fk" FOREIGN KEY ("lane_id") REFERENCES "public"."user_lanes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_goals" ADD CONSTRAINT "reading_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swimlanes" ADD CONSTRAINT "swimlanes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lanes" ADD CONSTRAINT "user_lanes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_user_id_idx" ON "books" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "books_lane_id_idx" ON "books" USING btree ("lane_id");--> statement-breakpoint
CREATE INDEX "books_status_idx" ON "books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reading_goals_user_id_idx" ON "reading_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_lanes_user_id_idx" ON "user_lanes" USING btree ("user_id");