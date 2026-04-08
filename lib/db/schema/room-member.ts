import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { roomMemberRoleEnum } from "./enums";
import { rooms } from "./room";
import { user } from "./user";

export const roomMembers = pgTable(
  "room_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roomMemberRoleEnum("role").notNull().default("member"),
    archivedAt: timestamp("archived_at", { mode: "date" }),
    lastReadMessageId: uuid("last_read_message_id"),
    lastReadAt: timestamp("last_read_at", { mode: "date" }),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("room_members_room_user_unique").on(table.roomId, table.userId),
    index("room_members_room_id_idx").on(table.roomId),
    index("room_members_user_id_idx").on(table.userId),
    index("room_members_user_joined_id_idx").on(table.userId, table.joinedAt, table.id),
  ],
);

export const roomMemberRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(user, {
    fields: [roomMembers.userId],
    references: [user.id],
  }),
}));
