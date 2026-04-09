import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { messageSenderEnum, messageTypeEnum } from "./enums";
import { rooms } from "./room";
import { user } from "./user";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    sender: messageSenderEnum("sender").notNull().default("human"),
    senderUserId: text("sender_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    messageType: messageTypeEnum("message_type").notNull().default("text"),
    imageUrl: text("image_url"),
    audioUrl: text("audio_url"),
    audioTranscript: text("audio_transcript"),
    attachments: jsonb("attachments"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("messages_room_id_created_at_id_idx").on(table.roomId, table.createdAt, table.id),
    index("messages_sender_user_id_idx").on(table.senderUserId),
    check(
      "messages_sender_user_check",
      sql`(${table.sender} = 'human' and ${table.senderUserId} is not null) or (${table.sender} = 'ai' and ${table.senderUserId} is null)`,
    ),
  ],
);

export const messageRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  senderUser: one(user, {
    fields: [messages.senderUserId],
    references: [user.id],
  }),
}));
