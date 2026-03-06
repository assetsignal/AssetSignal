import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Client } from "pg";

const SQLITE_PATH = process.env.SQLITE_PATH || path.resolve(process.cwd(), "assetsignal.db");
const DATABASE_URL = process.env.DATABASE_URL;
const SCHEMA_PATH = path.resolve(process.cwd(), "scripts", "postgres-schema.sql");

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`SQLite file not found: ${SQLITE_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`Schema file not found: ${SCHEMA_PATH}`);
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const TABLES = [
  "properties",
  "monthly_records",
  "weekly_prelease",
  "comp_pricing",
  "weekly_prelease_snapshots",
  "weekly_prelease_audit",
  "concession_history",
];

const UPSERTS = {
  properties: {
    conflict: "id",
    updateCols: ["external_id", "name", "asset_type", "total_beds", "market", "target_occupancy", "competitor_names", "competitor_urls", "created_at"],
  },
  monthly_records: {
    conflict: "id",
    updateCols: ["property_id", "month", "revenue", "expenses", "occupancy", "preleased_beds", "uploaded_at"],
  },
  weekly_prelease: {
    conflict: "id",
    updateCols: ["property_id", "date", "beds_leased"],
  },
  comp_pricing: {
    conflict: "id",
    updateCols: ["property_name", "floor_plan", "rent", "date"],
  },
  weekly_prelease_snapshots: {
    conflict: "property_id, week_ending_date",
    updateCols: ["id", "total_beds", "preleased_beds", "prelease_pct", "source_system", "source_ref", "data_quality", "note", "ingested_at", "updated_at"],
  },
  weekly_prelease_audit: {
    conflict: "id",
    updateCols: ["snapshot_id", "action", "old_value", "new_value", "actor", "reason", "created_at"],
  },
  concession_history: {
    conflict: "property_id, snapshot_date",
    updateCols: ["id", "promo_count", "avg_rent", "source_system", "notes", "created_at", "updated_at"],
  },
};

function placeholderList(start, count) {
  return Array.from({ length: count }, (_, i) => `$${start + i}`).join(", ");
}

async function migrateTable(table) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
  if (rows.length === 0) {
    console.log(`${table}: 0 rows`);
    return;
  }

  const colSql = cols.map((c) => `"${c}"`).join(", ");
  const cfg = UPSERTS[table];
  const updateSql = cfg.updateCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ");
  const insertSql =
    `INSERT INTO ${table} (${colSql}) VALUES (${placeholderList(1, cols.length)}) ` +
    `ON CONFLICT (${cfg.conflict}) DO UPDATE SET ${updateSql}`;

  await pg.query("BEGIN");
  try {
    for (const row of rows) {
      const values = cols.map((c) => row[c]);
      await pg.query(insertSql, values);
    }
    await pg.query("COMMIT");
  } catch (err) {
    await pg.query("ROLLBACK");
    throw err;
  }

  console.log(`${table}: ${rows.length} rows migrated`);
}

async function resetCompPricingSequence() {
  // Ensure generated id sequence stays above imported ids.
  await pg.query(`
    SELECT setval(
      pg_get_serial_sequence('comp_pricing', 'id'),
      COALESCE((SELECT MAX(id) FROM comp_pricing), 1),
      true
    )
  `);
}

async function run() {
  await pg.connect();
  const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf8");
  await pg.query(schemaSql);

  for (const table of TABLES) {
    await migrateTable(table);
  }

  await resetCompPricingSequence();
  await pg.end();
  sqlite.close();
  console.log("SQLite -> Postgres migration complete.");
}

run().catch(async (err) => {
  console.error(err);
  try { await pg.end(); } catch {}
  try { sqlite.close(); } catch {}
  process.exit(1);
});
