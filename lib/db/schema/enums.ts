import { pgEnum } from "drizzle-orm/pg-core";

export const roomTypeEnum = pgEnum("room_type", ["dm", "group"]);
export const roomMemberRoleEnum = pgEnum("room_member_role", [
  "owner",
  "member",
]);
export const messageSenderEnum = pgEnum("message_sender", ["human", "ai"]);
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "voice",
]);
