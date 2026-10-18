CREATE TYPE "public"."wanted_status" AS ENUM('open', 'filled', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "wanted_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"game" text NOT NULL,
	"card_name" text NOT NULL,
	"set_name" text,
	"condition" text DEFAULT 'any' NOT NULL,
	"max_price_php" numeric(10, 2),
	"negotiable" boolean DEFAULT true NOT NULL,
	"notes" text,
	"status" "wanted_status" DEFAULT 'open' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wanted_listings" ADD CONSTRAINT "wanted_listings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wanted_user_idx" ON "wanted_listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wanted_status_idx" ON "wanted_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wanted_game_idx" ON "wanted_listings" USING btree ("game");--> statement-breakpoint
CREATE INDEX "wanted_expires_idx" ON "wanted_listings" USING btree ("expires_at");