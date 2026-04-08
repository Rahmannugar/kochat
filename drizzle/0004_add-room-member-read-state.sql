ALTER TABLE "room_members" ADD COLUMN "last_read_message_id" uuid;--> statement-breakpoint
ALTER TABLE "room_members" ADD COLUMN "last_read_at" timestamp;