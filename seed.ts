import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function main() {
  const sqlFile = join(process.cwd(), "seed.sql");
  const sql = readFileSync(sqlFile, "utf-8");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  try {
    console.log("Executando seed.sql...");
    await client.query(sql);
    console.log("✓ Seed executado com sucesso");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("✗ Erro ao executar o seed:", err.message);
  process.exit(1);
});
