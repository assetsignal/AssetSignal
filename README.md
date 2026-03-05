# Asset Signal

Asset Signal is a full-stack student housing operations dashboard for:
- Portfolio and property setup
- Monthly P&L ingestion and tracking
- Prelease pacing and weekly leasing updates
- NOI and MoM/YTD performance diagnostics
- Competitor intelligence analysis
- Embedded assistant for GL lookups and prelease updates

## Tech Stack
- Frontend: React + Vite + Tailwind
- Backend: Express + TypeScript
- Database: SQLite (`assetsignal.db`)

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional for AI features) create `.env`:
   ```bash
   OPENAI_API_KEY=your_key_here
   OPENAI_MODEL=gpt-4.1-mini
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open:
   - App: `http://localhost:3000`
   - Health check: `http://localhost:3000/api/health`

## Product Behavior Without API Key
- Core product still works: portfolio, properties, financial entry, records, charts, and local persistence.
- AI extraction and competitor intelligence scrape are disabled.
- A deterministic fallback analysis is generated in Step 3.
- Chat assistant still supports:
  - `update prelease beds to <number>`
  - `show GL details for <account code or line item>`

## Prototype Scraper (Rise on 9th)
Use a real browser scraper for pricing pages that are JS/iframe protected.

1. Install Playwright browser:
   ```bash
   npm install
   npx playwright install chromium
   ```
2. Run scraper:
   ```bash
   npm run scrape:rise
   ```
3. Output JSON:
   - `outputs/rise-floorplan-prices.json`

Notes:
- Default run is headed (`HEADLESS=false`) and keeps browser open so you can solve anti-bot/captcha manually.
- Optional env vars:
  - `SCRAPE_URL` (override target URL)
  - `OUT_FILE` (override output path)
  - `HEADLESS=true` (close browser automatically)

## Weekly Prelease Demo Ingestion
Seed/update weekly prelease snapshots without Entrata/Yardi API.

1. Start server:
   ```bash
   npm run dev
   ```
2. Edit template:
   - `demo-data/weekly-prelease-template.csv`
3. Ingest:
   ```bash
   npm run ingest:weekly-demo
   ```

Optional env vars:
- `API_BASE` (default `http://localhost:3000`)
- `WEEKLY_FILE` (default `demo-data/weekly-prelease-template.csv`)
- `SOURCE_SYSTEM` (default `csv_upload`)
- `RUN_ID` (default `demo_YYYY-MM-DD`)

Audit endpoint:
- `GET /api/weekly-prelease/audit/:propertyId?limit=100`
