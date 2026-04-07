import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { user } from "./auth"

export const roomKindEnum = pgEnum("room_kind", ["channel", "group", "dm"])
export const roomMemberRoleEnum = pgEnum("room_member_role", ["owner", "member"])

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  kind: roomKindEnum("kind").notNull().default("channel"),
  isDefault: boolean("is_default").notNull().default(false),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

export const roomMembers = pgTable(
  "room_members",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roomMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("room_members_room_user_unique").on(table.roomId, table.userId),
    index("room_members_room_id_idx").on(table.roomId),
    index("room_members_user_id_idx").on(table.userId),
  ],
)

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
}))

export const roomRelations = relations(rooms, ({ many, one }) => ({
  members: many(roomMembers),
  creator: one(user, {
    fields: [rooms.createdBy],
    references: [user.id],
  }),
}))

export const roomMemberRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(user, {
    fields: [roomMembers.userId],
    references: [user.id],
  }),
}))
