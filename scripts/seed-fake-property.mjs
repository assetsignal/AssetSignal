import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

const db = new Database("assetsignal.db");
db.pragma("foreign_keys = ON");

const PROPERTY_ID = "demo-sunset-commons-001";
const PROPERTY_NAME = "Sunset Commons (Demo)";

function category(name, accountCode, currentMonthActual, currentMonthBudget, actual, budget, subcategories = []) {
  return {
    name,
    accountCode,
    currentMonthActual,
    currentMonthBudget,
    actual,
    budget,
    subcategories,
  };
}

function buildFinancials(monthKey) {
  const byMonth = {
    "2026-01": {
      revActual: 502000,
      revBudget: 488000,
      expActual: 268000,
      expBudget: 275000,
    },
    "2026-02": {
      revActual: 516500,
      revBudget: 495000,
      expActual: 269500,
      expBudget: 277000,
    },
    "2026-03": {
      revActual: 529200,
      revBudget: 503000,
      expActual: 271000,
      expBudget: 279000,
    },
  };

  const m = byMonth[monthKey];
  if (!m) throw new Error(`Missing financial template for ${monthKey}`);

  const revenue = {
    rentalIncome: category("Rental Income", "4000", m.revActual * 0.94, m.revBudget * 0.94, m.revActual * 0.94, m.revBudget * 0.94, [
      category("Market Rent", "4000", m.revActual * 0.90, m.revBudget * 0.90, m.revActual * 0.90, m.revBudget * 0.90),
      category("Premium Unit Income", "4005", m.revActual * 0.04, m.revBudget * 0.04, m.revActual * 0.04, m.revBudget * 0.04),
    ]),
    otherIncome: category("Other Income", "4100", m.revActual * 0.06, m.revBudget * 0.06, m.revActual * 0.06, m.revBudget * 0.06, [
      category("Parking Income", "4130", m.revActual * 0.022, m.revBudget * 0.02, m.revActual * 0.022, m.revBudget * 0.02),
      category("Pet Rent", "4120", m.revActual * 0.018, m.revBudget * 0.02, m.revActual * 0.018, m.revBudget * 0.02),
      category("Utility Reimbursement", "4140", m.revActual * 0.02, m.revBudget * 0.02, m.revActual * 0.02, m.revBudget * 0.02),
    ]),
  };

  const expenses = {
    payroll: category("Payroll", "5000", 74500, 76000, 74500, 76000, [
      category("On-site Salaries", "5010", 61000, 62000, 61000, 62000),
      category("Benefits & Taxes", "5020", 13500, 14000, 13500, 14000),
    ]),
    repairsMaintenance: category("Repairs & Maintenance", "5100", 39500, 41000, 39500, 41000, [
      category("Contract Services", "5110", 21800, 23000, 21800, 23000),
      category("Supplies & Parts", "5120", 17700, 18000, 17700, 18000),
    ]),
    utilities: category("Utilities", "5200", 36800, 38000, 36800, 38000, [
      category("Electricity", "5210", 16800, 17500, 16800, 17500),
      category("Water & Sewer", "5220", 13200, 13500, 13200, 13500),
      category("Gas/Trash", "5230", 6800, 7000, 6800, 7000),
    ]),
    insurance: category("Insurance", "5300", 12700, 13000, 12700, 13000),
    propertyManagement: category("Property Management", "5400", 19700, 20000, 19700, 20000),
    taxes: category("Taxes", "5500", 33600, 34500, 33600, 34500, [
      category("Real Estate Taxes", "5510", 29200, 30000, 29200, 30000),
      category("Other Taxes/Fees", "5520", 4400, 4500, 4400, 4500),
    ]),
    marketing: category("Marketing", "5600", 16800, 17600, 16800, 17600, [
      category("Advertising", "5610", 9200, 9800, 9200, 9800),
      category("Internet Marketing", "5620", 7600, 7800, 7600, 7800),
    ]),
    admin: category("Admin", "5700", 21400, 22300, 21400, 22300, [
      category("Office Supplies", "5710", 7300, 7600, 7300, 7600),
      category("Legal & Professional", "5720", 14100, 14700, 14100, 14700),
    ]),
    otherOpEx: category("Other OpEx", "5800", 10000, 10600, 10000, 10600),
  };

  return { revenue, expenses, ...m };
}

const monthlyRows = [
  { month: "2026-01", preleasedBeds: 342, totalBeds: 420 },
  { month: "2026-02", preleasedBeds: 356, totalBeds: 420 },
  { month: "2026-03", preleasedBeds: 372, totalBeds: 420 },
];

const weeklyRows = [
  ["2026-01-05", 332],
  ["2026-01-12", 337],
  ["2026-01-19", 341],
  ["2026-01-26", 346],
  ["2026-02-02", 352],
  ["2026-02-09", 357],
  ["2026-02-16", 361],
  ["2026-02-23", 366],
  ["2026-03-02", 372],
];

const concessionRows = [
  ["2026-01-12", 5, 1085],
  ["2026-01-26", 5, 1091],
  ["2026-02-09", 4, 1100],
  ["2026-02-23", 3, 1112],
  ["2026-03-02", 2, 1120],
];

