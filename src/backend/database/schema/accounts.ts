import { pgTable, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { randomUUIDv7 } from "bun";

export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);

export const accounts = pgTable("accounts", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AccountInsert = typeof accounts.$inferInsert;
export type AccountSelect = typeof accounts.$inferSelect;
