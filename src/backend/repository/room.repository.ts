import { and, eq, or, sql, lte, gte, ne, between } from "drizzle-orm";
import { getDb, schema } from "../database";
import type { RoomInsert, RoomSelect } from "../database/schema/rooms";

export interface IRoomRepository {
  create(data: RoomInsert): Promise<RoomSelect>;
  findById(id: string): Promise<RoomSelect | null>;
  findAll(): Promise<RoomSelect[]>;
  findByRoomNameAndOverlap(
    roomName: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<RoomSelect[]>;
  update(id: string, data: Partial<RoomInsert>): Promise<RoomSelect | null>;
  remove(id: string): Promise<boolean>;
}

export class RoomRepository implements IRoomRepository {
  async create(data: RoomInsert): Promise<RoomSelect> {
    const db = await getDb();
    const [created] = await db.insert(schema.rooms).values(data).returning();
    return created;
  }

  async findById(id: string): Promise<RoomSelect | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findAll(): Promise<RoomSelect[]> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.rooms)
      .orderBy(schema.rooms.startAt);
    return rows;
  }

  async findByRoomNameAndOverlap(
    roomName: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<RoomSelect[]> {
    const db = await getDb();
    const table = schema.rooms;
    const endExpr = sql<Date>`${table.startAt} + (${table.durationMinutes} || ' minutes')::interval`;

    const condition = and(
      eq(table.roomName, roomName),
      lte(table.startAt, endAt),
      gte(endExpr, startAt),
    );

    const finalCond = excludeId
      ? and(condition, ne(table.id, excludeId))
      : condition;

    const rows = await db.select().from(table).where(finalCond);
    return rows;
  }

  async update(
    id: string,
    data: Partial<RoomInsert>,
  ): Promise<RoomSelect | null> {
    const db = await getDb();
    const payload = { ...data, updatedAt: new Date() } as Partial<RoomInsert>;
    const rows = await db
      .update(schema.rooms)
      .set(payload)
      .where(eq(schema.rooms.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(schema.rooms)
      .where(eq(schema.rooms.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const roomRepository = new RoomRepository();
