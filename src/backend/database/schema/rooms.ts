import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  textArray,
} from "drizzle-orm/pg-core";
import { randomUUIDv7 } from "bun";
import { accounts } from "./accounts";
import { Recurces } from "@/backend/entity/room";

const RECURCES_VALUES = Object.values(Recurces) as [string, ...string[]];

export const rooms = pgTable("rooms", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  title: varchar("title", { length: 150 }).notNull(),
  roomName: varchar("room_name", { length: 100 }).notNull(),
  description: text("description").notNull().default(""),
  participants: textArray("participants").notNull().default([]),
  startAt: timestamp("start_at", { mode: "date", withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  resources: varchar("resources", { enum: RECURCES_VALUES })
    .array()
    .notNull()
    .default([]),
  createdBy: varchar("created_by", { length: 36 }).references(
    () => accounts.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoomInsert = typeof rooms.$inferInsert;
export type RoomSelect = typeof rooms.$inferSelect;
