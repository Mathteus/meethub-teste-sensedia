import { and, eq, or, sql, lte, gte, ne, ilike } from "drizzle-orm";
import { getDb, schema } from "../database";
import type { RoomInsert, RoomSelect } from "../database/schema/rooms";

export interface RoomFilters {
  date?: string | null;
  q?: string | null;
  resources?: string[];
  minParticipants?: number | null;
}

export interface IRoomRepository {
  create(data: RoomInsert): Promise<RoomSelect>;
  findById(id: string): Promise<RoomSelect | null>;
  findAll(): Promise<RoomSelect[]>;
  findByCreatedBy(createdBy: string): Promise<RoomSelect[]>;
  findFiltered(filters: RoomFilters): Promise<RoomSelect[]>;
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

  async findFiltered(filters: RoomFilters): Promise<RoomSelect[]> {
    const db = await getDb();
    const table = schema.rooms;
    const conds = [];

    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00.000Z`);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        conds.push(gte(table.startAt, start));
        conds.push(sql`${table.startAt} < ${end}`);
      }
    }

    if (filters.q?.trim()) {
      const like = `%${filters.q.trim()}%`;
      conds.push(
        or(
          ilike(table.title, like),
          ilike(table.description, like),
          ilike(table.roomName, like),
          sql`array_to_string(${table.participants}, ',') ILIKE ${like}`,
        ),
      );
    }

    if (filters.resources && filters.resources.length > 0) {
      conds.push(
        or(
          ...filters.resources.map(
            (r) => sql`${table.resources} @> ${JSON.stringify([r])}::jsonb`,
          ),
        ),
      );
    }

    if (filters.minParticipants != null && filters.minParticipants >= 0) {
      conds.push(sql`cardinality(${table.participants}) >= ${filters.minParticipants}`);
    }

    const rows = await db
      .select()
      .from(table)
      .where(conds.length > 0 ? and(...conds) : undefined)
      .orderBy(table.startAt);
    return rows;
  }

  async findByCreatedBy(createdBy: string): Promise<RoomSelect[]> {
    const db = await getDb();
    return db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.createdBy, createdBy))
      .orderBy(schema.rooms.startAt);
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
