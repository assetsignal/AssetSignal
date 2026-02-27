import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("assetsignal.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    asset_type TEXT DEFAULT 'Student Housing',
    total_beds INTEGER DEFAULT 0,
    market TEXT,
    target_occupancy REAL DEFAULT 0,
    competitor_names TEXT, -- JSON array
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monthly_records (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM
    revenue TEXT, -- JSON FinancialCategory
    expenses TEXT, -- JSON FinancialCategory
    occupancy REAL DEFAULT 0,
    preleased_beds INTEGER DEFAULT 0,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS comp_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_name TEXT,
    floor_plan TEXT,
    rent REAL,
    date TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Properties
  app.get("/api/properties", (req, res) => {
    const properties = db.prepare("SELECT * FROM properties ORDER BY name ASC").all();
    res.json(properties.map((p: any) => ({
      ...p,
      competitorNames: JSON.parse(p.competitor_names || '[]'),
      assetType: p.asset_type,
      totalBeds: p.total_beds,
      targetOccupancy: p.target_occupancy,
      createdAt: p.created_at
    })));
  });

  app.post("/api/properties", (req, res) => {
    const { id, name, assetType, totalBeds, market, targetOccupancy, competitorNames } = req.body;
    db.prepare(`
      INSERT INTO properties (id, name, asset_type, total_beds, market, target_occupancy, competitor_names)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, assetType, totalBeds, market, targetOccupancy, JSON.stringify(competitorNames));
    res.json({ success: true });
  });

  app.put("/api/properties/:id", (req, res) => {
    const { name, totalBeds, market, targetOccupancy, competitorNames } = req.body;
    db.prepare(`
      UPDATE properties 
      SET name = ?, total_beds = ?, market = ?, target_occupancy = ?, competitor_names = ?
      WHERE id = ?
    `).run(name, totalBeds, market, targetOccupancy, JSON.stringify(competitorNames), req.params.id);
    res.json({ success: true });
  });

  // Monthly Records
  app.get("/api/properties/:id/records", (req, res) => {
    const records = db.prepare("SELECT * FROM monthly_records WHERE property_id = ? ORDER BY month DESC").all(req.params.id);
    res.json(records.map((r: any) => ({
      ...r,
      propertyId: r.property_id,
      revenue: JSON.parse(r.revenue),
      expenses: JSON.parse(r.expenses),
      uploadedAt: r.uploaded_at
    })));
  });

  app.post("/api/properties/:id/records", (req, res) => {
    const { id, month, revenue, expenses, occupancy, preleasedBeds } = req.body;
    
    // Check if record for this month already exists
    const existing = db.prepare("SELECT id FROM monthly_records WHERE property_id = ? AND month = ?").get(req.params.id, month) as any;
    
    if (existing) {
      db.prepare(`
        UPDATE monthly_records 
        SET revenue = ?, expenses = ?, occupancy = ?, preleased_beds = ?, uploaded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(revenue), JSON.stringify(expenses), occupancy, preleasedBeds, existing.id);
    } else {
      db.prepare(`
        INSERT INTO monthly_records (id, property_id, month, revenue, expenses, occupancy, preleased_beds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.params.id, month, JSON.stringify(revenue), JSON.stringify(expenses), occupancy, preleasedBeds);
    }
    res.json({ success: true });
  });

  // Portfolio Aggregation
  app.get("/api/portfolio", (req, res) => {
    // Get latest record for each property
    const latestRecords = db.prepare(`
      SELECT r.*, p.name as property_name, p.total_beds
      FROM monthly_records r
      JOIN properties p ON r.property_id = p.id
      WHERE r.month = (SELECT MAX(month) FROM monthly_records WHERE property_id = r.property_id)
    `).all();

    const portfolio = latestRecords.map((r: any) => {
      const revenue = JSON.parse(r.revenue);
      const expenses = JSON.parse(r.expenses);
      
      const getVal = (cat: any) => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          return cat.subcategories.reduce((sum: number, sub: any) => sum + sub.actual, 0);
        }
        return cat.actual || 0;
      };

      const totalRev = Number(Object.values(revenue).reduce((sum: number, cat: any) => sum + getVal(cat), 0));
      const totalExp = Number(Object.values(expenses).reduce((sum: number, cat: any) => sum + getVal(cat), 0));
      const noi = totalRev - totalExp;

      // Find prior month for MoM change
      const [year, month] = r.month.split('-').map(Number);
      const priorMonthDate = new Date(year, month - 2, 1);
      const priorMonthStr = `${priorMonthDate.getFullYear()}-${String(priorMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      const priorRecord = db.prepare("SELECT * FROM monthly_records WHERE property_id = ? AND month = ?")
        .get(r.property_id, priorMonthStr) as any;

      let momNoiChange = 0;
      if (priorRecord) {
        const pRev = JSON.parse(priorRecord.revenue);
        const pExp = JSON.parse(priorRecord.expenses);
        const pTotalRev = Number(Object.values(pRev).reduce((sum: number, cat: any) => sum + getVal(cat), 0));
        const pTotalExp = Number(Object.values(pExp).reduce((sum: number, cat: any) => sum + getVal(cat), 0));
        const pNoi = pTotalRev - pTotalExp;
        momNoiChange = pNoi !== 0 ? ((noi - pNoi) / Math.abs(pNoi)) * 100 : 0;
      }

      return {
        propertyId: r.property_id,
        propertyName: r.property_name,
        month: r.month,
        revenue: totalRev,
        noi: noi,
        occupancy: r.occupancy,
        momNoiChange,
        riskFlag: Math.abs(momNoiChange) > 5 || r.occupancy < 90
      };
    });

    res.json(portfolio);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
