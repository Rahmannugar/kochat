ALTER TABLE "rooms" DROP CONSTRAINT "rooms_type_code_check";--> statement-breakpoint
DROP INDEX "messages_room_id_created_at_idx";--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "dm_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_dm_key_unique" ON "rooms" USING btree ("dm_key");--> statement-breakpoint
CREATE INDEX "messages_room_id_created_at_id_idx" ON "messages" USING btree ("room_id","created_at","id");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_type_code_dm_key_check" CHECK (("rooms"."type" = 'group' and "rooms"."code" is not null and "rooms"."dm_key" is null) or ("rooms"."type" = 'dm' and "rooms"."code" is null and "rooms"."dm_key" is not null));