import { relations, sql } from "drizzle-orm"
import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { account } from "./account"
import { messages } from "./message"
import { roomMembers } from "./room-member"
import { rooms } from "./room"
import { session } from "./session"

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    username: text("username"),
    bio: text("bio"),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_username_lower_unique").on(sql`lower(${table.username})`),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  createdRooms: many(rooms),
  memberships: many(roomMembers),
  messages: many(messages),
  sessions: many(session),
}))
