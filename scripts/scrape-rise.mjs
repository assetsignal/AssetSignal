import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chromium } from "playwright";

const TARGET_URL =
  process.env.SCRAPE_URL || "https://www.riseon9th.com/availability";
const OUT_FILE =
  process.env.OUT_FILE ||
  path.resolve(process.cwd(), "outputs", "rise-floorplan-prices.json");
const USER_DATA_DIR = path.resolve(process.cwd(), ".playwright-profile", "rise");
const HEADLESS = process.env.HEADLESS === "true";

const planHintRegex =
  /(studio|loft|townhome|\d\s*bed|\d\s*bedroom|\d\s*x\s*\d|floor\s*plan|plan\s*[a-z0-9-]*)/i;

function toNumber(value) {
  const n = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizePlanName(raw) {
  const name = raw
    .replace(/\$[\d,]+(?:\s*(?:-|to)\s*\$[\d,]+)?/g, " ")
    .replace(/\b(starting\s+at|from|rates?\s+from|per\s*month|\/\s*mo|monthly)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name.slice(0, 64);
}

function addRange(map, plan, min, max, source) {
  if (!plan || !Number.isFinite(min)) return;
  const key = plan.toLowerCase();
  const nextMax = Number.isFinite(max) ? max : min;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, {
      name: plan,
      minRent: Math.min(min, nextMax),
      maxRent: Math.max(min, nextMax),
      source,
    });
    return;
  }
  prev.minRent = Math.min(prev.minRent, min, nextMax);
  prev.maxRent = Math.max(prev.maxRent, min, nextMax);
}

function extractRangesFromText(text, source) {
  const map = new Map();
  const cleaned = (text || "").replace(/\r/g, "");
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12000);

  const parseLine = (line) => {
    if (!line.includes("$")) return;

    const rangeMatch = line.match(
      /([A-Za-z0-9][A-Za-z0-9\s\-\/]{1,60}?)\s*(?:from|starting at|rates? from)?\s*\$([0-9]{3,5}(?:,[0-9]{3})?)\s*(?:-|to)\s*\$([0-9]{3,5}(?:,[0-9]{3})?)/i
    );
    if (rangeMatch && planHintRegex.test(rangeMatch[1])) {
      const plan = normalizePlanName(rangeMatch[1]);
      addRange(map, plan, toNumber(rangeMatch[2]), toNumber(rangeMatch[3]), source);
      return;
    }

    const directMatch = line.match(
      /([A-Za-z0-9][A-Za-z0-9\s\-\/]{1,70}?)\s+\$([0-9]{3,5}(?:,[0-9]{3})?)\s*(?:\/\s*mo|per\s*month|monthly)?/i
    );
    if (directMatch && planHintRegex.test(directMatch[1])) {
      const plan = normalizePlanName(directMatch[1]);
      addRange(map, plan, toNumber(directMatch[2]), null, source);
      return;
    }

    const reverseMatch = line.match(
      /\$([0-9]{3,5}(?:,[0-9]{3})?)\s*(?:\/\s*mo|per\s*month|monthly)?\s*(?:for|-|:)?\s*([A-Za-z0-9][A-Za-z0-9\s\-\/]{1,50})/i
    );
    if (reverseMatch && planHintRegex.test(reverseMatch[2])) {
      const plan = normalizePlanName(reverseMatch[2]);
      addRange(map, plan, toNumber(reverseMatch[1]), null, source);
    }
  };

  for (const line of lines) parseLine(line);
  return map;
}

async function maybeManualWait(page) {
  const text = (await page.innerText("body").catch(() => "")) || "";
  if (!/just a moment|enable javascript and cookies/i.test(text)) return;

  console.log("Cloudflare challenge detected. Solve it in the opened browser, then press Enter here.");
  const rl = readline.createInterface({ input, output });
  await rl.question("");
  rl.close();
}

async function collectFrameText(frame) {
  const bodyText = await frame.evaluate(() => document.body?.innerText || "").catch(() => "");
  const targetedText = await frame
    .evaluate(() => {
      const selectors = [
        "[class*='floor']",
        "[class*='plan']",
        "[class*='unit']",
        "[class*='price']",
        "[id*='floor']",
        "[id*='plan']",
        "[id*='unit']",
        "[id*='price']",
      ];
      const out = [];
      for (const s of selectors) {
        document.querySelectorAll(s).forEach((el) => {
          const txt = (el.textContent || "").trim();
          if (txt.length > 0 && txt.length < 500) out.push(txt);
        });
      }
      return out.join("\n");
    })
    .catch(() => "");
  return `${bodyText}\n${targetedText}`;
}

async function run() {
  console.log(`Opening: ${TARGET_URL}`);
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: HEADLESS,
    viewport: { width: 1440, height: 1024 },
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(7000);
    await maybeManualWait(page);
    await page.waitForTimeout(3000);

    const aggregate = new Map();
    const frames = page.frames();
    for (const frame of frames) {
      const text = await collectFrameText(frame);
      const source = frame.url() || TARGET_URL;
      const local = extractRangesFromText(text, source);
      for (const row of local.values()) {
        addRange(aggregate, row.name, row.minRent, row.maxRent, row.source);
      }
    }

    const floorplanRanges = Array.from(aggregate.values())
      .filter((r) => Number.isFinite(r.minRent) && Number.isFinite(r.maxRent))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 40);

    const payload = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: TARGET_URL,
      frameCount: frames.length,
      floorplanRanges,
    };

    await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
    await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2), "utf8");

    console.log(`Saved ${floorplanRanges.length} floorplan entries to: ${OUT_FILE}`);
    if (floorplanRanges.length === 0) {
      console.log("No floorplan prices detected. Keep browser open and verify prices are visible on screen.");
    } else {
      floorplanRanges.slice(0, 15).forEach((r) => {
        const value =
          r.minRent === r.maxRent
            ? `$${r.minRent.toLocaleString()}`
            : `$${r.minRent.toLocaleString()}-$${r.maxRent.toLocaleString()}`;
        console.log(`- ${r.name}: ${value}`);
      });
    }
  } finally {
    if (HEADLESS) {
      await context.close();
    } else {
      console.log("Browser left open for inspection. Close it manually when done.");
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