const compPricingRows = [
  ["Sunset Heights", "1x1", 1125, "2026-03-02"],
  ["Sunset Heights", "2x2", 895, "2026-03-02"],
  ["Riverwalk Student Living", "Studio", 1280, "2026-03-02"],
  ["Riverwalk Student Living", "4x4", 835, "2026-03-02"],
  ["The Forum Residences", "3x3", 910, "2026-03-02"],
];

db.exec(`
  CREATE TABLE IF NOT EXISTS concession_history (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    promo_count INTEGER NOT NULL DEFAULT 0,
    avg_rent REAL NOT NULL DEFAULT 0,
    source_system TEXT NOT NULL DEFAULT 'market_scan',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE(property_id, snapshot_date)
  );
  CREATE INDEX IF NOT EXISTS idx_concession_history_property_date
    ON concession_history(property_id, snapshot_date ASC);
`);

const upsertProperty = db.prepare(`
  INSERT INTO properties (id, external_id, name, asset_type, total_beds, market, target_occupancy, competitor_names, competitor_urls)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    external_id = excluded.external_id,
    name = excluded.name,
    asset_type = excluded.asset_type,
    total_beds = excluded.total_beds,
    market = excluded.market,
    target_occupancy = excluded.target_occupancy,
    competitor_names = excluded.competitor_names,
    competitor_urls = excluded.competitor_urls
`);

const insertMonthly = db.prepare(`
  INSERT INTO monthly_records (id, property_id, month, revenue, expenses, occupancy, preleased_beds)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertWeeklySnapshot = db.prepare(`
  INSERT INTO weekly_prelease_snapshots (
    id, property_id, week_ending_date, total_beds, preleased_beds, prelease_pct, source_system, source_ref, data_quality, note
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLegacyWeekly = db.prepare(`
  INSERT INTO weekly_prelease (id, property_id, date, beds_leased)
  VALUES (?, ?, ?, ?)
`);

const upsertConcession = db.prepare(`
  INSERT INTO concession_history (id, property_id, snapshot_date, promo_count, avg_rent, source_system, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(property_id, snapshot_date) DO UPDATE SET
    promo_count = excluded.promo_count,
    avg_rent = excluded.avg_rent,
    source_system = excluded.source_system,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP
`);

const insertCompPricing = db.prepare(`
  INSERT INTO comp_pricing (property_name, floor_plan, rent, date)
  VALUES (?, ?, ?, ?)
`);

const tx = db.transaction(() => {
  upsertProperty.run(
    PROPERTY_ID,
    "SUNSET-DEMO-001",
    PROPERTY_NAME,
    "Student Housing",
    420,
    "Austin, Texas",
    95,
    JSON.stringify(["Sunset Heights", "Riverwalk Student Living", "The Forum Residences"]),
    JSON.stringify({
      "Sunset Heights": "https://www.sunsetheightsliving.com/",
      "Riverwalk Student Living": "https://www.riverwalkstudentliving.com/",
      "The Forum Residences": "https://www.forumresidences.com/",
    }),
  );

  db.prepare("DELETE FROM monthly_records WHERE property_id = ?").run(PROPERTY_ID);
  db.prepare("DELETE FROM weekly_prelease_snapshots WHERE property_id = ?").run(PROPERTY_ID);
  db.prepare("DELETE FROM weekly_prelease WHERE property_id = ?").run(PROPERTY_ID);
  db.prepare("DELETE FROM weekly_prelease_audit WHERE snapshot_id NOT IN (SELECT id FROM weekly_prelease_snapshots)").run();
  db.prepare("DELETE FROM concession_history WHERE property_id = ?").run(PROPERTY_ID);

  for (const row of monthlyRows) {
    const f = buildFinancials(row.month);
    const occupancy = (row.preleasedBeds / row.totalBeds) * 100;
    insertMonthly.run(
      randomUUID(),
      PROPERTY_ID,
      row.month,
      JSON.stringify(f.revenue),
      JSON.stringify(f.expenses),
      occupancy,
      row.preleasedBeds,
    );
  }

  for (const [week, beds] of weeklyRows) {
    const id = randomUUID();
    const preleasePct = (Number(beds) / 420) * 100;
    insertLegacyWeekly.run(id, PROPERTY_ID, String(week), Number(beds));
    insertWeeklySnapshot.run(
      id,
      PROPERTY_ID,
      String(week),
      420,
      Number(beds),
      preleasePct,
      "seed_demo",
      "seed-fake-property.mjs",
      "valid",
      "Seeded demo weekly prelease trend",
    );
  }

  for (const [date, count, avgRent] of concessionRows) {
    upsertConcession.run(
      randomUUID(),
      PROPERTY_ID,
      String(date),
      Number(count),
      Number(avgRent),
      "seed_demo",
      "Seeded demo concession intensity",
    );
  }

  for (const [propertyName, floorPlan, rent, date] of compPricingRows) {
    insertCompPricing.run(String(propertyName), String(floorPlan), Number(rent), String(date));
  }
});

tx();

const latest = db.prepare(`
  SELECT p.name, m.month, m.occupancy, m.preleased_beds
  FROM properties p
  JOIN monthly_records m ON m.property_id = p.id
  WHERE p.id = ?
  ORDER BY m.month DESC
  LIMIT 1
`).get(PROPERTY_ID);

console.log("Seeded property:", latest);
