import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";

export const postsTable = pgTable("posts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: text("author_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  groupId: text("group_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: text("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const likesTable = pgTable("likes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: text("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
});
export const insertLikeSchema = createInsertSchema(likesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likesTable.$inferSelect;
