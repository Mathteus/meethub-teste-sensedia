import { Client } from "pg";
import { GetEnv, validateEnvs } from "../config/env.validator";

validateEnvs();

const client = new Client({
  connectionString: GetEnv<string>("DATABASE_URL"),
});

try {
  console.log("✓ PostgreSQL connection OK");
  const result = await client.query("SELECT now()");
  console.log(result.rows);
} catch (error) {
  console.error("✗ PostgreSQL connection failed");
  console.error(error);
} finally {
  await client.end();
}
