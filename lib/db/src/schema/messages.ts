import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";

export const chatThreadsTable = pgTable("chat_threads", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: text("user1_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  user2Id: text("user2_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  lastMessage: text("last_message").default(""),
  lastMessageTime: timestamp("last_message_time", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: text("thread_id")
    .notNull()
    .references(() => chatThreadsTable.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatThreadSchema = createInsertSchema(chatThreadsTable).omit({
  id: true,
  createdAt: true,
  lastMessage: true,
  lastMessageTime: true,
});
export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  id: true,
  createdAt: true,
  read: true,
});
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreadsTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
