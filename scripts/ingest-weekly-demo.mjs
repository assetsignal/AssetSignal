import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const FILE_PATH =
  process.env.WEEKLY_FILE ||
  path.resolve(process.cwd(), "demo-data", "weekly-prelease-template.csv");
const SOURCE_SYSTEM = process.env.SOURCE_SYSTEM || "csv_upload";
const RUN_ID = process.env.RUN_ID || `demo_${new Date().toISOString().slice(0, 10)}`;

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV has no data rows.");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const indexOf = (name) => headers.findIndex((h) => h === name);

  const idxProperty = indexOf("propertyExternalId");
  const idxWeek = indexOf("weekEndingDate");
  const idxTotal = indexOf("totalBeds");
  const idxPreleased = indexOf("preleasedBeds");

  if ([idxProperty, idxWeek, idxTotal, idxPreleased].some((v) => v < 0)) {
    throw new Error(
      "CSV must include headers: propertyExternalId, weekEndingDate, totalBeds, preleasedBeds"
    );
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    rows.push({
      propertyExternalId: cols[idxProperty] || "",
      weekEndingDate: cols[idxWeek] || "",
      totalBeds: Number(cols[idxTotal]),
      preleasedBeds: Number(cols[idxPreleased]),
    });
  }

  return rows;
}

async function run() {
  const csv = await fs.readFile(FILE_PATH, "utf8");
  const rows = parseCsv(csv);

  const response = await fetch(`${API_BASE}/api/ingest/weekly-prelease`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceSystem: SOURCE_SYSTEM,
      runId: RUN_ID,
      rows,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Ingestion failed (${response.status})`);
  }

  console.log("Weekly ingest complete");
  console.log(
    JSON.stringify(
      {
        inserted: data.inserted,
        updated: data.updated,
        rejected: data.rejected,
        warnings: data.warnings,
      },
      null,
      2
    )
  );

  if (data.rejectedRows?.length) {
    console.log("\nRejected rows:");
    console.log(JSON.stringify(data.rejectedRows, null, 2));
  }
  if (data.warningRows?.length) {
    console.log("\nWarning rows:");
    console.log(JSON.stringify(data.warningRows, null, 2));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
