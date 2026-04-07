import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { roomTypeEnum } from "./enums";
import { roomMembers } from "./room-member";
import { messages } from "./message";
import { user } from "./user";

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    type: roomTypeEnum("type").notNull(),
    code: text("code"),
    dmKey: text("dm_key"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("rooms_code_unique").on(table.code),
    uniqueIndex("rooms_dm_key_unique").on(table.dmKey),
    index("rooms_type_idx").on(table.type),
    check(
      "rooms_type_code_dm_key_check",
      sql`(${table.type} = 'group' and ${table.code} is not null and ${table.dmKey} is null) or (${table.type} = 'dm' and ${table.code} is null and ${table.dmKey} is not null)`,
    ),
  ],
);

export const roomRelations = relations(rooms, ({ many, one }) => ({
  creator: one(user, {
    fields: [rooms.createdBy],
    references: [user.id],
  }),
  members: many(roomMembers),
  messages: many(messages),
}));
