import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  date: text("date").notNull(),
  location: text("location").default(""),
  coverUrl: text("cover_url"),
  participantCount: integer("participant_count").notNull().default(0),
  createdBy: text("created_by").references(() => profilesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventParticipantsTable = pgTable("event_participants", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true,
  createdAt: true,
  participantCount: true,
});
export const insertEventParticipantSchema = createInsertSchema(eventParticipantsTable).omit({
  id: true,
  joinedAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type EventParticipant = typeof eventParticipantsTable.$inferSelect;
