import { db } from "@/backend/database";
import { sql } from "drizzle-orm";
import { validateEnvs } from "@/backend/config/env.validator";

export async function GET() {
  try {
    validateEnvs();
    const result = await db.execute(sql`SELECT now();`);
    return Response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      result: result[0],
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
