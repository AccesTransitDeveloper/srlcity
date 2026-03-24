import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";

export const ridesTable = pgTable("rides", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: text("driver_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("RUB"),
  departureDate: timestamp("departure_date", { withTimezone: true }).notNull(),
  seatsAvailable: integer("seats_available").notNull().default(3),
  carMake: text("car_make").notNull(),
  carModel: text("car_model").notNull().default(""),
  carNumber: text("car_number").notNull(),
  carPhotoUrl: text("car_photo_url"),
  contactPhone: text("contact_phone").notNull(),
  notes: text("notes").default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideSchema = createInsertSchema(ridesTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof ridesTable.$inferSelect;
