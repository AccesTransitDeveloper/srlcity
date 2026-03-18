import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";

export const groupsTable = pgTable("groups", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  coverUrl: text("cover_url"),
  memberCount: integer("member_count").notNull().default(0),
  createdBy: text("created_by").references(() => profilesTable.id, { onDelete: "set null" }),
  chatThreadId: text("chat_thread_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembersTable = pgTable("group_members", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupJoinRequestsTable = pgTable("group_join_requests", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({
  id: true,
  createdAt: true,
  memberCount: true,
  chatThreadId: true,
});
export const insertGroupMemberSchema = createInsertSchema(groupMembersTable).omit({
  id: true,
  joinedAt: true,
});
export const insertGroupJoinRequestSchema = createInsertSchema(groupJoinRequestsTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembersTable.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequestsTable.$inferSelect;
