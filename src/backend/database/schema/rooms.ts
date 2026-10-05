import {
  pgTable,
  varchar,
  timestamp,
  integer,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { randomUUIDv7 } from "bun";

export const rooms = pgTable("rooms", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  title: varchar("title", { length: 255 }).notNull(),
  roomName: varchar("room_name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  participants: text("participants").array().notNull().default([]),
  startAt: timestamp("start_at", { mode: "date", withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  resources: jsonb("resources").notNull().default([]),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoomInsert = typeof rooms.$inferInsert;
export type RoomSelect = typeof rooms.$inferSelect;
