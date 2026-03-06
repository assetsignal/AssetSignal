/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ChevronRight, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  ArrowRight,
  RefreshCw,
  FileText,
  PieChart,
  Target,
  Upload,
  FileUp,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  Check,
  History,
  X,
  AlertTriangle,
  Calendar,
  Moon,
  Sun,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import ChatBot from './components/ChatBot';
import { 
  FinancialData, 
  AssetProfile, 
  AssetType, 
  AnalysisResult,
  FinancialCategory,
  AuditLogEntry,
  Property,
  MonthlyRecord,
  MoMAnalysis
} from './types';
import { v4 as uuidv4 } from 'uuid';

const calculateNOI = (data: FinancialData) => {
  const getValues = (cat: FinancialCategory) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      return {
        actual: cat.subcategories.reduce((sum, sub) => sum + sub.actual, 0),
        budget: cat.subcategories.reduce((sum, sub) => sum + sub.budget, 0)
      };
    }
    return { actual: cat.actual, budget: cat.budget };
  };

  const totalRevActual = Object.values(data.revenue).reduce((sum, cat) => sum + getValues(cat).actual, 0);
  const totalRevBudget = Object.values(data.revenue).reduce((sum, cat) => sum + getValues(cat).budget, 0);
  const totalExpActual = Object.values(data.expenses).reduce((sum, cat) => sum + getValues(cat).actual, 0);
  const totalExpBudget = Object.values(data.expenses).reduce((sum, cat) => sum + getValues(cat).budget, 0);
  
  return {
    actual: totalRevActual - totalExpActual,
    budget: totalRevBudget - totalExpBudget
  };
};

const INITIAL_FINANCIALS: FinancialData = {
  revenue: {
    rentalIncome: { 
      name: 'Rental Income', 
      accountCode: '4000',
      currentMonthActual: 0,
      currentMonthBudget: 0,
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Market Rent', accountCode: '4000', currentMonthActual: 26100, currentMonthBudget: 26000, actual: 76900, budget: 312000 },
        { name: 'Premium Unit Income', accountCode: '4005', currentMonthActual: 500, currentMonthBudget: 400, actual: 1500, budget: 6000 },
        { name: 'Loss to Lease', accountCode: '4010', currentMonthActual: -450, currentMonthBudget: -500, actual: -650, budget: -6000 },
      ]
    },
    otherIncome: { 
      name: 'Other Income', 
      accountCode: '4100',
      currentMonthActual: 0,
      currentMonthBudget: 0,
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Late Fees', accountCode: '4110', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Pet Rent', accountCode: '4120', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Parking Income', accountCode: '4130', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Utility Reimbursement', accountCode: '4140', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Application Fees', accountCode: '4150', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
  },
  expenses: {
    payroll: { 
      name: 'Payroll', 
      accountCode: '5000',
      currentMonthActual: 0,
      currentMonthBudget: 0,
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'On-site Salaries', accountCode: '5010', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Benefits & Taxes', accountCode: '5020', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
    repairsMaintenance: { 
      name: 'Repairs & Maintenance', 
      accountCode: '5100',
      currentMonthActual: 0,
      currentMonthBudget: 0,
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Contract Services', accountCode: '5110', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Supplies & Parts', accountCode: '5120', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
    utilities: { 
      name: 'Utilities', 
      accountCode: '5200',
      currentMonthActual: 0,
      currentMonthBudget: 0,
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Electricity', accountCode: '5210', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Water & Sewer', accountCode: '5220', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Gas/Trash', accountCode: '5230', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
    insurance: { name: 'Insurance', accountCode: '5300', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
    propertyManagement: { name: 'Property Management', accountCode: '5400', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
    taxes: { 
      name: 'Taxes', 
      accountCode: '5500',
      currentMonthActual: 0,
      currentMonthBudget: 0,
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Real Estate Taxes', accountCode: '5510', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Other Taxes/Fees', accountCode: '5520', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
    marketing: { 
      name: 'Marketing', 
      accountCode: '5600', 
      currentMonthActual: 0, 
      currentMonthBudget: 0, 
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Advertising', accountCode: '5610', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Internet Marketing', accountCode: '5620', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
    admin: { 
      name: 'Admin', 
      accountCode: '5700', 
      currentMonthActual: 0, 
      currentMonthBudget: 0, 
      actual: 0, 
      budget: 0,
      subcategories: [
        { name: 'Office Supplies', accountCode: '5710', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
        { name: 'Legal & Professional', accountCode: '5720', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
      ]
    },
    otherOpEx: { name: 'Other OpEx', accountCode: '5800', currentMonthActual: 0, currentMonthBudget: 0, actual: 0, budget: 0 },
  }
};

const CATEGORIES = {
  REVENUE: ['Rental Income', 'Other Income'],
  EXPENSES: ['Payroll', 'Repairs & Maintenance', 'Utilities', 'Insurance', 'Property Management', 'Taxes', 'Marketing', 'Admin', 'Other OpEx']
} as const;

const CATEGORY_MAP: Record<string, string> = {
  rentalIncome: 'Rental Income',
  otherIncome: 'Other Income',
  payroll: 'Payroll',
  repairsMaintenance: 'Repairs & Maintenance',
  utilities: 'Utilities',
  insurance: 'Insurance',
  propertyManagement: 'Property Management',
  taxes: 'Taxes',
  marketing: 'Marketing',
  admin: 'Admin',
  otherOpEx: 'Other OpEx'
};

const REPORTING_MONTHS = (() => {
  const months = [];
  const start = new Date(2022, 7, 1); // Aug 2022
  const end = new Date(2027, 7, 1);   // Aug 2027
  let current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    months.push({
      value: `${y}-${m}`,
      label: current.toLocaleString('default', { month: 'short', year: 'numeric' })
    });
    current.setMonth(current.getMonth() + 1);
  }
  return months;
})();

const USER_EMAIL = "sara.sun.ai0221@gmail.com";

const getLatestWeeklyBeds = (rows: any[]): number | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const latestRow = [...rows]
    .filter((r) => typeof r?.date === 'string')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  if (!latestRow) return null;
  const beds = Number(latestRow.bedsLeased);
  return Number.isFinite(beds) ? beds : null;
};

const normalizeHeaderKey = (key: unknown): string =>
  String(key ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const toISODate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const yyyy = String(parsed.y).padStart(4, '0');
      const mm = String(parsed.m).padStart(2, '0');
      const dd = String(parsed.d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = Number(slashMatch[1]);
    const day = Number(slashMatch[2]);
    const year = Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]);
    if (year >= 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
};

const parseWeeklyRowsFromCsvText = (csvText: string): Array<Record<string, string>> => {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return headers.reduce<Record<string, string>>((acc, header, idx) => {
      acc[header] = cols[idx] ?? '';
      return acc;
    }, {});
  });
};

const buildDemoWebsiteCompData = (profile: AssetProfile) => {
  const today = new Date().toISOString().slice(0, 10);
  const comps = (profile.competitorNames || []).filter(Boolean);
  const fallbackNames = ['Sunset Heights', 'Riverwalk Student Living', 'The Forum Residences'];
  const competitorNames = comps.length > 0 ? comps : fallbackNames;
  const urls = profile.competitorUrls || {};

  const floorplans = [
    { name: '1B1B', min: 1085, max: 1215 },
    { name: '2B2B', min: 835, max: 965 },
    { name: '3B3B', min: 785, max: 905 },
    { name: '4B4B', min: 730, max: 860 },
  ];

  const compIntelligence = competitorNames.map((name, idx) => ({
    id: `demo-comp-${idx + 1}`,
    name,
    url: getKnownCompetitorUrl(name, urls) || urls[name] || `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com/`,
    currentPromo: idx === 0
      ? '8 weeks free on select 12-month leases'
      : idx === 1
        ? '$300 gift card + waived application fee'
        : 'Reduced rates on select 3B3B and 4B4B floorplans',
    promoType: idx === 0 ? 'Free Month' : idx === 1 ? 'Gift Card' : 'Price Drop',
    lastChangeDate: today,
    avgRent: 0,
    rentTrend: 0,
    isAlert: idx !== 0,
    rentRangeSummary: '',
    floorplanRanges: floorplans.map((fp) => ({
      name: fp.name,
      minRent: fp.min + idx * 20,
      maxRent: fp.max + idx * 25,
    })),
  }));

  const activePromos = [
    {
      id: 'demo-promo-1',
      competitorId: 'demo-comp-1',
      competitorName: competitorNames[0] || 'Sunset Heights',
      url: compIntelligence[0]?.url || '',
      sourceUrl: compIntelligence[0]?.url || '',
      sourceSnippet: 'Now leasing fall 2026 with up to 8 weeks free on select units.',
      confidence: 'visible_banner' as const,
      type: 'Free Month' as const,
      text: 'Up to 8 weeks free on select 12-month leases',
      detectedDate: today,
      status: 'active' as const,
    },
    {
      id: 'demo-promo-2',
      competitorId: 'demo-comp-2',
      competitorName: competitorNames[1] || 'Riverwalk Student Living',
      url: compIntelligence[1]?.url || '',
      sourceUrl: compIntelligence[1]?.url || '',
      sourceSnippet: 'Limited-time bonus: $300 gift card and waived application fee.',
      confidence: 'visible_banner' as const,
      type: 'Gift Card' as const,
      text: '$300 gift card + waived application fee',
      detectedDate: today,
      status: 'active' as const,
    },
    {
      id: 'demo-promo-3',
      competitorId: 'demo-comp-3',
      competitorName: competitorNames[2] || 'The Forum Residences',
      url: compIntelligence[2]?.url || '',
      sourceUrl: compIntelligence[2]?.url || '',
      sourceSnippet: 'Special pricing on select 3B3B/4B4B floorplans this week.',
      confidence: 'visible_banner' as const,
      type: 'Price Drop' as const,
      text: 'Reduced rates on select 3B3B and 4B4B floorplans',
      detectedDate: today,
      status: 'active' as const,
    },
  ];

  return { compIntelligence, activePromos };
};

const postJson = async (url: string, body: unknown) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed: ${res.status}`);
  }
  return data;
};

const isQuotaError = (error: unknown) => {
  const message = (error as any)?.message || '';
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('insufficient_quota')
  );
};

const isValidReportingMonth = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

const CANONICAL_COMPETITOR_URLS: Record<string, string> = {
  'the lyfe': 'https://www.thelyfeatmissouri.com/',
  'u centre on turner': 'https://www.americancampus.com/student-apartments/mo/columbia/u-centre-on-turner/',
  'rise on 9th': 'https://www.riseon9th.com/',
};

const getKnownCompetitorUrl = (
  competitorName: string,
  competitorUrls?: Record<string, string>
): string | null => {
  if (!competitorName) return null;

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedName = normalize(competitorName);

  if (competitorUrls) {
    const exact = competitorUrls[competitorName];
    if (exact) return exact;

    const key = Object.keys(competitorUrls).find((k) => normalize(k) === normalizedName);
    if (key && competitorUrls[key]) return competitorUrls[key];
  }

  return CANONICAL_COMPETITOR_URLS[normalizedName] || null;
};

const inferReportingMonthFromFileName = (fileName: string): string | null => {
  const base = fileName.replace(/\.[^/.]+$/, '');

  let match = base.match(/\b(20\d{2})[-_ ](0[1-9]|1[0-2])\b/);
  if (match) return `${match[1]}-${match[2]}`;

  match = base.match(/\b(0[1-9]|1[0-2])[-_ ](20\d{2})\b/);
  if (match) return `${match[2]}-${match[1]}`;

  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const monthNameMatch = base.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b[\s_-]*(20\d{2})/i);
  if (monthNameMatch) {
    const mm = monthMap[monthNameMatch[1].toLowerCase()];
    if (mm) return `${monthNameMatch[2]}-${mm}`;
  }

  const yearMonthNameMatch = base.match(/\b(20\d{2})[\s_-]*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
  if (yearMonthNameMatch) {
    const mm = monthMap[yearMonthNameMatch[2].toLowerCase()];
    if (mm) return `${yearMonthNameMatch[1]}-${mm}`;
  }

  return null;
};

const detectReportingMonthInText = (text: string): string | null => {
  if (!text) return null;

  let match = text.match(/\b(20\d{2})[-\/](0[1-9]|1[0-2])\b/);
  if (match) return `${match[1]}-${match[2]}`;

  match = text.match(/\b(0[1-9]|1[0-2])[-\/](20\d{2})\b/);
  if (match) return `${match[2]}-${match[1]}`;

  const monthMap: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
  };

  const monthYear = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b[\s,/-]+(20\d{2})\b/i);
  if (monthYear) {
    const mm = monthMap[monthYear[1].toLowerCase()];
    if (mm) return `${monthYear[2]}-${mm}`;
  }

  const yearMonth = text.match(/\b(20\d{2})[\s,/-]+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i);
  if (yearMonth) {
    const mm = monthMap[yearMonth[2].toLowerCase()];
    if (mm) return `${yearMonth[1]}-${mm}`;
  }

  return null;
};

const resolveReportingMonth = (
  extractedData: any,
  fileName: string,
  opts?: { contentDetectedMonth?: string | null; uploadKind?: 'spreadsheet' | 'image' },
): string | null => {
  const contentDetectedMonth = opts?.contentDetectedMonth || null;
  const uploadKind = opts?.uploadKind || 'image';
  const extractedMonth = [
    extractedData?.reportingMonth,
    extractedData?.reportMonth,
    extractedData?.month,
    extractedData?.statementMonth,
  ].find(isValidReportingMonth) || null;

  // For spreadsheet uploads, trust only month detected directly from file content.
  if (uploadKind === 'spreadsheet') {
    if (contentDetectedMonth && isValidReportingMonth(contentDetectedMonth)) {
      return contentDetectedMonth;
    }
  } else if (extractedMonth && isValidReportingMonth(extractedMonth)) {
    // For image uploads, we rely on OCR extraction since raw text is not directly available.
    return extractedMonth;
  }

  const inferredFromName = inferReportingMonthFromFileName(fileName);
  if (!inferredFromName) {
    return null;
  }

  const [y, m] = inferredFromName.split('-').map(Number);
  const displayMonth = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const confirmed = window.confirm(
    `Could not find reporting month inside "${fileName}". Use ${displayMonth} inferred from file name?`
  );
  return confirmed ? inferredFromName : null;
};

const extractFinancialDataFromFile = async (file: File): Promise<{
  extractedData: any;
  uploadKind: 'spreadsheet' | 'image';
  contentDetectedMonth: string | null;
}> => {
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csvText = XLSX.utils.sheet_to_csv(worksheet);
    const extractedData = await postJson('/api/ai/extract', { csvText, fileName: file.name });
    return {
      extractedData,
      uploadKind: 'spreadsheet',
      contentDetectedMonth: detectReportingMonthInText(csvText)
    };
  }

  if (file.type.startsWith('image/')) {
    const imageDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    const extractedData = await postJson('/api/ai/extract', { imageDataUrl, fileName: file.name });
    return {
      extractedData,
      uploadKind: 'image',
      contentDetectedMonth: null
    };
  }

  throw new Error('Unsupported file type for AI extraction. Use Excel (.xlsx/.xls) or image files.');
};

type AttentionLevel = 'Stable' | 'Moderate' | 'Elevated' | 'Critical';
type AttentionScoreBreakdown = {
  score: number;
  level: AttentionLevel;
  components: {
    noiVsBudget: number;
  };
  metrics: {
    noiActual: number;
    noiBudget: number;
    noiVariance: number;
    noiVariancePct: number;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

const attentionLevelFromScore = (score: number): AttentionLevel => {
  if (score >= 8) return 'Critical';
  if (score >= 6) return 'Elevated';
  if (score >= 4) return 'Moderate';
  return 'Stable';
};

const calculateAttentionScore = (args: {
  noiActual: number;
  noiBudget: number;
}): AttentionScoreBreakdown => {
  const noiVariance = args.noiActual - args.noiBudget;
  const noiVariancePct = args.noiBudget !== 0
    ? (noiVariance / Math.abs(args.noiBudget)) * 100
    : 0;
  const noiVsBudgetPoints = noiVariancePct < 0 ? Math.min(9, Math.abs(noiVariancePct) / 3) : 0;
  const rawScore = 1 + noiVsBudgetPoints;
  const score = clamp(Math.round(rawScore), 1, 10);

  return {
    score,
    level: attentionLevelFromScore(score),
    components: {
      noiVsBudget: round1(noiVsBudgetPoints)
    },
    metrics: {
      noiActual: round1(args.noiActual),
      noiBudget: round1(args.noiBudget),
      noiVariance: round1(noiVariance),
      noiVariancePct: round1(noiVariancePct)
    }
  };
};

const buildFallbackAnalysis = (
  profile: AssetProfile,
  currentMonth: string,
  dynamicMoM: MoMAnalysis | null,
  dynamicYTDTrend: { month: string; actualNOI: number; budgetNOI: number }[],
  weeklyPreleaseData: { date: string; bedsLeased: number }[],
  attentionBreakdown: AttentionScoreBreakdown
): AnalysisResult => {
  const preleasePct = profile.totalBeds > 0 ? (profile.preleasedBeds / profile.totalBeds) * 100 : 0;
  const variance = preleasePct - profile.targetOccupancy;
  const competitorNames = profile.competitorNames.filter(Boolean);

  return {
    attentionScore: attentionBreakdown.score,
    attentionLevel: attentionBreakdown.level,
    preleaseVelocity: {
      current: preleasePct,
      target: profile.targetOccupancy,
      variance,
      status: variance > 2 ? 'Ahead' : variance < -2 ? 'Behind' : 'On Track',
      history: weeklyPreleaseData.length > 0
        ? weeklyPreleaseData.map((w) => ({ date: w.date, beds: w.bedsLeased }))
        : [{ date: new Date().toISOString().split('T')[0], beds: profile.preleasedBeds }]
    },
    compIntelligence: competitorNames.map((name, idx) => ({
      id: `fallback-comp-${idx + 1}`,
      name,
      url: getKnownCompetitorUrl(name, profile.competitorUrls) || '',
      currentPromo: 'No live scrape available. Add API key and run refresh to pull active concessions.',
      promoType: 'Unknown',
      lastChangeDate: currentMonth,
      avgRent: 0,
      rentTrend: 0,
      isAlert: variance < -2,
      rentRangeSummary: 'No floorplan rent range found on official website.',
      floorplanRanges: []
    })),
    activePromos: [],
    historicalTimeline: [],
    mom: dynamicMoM,
    ytdTrend: dynamicYTDTrend,
    strategy: {
      revenue: [
        'Which floor plans are pacing below budget and what lease-term mix can recover rate without increasing concessions?',
        'Where are we discounting most heavily, and are those discounts driving net effective rent lift or just occupancy pull-forward?'
      ],
      opex: [
        'Which expense lines have the largest MoM variance and what operational drivers explain those swings?',
        'Can we shift preventive maintenance or vendor scope to reduce repeat work orders and overtime this quarter?'
      ]
    },
    lastRefresh: new Date().toISOString()
  };
};

interface CategoryRowProps {
  category: FinancialCategory;
  onUpdate: (updated: FinancialCategory) => void;
  onDelete?: () => void;
  onCategoryChange?: (subName: string, newName: string) => void;
  isSub?: boolean;
  parentType: 'REVENUE' | 'EXPENSES';
  parentCategoryName: string;
  isEditMode: boolean;
  addLog: (action: string, category: string, details: string) => void;
}

const CategoryRow = ({
  category,
  onUpdate,
  onDelete,
  onCategoryChange,
  isSub = false,
  parentType,
  parentCategoryName,
  isEditMode,
  addLog
}: CategoryRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(category.name);
  const hasSubs = category.subcategories && category.subcategories.length > 0;

  const currentMonthActual = hasSubs
    ? category.subcategories!.reduce((sum, sub) => sum + sub.currentMonthActual, 0)
    : category.currentMonthActual;

  const currentMonthBudget = hasSubs
    ? category.subcategories!.reduce((sum, sub) => sum + sub.currentMonthBudget, 0)
    : category.currentMonthBudget;

  const actual = hasSubs
    ? category.subcategories!.reduce((sum, sub) => sum + sub.actual, 0)
    : category.actual;

  const budget = hasSubs
    ? category.subcategories!.reduce((sum, sub) => sum + sub.budget, 0)
    : category.budget;

  const handleNameSubmit = () => {
    if (tempName !== category.name) {
      addLog("Category Renamed", category.name, `Renamed to "${tempName}"`);
      onUpdate({ ...category, name: tempName });
    }
    setIsRenaming(false);
  };

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString();
    return val < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  // Find the matching category name from the list, case-insensitive
  const selectedCategory = CATEGORIES[parentType].find(
    c => c.trim().toLowerCase() === (parentCategoryName || '').trim().toLowerCase()
  ) || (parentType === 'REVENUE' ? 'Rental Income' : 'Payroll');

  return (
    <>
      <div className={`grid grid-cols-[0.8fr_1.5fr_1fr_1fr_1fr_1fr_1fr] p-4 items-center border-b border-brand-line hover:bg-brand-ink/[0.02] transition-colors ${hasSubs ? 'bg-brand-ink/[0.01]' : ''}`}>
        <div className="text-[10px] font-mono text-brand-ink/40 flex items-center gap-2">
          {hasSubs && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-brand-ink/10 rounded transition-colors shrink-0"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          {category.accountCode || '—'}
        </div>

        <div className="overflow-hidden">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                className="bg-white border border-brand-line px-2 py-0.5 text-sm outline-none rounded w-full"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              />
              <button onClick={handleNameSubmit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group overflow-hidden">
              <span className={`truncate ${hasSubs ? 'font-bold text-sm' : 'text-sm'}`}>{category.name}</span>
              {isEditMode && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="p-1 hover:bg-brand-ink/10 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {isSub && onDelete && (
                    <button
                      onClick={() => {
                        addLog("Subcategory Removed", category.name, `Removed from parent`);
                        onDelete();
                      }}
                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-2">
          {!hasSubs ? (
            <div className="relative group/pill">
              <select
                className="appearance-none bg-brand-ink/5 hover:bg-brand-ink/10 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full cursor-pointer outline-none transition-colors w-full text-center"
                value={selectedCategory}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  if (newCategory !== selectedCategory && onCategoryChange) {
                    onCategoryChange(category.name, newCategory);
                  }
                }}
              >
                {CATEGORIES[parentType].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/pill:opacity-40 transition-opacity">
                <ChevronDown className="w-2 h-2" />
              </div>
            </div>
          ) : (
            <span className="text-[10px] uppercase opacity-40 block text-center">Category</span>
          )}
        </div>

        <div className="text-right">
          {hasSubs ? (
            <span className="mono-value opacity-60 font-bold">{formatCurrency(currentMonthActual)}</span>
          ) : (
            <input
              type="number"
              className="bg-transparent border-b border-brand-line/20 py-1 font-mono focus:border-brand-ink outline-none w-full text-right text-sm"
              value={category.currentMonthActual}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                if (val !== category.currentMonthActual) {
                  addLog("Value Adjusted", category.name, `Month Actual: ${category.currentMonthActual} -> ${val}`);
                  onUpdate({ ...category, currentMonthActual: val });
                }
              }}
            />
          )}
        </div>
        <div className="text-right">
          {hasSubs ? (
            <span className="mono-value opacity-40">{formatCurrency(currentMonthBudget)}</span>
          ) : (
            <input
              type="number"
              className="bg-transparent border-b border-brand-line/20 py-1 font-mono focus:border-brand-ink outline-none w-full text-right text-sm opacity-60"
              value={category.currentMonthBudget}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                if (val !== category.currentMonthBudget) {
                  addLog("Value Adjusted", category.name, `Month Budget: ${category.currentMonthBudget} -> ${val}`);
                  onUpdate({ ...category, currentMonthBudget: val });
                }
              }}
            />
          )}
        </div>
        <div className="text-right">
          {hasSubs ? (
            <span className="mono-value opacity-60 font-bold">{formatCurrency(actual)}</span>
          ) : (
            <input
              type="number"
              className="bg-transparent border-b border-brand-line/20 py-1 font-mono focus:border-brand-ink outline-none w-full text-right text-sm"
              value={category.actual}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                if (val !== category.actual) {
                  addLog("Value Adjusted", category.name, `YTD Actual: ${category.actual} -> ${val}`);
                  onUpdate({ ...category, actual: val });
                }
              }}
            />
          )}
        </div>
        <div className="text-right">
          {hasSubs ? (
            <span className="mono-value opacity-40">{formatCurrency(budget)}</span>
          ) : (
            <input
              type="number"
              className="bg-transparent border-b border-brand-line/20 py-1 font-mono focus:border-brand-ink outline-none w-full text-right text-sm opacity-60"
              value={category.budget}
              onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                if (val !== category.budget) {
                  addLog("Value Adjusted", category.name, `YTD Budget: ${category.budget} -> ${val}`);
                  onUpdate({ ...category, budget: val });
                }
              }}
            />
          )}
        </div>
      </div>

      {hasSubs && isExpanded && (
        <div className="bg-brand-ink/[0.01] animate-in slide-in-from-top-2 duration-200">
          {category.subcategories!.map((sub, idx) => (
            <CategoryRow
              key={idx}
              category={sub}
              isSub={true}
              parentType={parentType}
              parentCategoryName={category.name}
              isEditMode={isEditMode}
              addLog={addLog}
              onCategoryChange={(subName, newCat) => {
                if (onCategoryChange) onCategoryChange(subName, newCat);
              }}
              onUpdate={(updated) => {
                const newSubs = [...category.subcategories!];
                newSubs[idx] = updated;
                onUpdate({ ...category, subcategories: newSubs });
              }}
              onDelete={() => {
                const newSubs = category.subcategories!.filter((_, i) => i !== idx);
                onUpdate({ ...category, subcategories: newSubs });
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'property'>('portfolio');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('asset_signal_theme');
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [weeklyPreleaseData, setWeeklyPreleaseData] = useState<any[]>([]);
  const [concessionHistoryData, setConcessionHistoryData] = useState<Array<{ date: string; promoCount: number; avgRent: number }>>([]);
  const latestWeeklyBeds = useMemo(() => getLatestWeeklyBeds(weeklyPreleaseData), [weeklyPreleaseData]);

  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isUploadMonthModalOpen, setIsUploadMonthModalOpen] = useState(false);
  const [selectedUploadMonth, setSelectedUploadMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{current: number, total: number, status: string} | null>(null);
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  
  const handleBulkUpload = async (files: FileList) => {
    if (!selectedPropertyId) {
      alert("Please select a property first.");
      return;
    }

    setIsBulkUploadOpen(false);
    setBulkUploadProgress({ current: 0, total: files.length, status: 'Starting...' });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBulkUploadProgress(prev => ({ ...prev!, current: i + 1, status: `Extracting ${file.name}...` }));
      
      try {
        const { extractedData: extracted, uploadKind, contentDetectedMonth } = await extractFinancialDataFromFile(file);
        const resolvedMonth = resolveReportingMonth(extracted, file.name, { uploadKind, contentDetectedMonth });
        if (!resolvedMonth) {
          setBulkUploadProgress(prev => ({
            ...prev!,
            status: `Skipped ${file.name}: no confirmed month/year found`
          }));
          continue;
        }

        const ensureNumber = (val: any) => typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) || 0 : 0);

        const merged: FinancialData = {
          revenue: {
            rentalIncome: { ...INITIAL_FINANCIALS.revenue.rentalIncome, currentMonthActual: ensureNumber(extracted.revenue?.rentalIncome?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.revenue?.rentalIncome?.currentMonthBudget), actual: ensureNumber(extracted.revenue?.rentalIncome?.actual), budget: ensureNumber(extracted.revenue?.rentalIncome?.budget), subcategories: extracted.revenue?.rentalIncome?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            otherIncome: { ...INITIAL_FINANCIALS.revenue.otherIncome, currentMonthActual: ensureNumber(extracted.revenue?.otherIncome?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.revenue?.otherIncome?.currentMonthBudget), actual: ensureNumber(extracted.revenue?.otherIncome?.actual), budget: ensureNumber(extracted.revenue?.otherIncome?.budget), subcategories: extracted.revenue?.otherIncome?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
          },
          expenses: {
            payroll: { ...INITIAL_FINANCIALS.expenses.payroll, currentMonthActual: ensureNumber(extracted.expenses?.payroll?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.payroll?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.payroll?.actual), budget: ensureNumber(extracted.expenses?.payroll?.budget), subcategories: extracted.expenses?.payroll?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            repairsMaintenance: { ...INITIAL_FINANCIALS.expenses.repairsMaintenance, currentMonthActual: ensureNumber(extracted.expenses?.repairsMaintenance?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.repairsMaintenance?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.repairsMaintenance?.actual), budget: ensureNumber(extracted.expenses?.repairsMaintenance?.budget), subcategories: extracted.expenses?.repairsMaintenance?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            utilities: { ...INITIAL_FINANCIALS.expenses.utilities, currentMonthActual: ensureNumber(extracted.expenses?.utilities?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.utilities?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.utilities?.actual), budget: ensureNumber(extracted.expenses?.utilities?.budget), subcategories: extracted.expenses?.utilities?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            insurance: { ...INITIAL_FINANCIALS.expenses.insurance, currentMonthActual: ensureNumber(extracted.expenses?.insurance?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.insurance?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.insurance?.actual), budget: ensureNumber(extracted.expenses?.insurance?.budget) },
            propertyManagement: { ...INITIAL_FINANCIALS.expenses.propertyManagement, currentMonthActual: ensureNumber(extracted.expenses?.propertyManagement?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.propertyManagement?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.propertyManagement?.actual), budget: ensureNumber(extracted.expenses?.propertyManagement?.budget) },
            taxes: { ...INITIAL_FINANCIALS.expenses.taxes, currentMonthActual: ensureNumber(extracted.expenses?.taxes?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.taxes?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.taxes?.actual), budget: ensureNumber(extracted.expenses?.taxes?.budget), subcategories: extracted.expenses?.taxes?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            marketing: { ...INITIAL_FINANCIALS.expenses.marketing, currentMonthActual: ensureNumber(extracted.expenses?.marketing?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.marketing?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.marketing?.actual), budget: ensureNumber(extracted.expenses?.marketing?.budget), subcategories: extracted.expenses?.marketing?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            admin: { ...INITIAL_FINANCIALS.expenses.admin, currentMonthActual: ensureNumber(extracted.expenses?.admin?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.admin?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.admin?.actual), budget: ensureNumber(extracted.expenses?.admin?.budget), subcategories: extracted.expenses?.admin?.subcategories?.map((s: any) => ({ name: s.name, accountCode: s.accountCode, currentMonthActual: ensureNumber(s.currentMonthActual), currentMonthBudget: ensureNumber(s.currentMonthBudget), actual: ensureNumber(s.actual), budget: ensureNumber(s.budget) })) },
            otherOpEx: { ...INITIAL_FINANCIALS.expenses.otherOpEx, currentMonthActual: ensureNumber(extracted.expenses?.otherOpEx?.currentMonthActual), currentMonthBudget: ensureNumber(extracted.expenses?.otherOpEx?.currentMonthBudget), actual: ensureNumber(extracted.expenses?.otherOpEx?.actual), budget: ensureNumber(extracted.expenses?.otherOpEx?.budget) },
          }
        };

        await saveMonthlyFinancials(merged, resolvedMonth, ensureNumber(extracted.occupancyStats?.preleasedBeds) || profile.preleasedBeds);
        setBulkUploadProgress(prev => ({ ...prev!, status: `Saved ${resolvedMonth}` }));
      } catch (error: any) {
        console.error(`Failed to process ${file.name}:`, error);
        if (isQuotaError(error)) {
          setQuotaExceeded(true);
          setStep(3);
          setBulkUploadProgress(null);
          return; // Stop bulk upload if quota is hit
        }
        setBulkUploadProgress(prev => ({
          ...prev!,
          status: `Error: ${(error as Error)?.message || `processing ${file.name}`}`
        }));
      }
    }
    
    setBulkUploadProgress(prev => ({ ...prev!, status: 'Complete!' }));
    setTimeout(() => setBulkUploadProgress(null), 3000);
    fetchPortfolio();
    if (selectedPropertyId) fetchRecords(selectedPropertyId);
  };
  const [quickUploadAssetId, setQuickUploadAssetId] = useState<string>('');
  const [quickUploadMonth, setQuickUploadMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<AssetProfile>({
    propertyName: '',
    totalBeds: 0,
    preleasedBeds: 0,
    targetOccupancy: 95,
    market: '',
    competitorNames: ['', '', '', '', '']
  });
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [financials, setFinancials] = useState<FinancialData>(INITIAL_FINANCIALS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isWeeklyImporting, setIsWeeklyImporting] = useState(false);
  const [showPromoRepeats, setShowPromoRepeats] = useState(false);
  const [lossViewMode, setLossViewMode] = useState<'ytd' | 'month'>('ytd');
  const [lossRankMetric, setLossRankMetric] = useState<'absolute' | 'percent'>('absolute');
  const [lossTopN, setLossTopN] = useState<3 | 5 | 10>(3);
  const [showAttentionInfo, setShowAttentionInfo] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const handleUpdatePreleaseBeds = async (beds: number) => {
    setProfile(prev => ({
      ...prev,
      preleasedBeds: beds,
      lastUpdated: new Date().toISOString()
    }));
    
    if (selectedPropertyId) {
      const today = new Date().toISOString().split('T')[0];
      try {
        await fetch(`/api/properties/${selectedPropertyId}/weekly-prelease`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uuidv4(),
            date: today,
            bedsLeased: beds
          })
        });
        
        const weeklyRes = await fetch(`/api/properties/${selectedPropertyId}/weekly-prelease`);
        const weeklyData = await weeklyRes.json();
        setWeeklyPreleaseData(weeklyData);
      } catch (e) {
        console.error("Failed to save weekly prelease via chatbot", e);
      }
    }
    
    const newLog: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toLocaleString(),
      user: 'AI Assistant',
      action: 'Update Prelease Beds',
      category: 'Property Profile',
      details: `Updated preleased beds to ${beds} via ChatBot.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [viewerSection, setViewerSection] = useState<'financial' | 'leasing' | 'market'>('financial');

  const latestMonthlyUpdate = useMemo(() => {
    const dates = monthlyRecords
      .map((r) => r.uploadedAt)
      .filter(Boolean)
      .map((d) => new Date(String(d)).getTime())
      .filter((t) => Number.isFinite(t));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }, [monthlyRecords]);

  const latestLeasingUpdate = useMemo(() => {
    const dates = weeklyPreleaseData
      .map((r: any) => r.ingestedAt || r.date)
      .filter(Boolean)
      .map((d: any) => new Date(String(d)).getTime())
      .filter((t: number) => Number.isFinite(t));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }, [weeklyPreleaseData]);

  React.useEffect(() => {
    if (!result) return;
    const monthlyTs = latestMonthlyUpdate?.getTime() || 0;
    const leasingTs = latestLeasingUpdate?.getTime() || 0;
    setViewerSection(leasingTs > monthlyTs ? 'leasing' : 'financial');
  }, [result?.lastRefresh, latestMonthlyUpdate, latestLeasingUpdate]);

  React.useEffect(() => {
    document.body.classList.toggle('theme-dark', themeMode === 'dark');
    localStorage.setItem('asset_signal_theme', themeMode);
  }, [themeMode]);
  const isDarkMode = themeMode === 'dark';
  const chartLineColor = isDarkMode ? '#E2E8F0' : '#141414';
  const chartGridColor = isDarkMode ? 'rgba(226,232,240,0.18)' : '#E4E3E0';
  const chartTickColor = isDarkMode ? '#E2E8F0' : '#141414';
  const chartTooltipBg = isDarkMode ? '#0B1220' : '#141414';

  // Dynamic Prelease Metrics for Dashboard
  const effectiveCurrentBeds = latestWeeklyBeds ?? profile.preleasedBeds;
  const currentPreleasePct = profile.totalBeds > 0 ? (effectiveCurrentBeds / profile.totalBeds) * 100 : 0;
  const currentPreleaseVariance = currentPreleasePct - profile.targetOccupancy;
  const currentPreleaseStatus = currentPreleaseVariance > 2 ? 'Ahead' : currentPreleaseVariance < -2 ? 'Behind' : 'On Track';

  const dynamicPreleaseHistory = useMemo(() => {
    if (!result) return [];
    // Start with the history from the analysis result
    const history = [...result.preleaseVelocity.history];
    const today = new Date().toISOString().split('T')[0];
    
    // Update or add today's data point from the current profile
    const todayIdx = history.findIndex(h => h.date === today);
    if (todayIdx !== -1) {
      history[todayIdx] = { ...history[todayIdx], beds: effectiveCurrentBeds };
    } else {
      history.push({ date: today, beds: effectiveCurrentBeds });
    }
    
    // Ensure we don't have duplicates and sort by date
    return history
      .filter((v, i, a) => a.findIndex(t => t.date === v.date) === i)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [result?.preleaseVelocity.history, effectiveCurrentBeds]);

  const weeklyVelocitySeries = useMemo(() => {
    const baseRows = (Array.isArray(weeklyPreleaseData) && weeklyPreleaseData.length > 0)
      ? weeklyPreleaseData.map((w: any) => ({
          date: String(w.date),
          beds: Number(w.bedsLeased) || 0
        }))
      : dynamicPreleaseHistory.map((h) => ({
          date: String(h.date),
          beds: Number(h.beds) || 0
        }));

    const rows = baseRows
      .filter((r) => r.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((r, idx, arr) => arr.findIndex((x) => x.date === r.date) === idx);

    return rows.map((row, idx) => {
      const prev = idx > 0 ? rows[idx - 1].beds : null;
      const velocityBeds = prev === null ? 0 : row.beds - prev;
      const velocityPct = profile.totalBeds > 0 ? (velocityBeds / profile.totalBeds) * 100 : 0;
      const absolutePct = profile.totalBeds > 0 ? (row.beds / profile.totalBeds) * 100 : 0;
      const dateObj = new Date(`${row.date}T00:00:00`);
      return {
        date: row.date,
        week: Number.isNaN(dateObj.getTime())
          ? row.date
          : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        beds: row.beds,
        velocityBeds,
        velocityPct,
        absolutePct
      };
    });
  }, [weeklyPreleaseData, dynamicPreleaseHistory, profile.totalBeds]);

  const canonicalPromos = useMemo(() => {
    const rawPromos = (result?.activePromos || [])
      .filter((promo) => !promo.confidence || promo.confidence === 'visible_banner')
      .filter((promo) => promo.status !== 'inactive');

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    const parseDate = (value: string): number => {
      const t = Date.parse(value);
      return Number.isNaN(t) ? 0 : t;
    };

    const grouped = new Map<string, any>();

    for (const promo of rawPromos) {
      const key = `${normalize(promo.competitorName)}|${normalize(promo.type)}|${normalize(promo.text)}`;
      const existing = grouped.get(key);
      const ts = parseDate(promo.detectedDate);

      if (!existing) {
        grouped.set(key, {
          ...promo,
          repeatCount: 1,
          firstDetectedDate: promo.detectedDate,
          lastDetectedDate: promo.detectedDate,
          snippetSet: new Set(promo.sourceSnippet ? [promo.sourceSnippet] : []),
          latestTs: ts
        });
        continue;
      }

      existing.repeatCount += 1;
      existing.firstDetectedDate = parseDate(existing.firstDetectedDate) <= ts ? existing.firstDetectedDate : promo.detectedDate;
      existing.lastDetectedDate = parseDate(existing.lastDetectedDate) >= ts ? existing.lastDetectedDate : promo.detectedDate;
      if (promo.sourceSnippet) existing.snippetSet.add(promo.sourceSnippet);
      if (ts >= existing.latestTs) {
        existing.latestTs = ts;
        existing.id = promo.id;
        existing.detectedDate = promo.detectedDate;
        existing.sourceUrl = promo.sourceUrl || existing.sourceUrl;
        existing.url = promo.url || existing.url;
        existing.sourceSnippet = promo.sourceSnippet || existing.sourceSnippet;
      }
    }

    return Array.from(grouped.values())
      .map((promo) => {
        const snippetCount = promo.snippetSet?.size || 0;
        const status = promo.repeatCount <= 1 ? 'new' : snippetCount > 1 ? 'updated' : 'unchanged';
        return {
          ...promo,
          status,
          snippetSet: undefined
        };
      })
      .sort((a, b) => Date.parse(b.detectedDate || '') - Date.parse(a.detectedDate || ''));
  }, [result?.activePromos]);

  const groupedPromos = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const promo of canonicalPromos) {
      const key = promo.competitorName || 'Unknown Competitor';
      const list = map.get(key) || [];
      list.push(promo);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([competitorName, promos]) => ({ competitorName, promos }))
      .sort((a, b) => a.competitorName.localeCompare(b.competitorName));
  }, [canonicalPromos]);

  const noiLossDrivers = useMemo(() => {
    type Line = {
      section: 'Revenue' | 'Expense';
      accountCode: string;
      name: string;
      actual: number;
      budget: number;
      lossAbs: number;
      lossPct: number;
    };

    const toLines = (
      section: 'Revenue' | 'Expense',
      entries: Record<string, FinancialCategory>
    ): Line[] => {
      const lines: Line[] = [];
      const fieldActual = lossViewMode === 'ytd' ? 'actual' : 'currentMonthActual';
      const fieldBudget = lossViewMode === 'ytd' ? 'budget' : 'currentMonthBudget';

      for (const cat of Object.values(entries)) {
        const rows = cat.subcategories && cat.subcategories.length > 0 ? cat.subcategories : [cat];
        for (const row of rows) {
          const actual = Number((row as any)[fieldActual] || 0);
          const budget = Number((row as any)[fieldBudget] || 0);
          const rawLoss = section === 'Revenue' ? budget - actual : actual - budget;
          const lossAbs = Number.isFinite(rawLoss) ? rawLoss : 0;
          const lossPct = Math.abs(budget) > 0 ? (lossAbs / Math.abs(budget)) * 100 : 0;
          lines.push({
            section,
            accountCode: row.accountCode || '',
            name: row.name,
            actual,
            budget,
            lossAbs,
            lossPct
          });
        }
      }
      return lines;
    };

    const allLines = [
      ...toLines('Revenue', financials.revenue),
      ...toLines('Expense', financials.expenses),
    ]
      .filter((l) => l.lossAbs > 0)
      .sort((a, b) => {
        const av = lossRankMetric === 'absolute' ? a.lossAbs : a.lossPct;
        const bv = lossRankMetric === 'absolute' ? b.lossAbs : b.lossPct;
        return bv - av;
      });

    return allLines.slice(0, lossTopN);
  }, [financials, lossViewMode, lossRankMetric, lossTopN]);

  // Dynamic MoM Analysis for Dashboard
  const dynamicMoM = useMemo(() => {
    const priorRecords = monthlyRecords.filter(r => r.month < currentMonth).sort((a, b) => b.month.localeCompare(a.month));
    const priorRecord = priorRecords.length > 0 ? priorRecords[0] : null;
    
    if (!priorRecord) return null;

    const getVal = (cat: any) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        return cat.subcategories.reduce((sum: number, sub: any) => sum + sub.actual, 0);
      }
      return cat.actual || 0;
    };

    const currentRev = Object.values(financials.revenue).reduce((sum, cat) => sum + getVal(cat), 0);
    const priorRev = Object.values(priorRecord.revenue).reduce((sum, cat) => sum + getVal(cat), 0);
    const currentExp = Object.values(financials.expenses).reduce((sum, cat) => sum + getVal(cat), 0);
    const priorExp = Object.values(priorRecord.expenses).reduce((sum, cat) => sum + getVal(cat), 0);
    const currentNoi = currentRev - currentExp;
    const priorNoi = priorRev - priorExp;

    const revDelta = currentRev - priorRev;
    const revDeltaPct = priorRev !== 0 ? (revDelta / Math.abs(priorRev)) * 100 : 0;
    const noiDelta = currentNoi - priorNoi;
    const noiDeltaPct = priorNoi !== 0 ? (noiDelta / Math.abs(priorNoi)) * 100 : 0;

    return {
      revenueDelta: revDelta,
      revenueDeltaPct: revDeltaPct,
      noiDelta: noiDelta,
      noiDeltaPct: noiDeltaPct,
      occupancyDelta: currentPreleasePct - priorRecord.occupancy,
      expenseVariances: Object.keys(financials.expenses).map(key => {
        const cur = getVal(financials.expenses[key as keyof typeof financials.expenses]);
        const pri = getVal(priorRecord.expenses[key as keyof typeof priorRecord.expenses]);
        const delta = cur - pri;
        const deltaPct = pri !== 0 ? (delta / Math.abs(pri)) * 100 : 0;
        return {
          category: financials.expenses[key as keyof typeof financials.expenses].name,
          delta,
          deltaPct,
          isSignificant: Math.abs(deltaPct) > 5
        };
      }),
      isRevenueSignificant: Math.abs(revDeltaPct) > 5,
      isOpexSignificant: Math.abs(noiDeltaPct) > 5
    };
  }, [financials, monthlyRecords, currentMonth, currentPreleasePct]);

  // Dynamic YTD Trend for Dashboard
  const dynamicYTDTrend = useMemo(() => {
    const currentYear = currentMonth.split('-')[0];
    const yearRecords = monthlyRecords
      .filter(r => r.month.startsWith(currentYear))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return yearRecords.map(r => {
      const noi = calculateNOI({ revenue: r.revenue, expenses: r.expenses });
      return {
        month: new Date(r.month + '-01').toLocaleString('default', { month: 'short' }),
        actualNOI: noi.actual,
        budgetNOI: noi.budget
      };
    });
  }, [monthlyRecords, currentMonth]);

  const attentionBreakdown = useMemo(() => {
    const noi = calculateNOI(financials);
    return calculateAttentionScore({
      noiActual: noi.actual,
      noiBudget: noi.budget
    });
  }, [financials]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Fetch initial data
  React.useEffect(() => {
    const init = async () => {
      await fetchProperties();
      await fetchPortfolio();
    };
    init();
  }, []);

  // Sync from localStorage to backend
  React.useEffect(() => {
    const sync = async () => {
      const localProps = JSON.parse(localStorage.getItem('asset_signal_properties') || '[]');
      const localRecords = JSON.parse(localStorage.getItem('asset_signal_records') || '[]');
      const localWeekly = JSON.parse(localStorage.getItem('asset_signal_weekly_prelease') || '[]');
      
      if (localProps.length > 0 || localRecords.length > 0 || localWeekly.length > 0) {
        console.log("Syncing to backend...", localProps.length, "props,", localRecords.length, "records");
        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              properties: localProps, 
              records: localRecords,
              weeklyData: localWeekly
            })
          });
          if (res.ok) {
            await fetchProperties();
            await fetchPortfolio();
            if (selectedPropertyId) {
              await fetchRecords(selectedPropertyId);
            }
          }
        } catch (e) {
          console.error("Sync failed", e);
        }
      }
    };
    
    sync();
  }, []); // Run once on mount

  // Load existing data when month or property changes
  React.useEffect(() => {
    if (selectedPropertyId && currentMonth) {
      const existing = monthlyRecords.find(r => r.month === currentMonth);
      if (existing) {
        setFinancials({
          revenue: existing.revenue,
          expenses: existing.expenses
        });
        setProfile(prev => ({
          ...prev,
          preleasedBeds: existing.preleasedBeds ?? latestWeeklyBeds ?? 0
        }));
        setIsDataLoaded(true);
      } else {
        // Only reset if we haven't just uploaded data
        // We check if the current financials are different from initial to avoid overwriting an upload
        if (!isDataLoaded) {
          setFinancials(INITIAL_FINANCIALS);
          if (latestWeeklyBeds !== null) {
            setProfile(prev => ({
              ...prev,
              preleasedBeds: latestWeeklyBeds
            }));
          }
        }
      }
    }
  }, [currentMonth, selectedPropertyId, monthlyRecords, isDataLoaded, latestWeeklyBeds]);

  const shouldAutoRefresh = (lastRefreshStr?: string) => {
    if (!lastRefreshStr) return true;
    
    const now = new Date();
    const lastRefresh = new Date(lastRefreshStr);

    // Get current time in EST/EDT (America/New_York)
    const nyTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const nyNow = new Date(nyTimeStr);
    
    const nyLastRefreshStr = lastRefresh.toLocaleString("en-US", { timeZone: "America/New_York" });
    const nyLastRefresh = new Date(nyLastRefreshStr);

    // Check if they are on different days in NY time
    const isDifferentDay = nyNow.toDateString() !== nyLastRefresh.toDateString();
    
    // 8 AM today in NY time
    const nyToday8AM = new Date(nyNow.getFullYear(), nyNow.getMonth(), nyNow.getDate(), 8, 0, 0);
    
    const wasBefore8AMToday = nyLastRefresh.getTime() < nyToday8AM.getTime();
    const isAfter8AMNow = nyNow.getTime() >= nyToday8AM.getTime();
    
    // Refresh if it's a new day and it's past 8am EST
    if (isDifferentDay && isAfter8AMNow) return true;
    
    // Refresh if it's the same day, we haven't refreshed yet today after 8am EST, and it's past 8am EST
    if (wasBefore8AMToday && isAfter8AMNow) return true;
    
    return false;
  };

  // Trigger analysis when step 3 is active and month changes
  React.useEffect(() => {
    if (step === 3 && selectedPropertyId && currentMonth && isDataLoaded && !isAnalyzing) {
      if (!result || shouldAutoRefresh(result.lastRefresh)) {
        performAnalysis();
      }
    }
  }, [currentMonth, step, selectedPropertyId, isDataLoaded, result, isAnalyzing]);
  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (e) {
      console.error("Failed to fetch properties", e);
      setApiError("Backend API unavailable. This application requires a Node.js server to run.");
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setPortfolio(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (e) {
      console.error("Failed to fetch portfolio", e);
      setApiError("Backend API unavailable. This application requires a Node.js server to run.");
    }
  };

  const fetchConcessionHistory = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/concession-history`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      setConcessionHistoryData(rows);
      setResult(prev => prev ? { ...prev, historicalTimeline: rows } : prev);
    } catch (e) {
      console.error("Failed to fetch concession history", e);
    }
  };

  const fetchRecords = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/records`);
      const data = await res.json();
      setMonthlyRecords(data);
      
      const weeklyRes = await fetch(`/api/properties/${propertyId}/weekly-prelease`);
      const weeklyData = await weeklyRes.json();
      setWeeklyPreleaseData(weeklyData);
      await fetchConcessionHistory(propertyId);
      const latestWeekly = getLatestWeeklyBeds(weeklyData);
      if (latestWeekly !== null) {
        setProfile(prev => ({ ...prev, preleasedBeds: latestWeekly }));
      }
    } catch (e) {
      console.error("Failed to fetch records", e);
    }
  };

  const handlePropertySelect = async (id: string) => {
    if (id === 'new') {
      setSelectedPropertyId(null);
      setResult(null);
      setConcessionHistoryData([]);
      setProfile({
        propertyName: '',
        totalBeds: 0,
        preleasedBeds: 0,
        targetOccupancy: 95,
        market: '',
        competitorNames: ['', '', '', '', '']
      });
      setStep(1);
      setActiveTab('property');
      return;
    }
    const prop = properties.find(p => p.id === id);
    if (prop) {
      setSelectedPropertyId(id);
      setIsDataLoaded(false);
      
      // Try to load cached analysis result
      const cachedResult = localStorage.getItem(`asset_signal_analysis_${id}`);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        const competitorUrls = prop.competitorUrls || {};
        setResult({
          ...parsed,
          compIntelligence: (parsed.compIntelligence || []).map((comp: any) => ({
            ...comp,
            url: getKnownCompetitorUrl(comp.name, competitorUrls) || comp.url
          })),
          activePromos: (parsed.activePromos || []).map((promo: any) => ({
            ...promo,
            url: getKnownCompetitorUrl(promo.competitorName, competitorUrls) || promo.url
          }))
        });
      } else {
        setResult(null);
      }

      setProfile({
        propertyName: prop.name,
        totalBeds: prop.totalBeds,
        preleasedBeds: 0, // Will be filled from latest record
        targetOccupancy: prop.targetOccupancy,
        market: prop.market,
        competitorNames: prop.competitorNames,
        competitorUrls: prop.competitorUrls || {}
      });
      
      try {
        const res = await fetch(`/api/properties/${id}/records`);
        const records = await res.json();
        setMonthlyRecords(records);

        const weeklyRes = await fetch(`/api/properties/${id}/weekly-prelease`);
        const weeklyData = await weeklyRes.json();
        setWeeklyPreleaseData(weeklyData);
        await fetchConcessionHistory(id);
        const latestWeekly = getLatestWeeklyBeds(weeklyData);
        
        if (records && records.length > 0) {
          // Sort by month descending to get the latest
          const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
          const latest = sorted[0];
          setCurrentMonth(latest.month);
          setFinancials({
            revenue: latest.revenue,
            expenses: latest.expenses
          });
          setProfile(prev => ({
            ...prev,
            preleasedBeds: latestWeekly ?? latest.preleasedBeds ?? 0
          }));
          setIsDataLoaded(true);
          
          // Trigger analysis for the latest month and go to dashboard
          setStep(3);
          setActiveTab('property');
        } else {
          if (latestWeekly !== null) {
            setProfile(prev => ({ ...prev, preleasedBeds: latestWeekly }));
          }
          setStep(2);
          setActiveTab('property');
        }
      } catch (e) {
        console.error("Failed to fetch records", e);
        setStep(2);
        setActiveTab('property');
      }
    }
  };

  const savePropertyProfile = async () => {
    const id = selectedPropertyId || uuidv4();
    const method = selectedPropertyId ? 'PUT' : 'POST';
    const url = selectedPropertyId ? `/api/properties/${id}` : '/api/properties';
    
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: profile.propertyName,
          assetType: 'Student Housing',
          totalBeds: profile.totalBeds,
          market: profile.market,
          targetOccupancy: profile.targetOccupancy,
          competitorNames: profile.competitorNames
        })
      });
      
      setSelectedPropertyId(id);
      
      // Update local storage for persistence
      const newProp = {
        id,
        name: profile.propertyName,
        assetType: 'Student Housing',
        totalBeds: profile.totalBeds,
        market: profile.market,
        targetOccupancy: profile.targetOccupancy,
        competitorNames: profile.competitorNames
      };
      const localProps = JSON.parse(localStorage.getItem('asset_signal_properties') || '[]');
      const existingIdx = localProps.findIndex((p: any) => p.id === id);
      if (existingIdx !== -1) {
        localProps[existingIdx] = newProp;
      } else {
        localProps.push(newProp);
      }
      localStorage.setItem('asset_signal_properties', JSON.stringify(localProps));
      
      // Save current preleased beds to weekly tracking for the chart
      const today = new Date().toISOString().split('T')[0];
      await fetch(`/api/properties/${id}/weekly-prelease`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          date: today,
          bedsLeased: profile.preleasedBeds
        })
      });

      await fetchProperties();
      await fetchPortfolio();
      
      // Refresh weekly data to ensure chart is updated
      const weeklyRes = await fetch(`/api/properties/${id}/weekly-prelease`);
      const weeklyData = await weeklyRes.json();
      setWeeklyPreleaseData(weeklyData);
      
      addLog("Profile Saved", "System", `Property profile for ${profile.propertyName} updated.`);
      setStep(2);
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  const saveMonthlyFinancials = async (overrideFinancials?: FinancialData, overrideMonth?: string, overridePrelease?: number) => {
    let propertyId = selectedPropertyId;
    const targetFinancials = overrideFinancials || financials;
    const targetMonth = overrideMonth || currentMonth;
    const targetPrelease = overridePrelease !== undefined ? overridePrelease : effectiveCurrentBeds;
    
    // If no property selected (adding new), save profile first
    if (!propertyId) {
      const newId = uuidv4();
      try {
        await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newId,
            name: profile.propertyName || 'Unnamed Property',
            assetType: 'Student Housing',
            totalBeds: profile.totalBeds,
            market: profile.market,
            targetOccupancy: profile.targetOccupancy,
            competitorNames: profile.competitorNames
          })
        });
        
        // Update local storage
        const newProp = {
          id: newId,
          name: profile.propertyName || 'Unnamed Property',
          assetType: 'Student Housing',
          totalBeds: profile.totalBeds,
          market: profile.market,
          targetOccupancy: profile.targetOccupancy,
          competitorNames: profile.competitorNames
        };
        const localProps = JSON.parse(localStorage.getItem('asset_signal_properties') || '[]');
        localProps.push(newProp);
        localStorage.setItem('asset_signal_properties', JSON.stringify(localProps));
        
        setSelectedPropertyId(newId);
        propertyId = newId;
        await fetchProperties();
      } catch (e) {
        console.error("Failed to auto-save profile", e);
        alert("Failed to create property profile. Please save the profile manually first.");
        return;
      }
    }
    
    const recordId = uuidv4();
    try {
      await fetch(`/api/properties/${propertyId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordId,
          month: targetMonth,
          revenue: targetFinancials.revenue,
          expenses: targetFinancials.expenses,
          occupancy: (profile.totalBeds > 0 ? (targetPrelease / profile.totalBeds) * 100 : 0),
          preleasedBeds: targetPrelease
        })
      });
      
      if (propertyId) {
        fetchRecords(propertyId);
      }
      fetchPortfolio();

      // Update local storage for persistence
      const occupancyPct = (targetPrelease / (profile.totalBeds || 1)) * 100;
      const newRecord = {
        id: recordId,
        propertyId: propertyId,
        month: targetMonth,
        revenue: targetFinancials.revenue,
        expenses: targetFinancials.expenses,
        occupancy: occupancyPct,
        preleasedBeds: targetPrelease
      };
      const localRecords = JSON.parse(localStorage.getItem('asset_signal_records') || '[]');
      const existingIdx = localRecords.findIndex((r: any) => r.propertyId === propertyId && r.month === targetMonth);
      if (existingIdx !== -1) {
        localRecords[existingIdx] = newRecord;
      } else {
        localRecords.push(newRecord);
      }
      localStorage.setItem('asset_signal_records', JSON.stringify(localRecords));

      addLog("Month Saved", "System", `Financial data for ${targetMonth} saved.`);
      if (!overrideFinancials) {
        alert(`Financial data for ${targetMonth} has been successfully saved.`);
        
        // Only trigger analysis if we don't have a fresh result for today
        if (!result || shouldAutoRefresh(result.lastRefresh)) {
          performAnalysis();
        } else {
          setStep(3); // Go to dashboard with existing result
        }
      }
    } catch (e) {
      console.error("Failed to save month", e);
    }
  };

  const addLog = (action: string, category: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      user: USER_EMAIL,
      action,
      category,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const moveSubcategory = (
    subName: string,
    oldParentName: string,
    newParentName: string,
    type: 'REVENUE' | 'EXPENSES'
  ) => {
    setFinancials(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as FinancialData;
      const section = type === 'REVENUE' ? next.revenue : next.expenses;

      // Find old parent and remove sub
      let subToMove: FinancialCategory | undefined;
      Object.keys(section).forEach(key => {
        const cat = (section as any)[key];
        const standardizedName = CATEGORY_MAP[key] || cat.name;
        if (standardizedName === oldParentName && cat.subcategories) {
          const idx = cat.subcategories.findIndex((s: any) => s.name === subName);
          if (idx !== -1) {
            subToMove = cat.subcategories[idx];
            cat.subcategories.splice(idx, 1);
          }
        }
      });

      // Find new parent and add sub
      if (subToMove) {
        Object.keys(section).forEach(key => {
          const cat = (section as any)[key];
          const standardizedName = CATEGORY_MAP[key] || cat.name;
          if (standardizedName === newParentName) {
            if (!cat.subcategories) cat.subcategories = [];
            cat.subcategories.push(subToMove!);
          }
        });
      }

      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsDataLoaded(false); // Reset data loaded state to prevent useEffect interference
    setQuotaExceeded(false);
    try {
      const { extractedData, uploadKind, contentDetectedMonth } = await extractFinancialDataFromFile(file);
      const resolvedMonth = resolveReportingMonth(extractedData, file.name, { uploadKind, contentDetectedMonth });
      if (!resolvedMonth) {
        throw new Error('Unable to determine month/year from file content or filename. Please rename file with month/year (e.g., 2026-03) and re-upload.');
      }
      setCurrentMonth(resolvedMonth);
      
      const ensureNumber = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Update profile with extracted occupancy stats if found
      if (extractedData.occupancyStats) {
        const total = ensureNumber(extractedData.occupancyStats.totalBeds);
        const preleased = ensureNumber(extractedData.occupancyStats.preleasedBeds) || ensureNumber(extractedData.occupancyStats.occupiedBeds);
        
        setProfile(prev => ({
          ...prev,
          totalBeds: total || prev.totalBeds,
          preleasedBeds: preleased || prev.preleasedBeds
        }));
      }

      const mergeCategory = (initial: FinancialCategory, extracted: any): FinancialCategory => {
        const merged = {
          ...initial,
          currentMonthActual: ensureNumber(extracted.currentMonthActual),
          currentMonthBudget: ensureNumber(extracted.currentMonthBudget),
          actual: ensureNumber(extracted.actual),
          budget: ensureNumber(extracted.budget),
        };

        if (extracted.subcategories && extracted.subcategories.length > 0) {
          merged.subcategories = extracted.subcategories.map((sub: any) => {
            const initialSub = initial.subcategories?.find(s => 
              s.name.toLowerCase() === (sub.name || '').toLowerCase() || 
              (sub.accountCode && s.accountCode === sub.accountCode)
            );
            return {
              ...initialSub,
              name: sub.name || initialSub?.name || 'Unknown Account',
              accountCode: sub.accountCode || initialSub?.accountCode || '',
              currentMonthActual: ensureNumber(sub.currentMonthActual),
              currentMonthBudget: ensureNumber(sub.currentMonthBudget),
              actual: ensureNumber(sub.actual),
              budget: ensureNumber(sub.budget),
            };
          });
        } else if (initial.subcategories) {
          // If AI didn't return subcategories but initial has them, keep them (they will be 0 unless AI returned top level)
          merged.subcategories = initial.subcategories.map(s => ({ ...s }));
        }
        return merged;
      };

      const mergedFinancials: FinancialData = {
        revenue: {
          rentalIncome: mergeCategory(INITIAL_FINANCIALS.revenue.rentalIncome, extractedData.revenue?.rentalIncome || {}),
          otherIncome: mergeCategory(INITIAL_FINANCIALS.revenue.otherIncome, extractedData.revenue?.otherIncome || {}),
        },
        expenses: {
          payroll: mergeCategory(INITIAL_FINANCIALS.expenses.payroll, extractedData.expenses?.payroll || {}),
          repairsMaintenance: mergeCategory(INITIAL_FINANCIALS.expenses.repairsMaintenance, extractedData.expenses?.repairsMaintenance || {}),
          utilities: mergeCategory(INITIAL_FINANCIALS.expenses.utilities, extractedData.expenses?.utilities || {}),
          insurance: mergeCategory(INITIAL_FINANCIALS.expenses.insurance, extractedData.expenses?.insurance || {}),
          propertyManagement: mergeCategory(INITIAL_FINANCIALS.expenses.propertyManagement, extractedData.expenses?.propertyManagement || {}),
          taxes: mergeCategory(INITIAL_FINANCIALS.expenses.taxes, extractedData.expenses?.taxes || {}),
          marketing: mergeCategory(INITIAL_FINANCIALS.expenses.marketing, extractedData.expenses?.marketing || {}),
          admin: mergeCategory(INITIAL_FINANCIALS.expenses.admin, extractedData.expenses?.admin || {}),
          otherOpEx: mergeCategory(INITIAL_FINANCIALS.expenses.otherOpEx, extractedData.expenses?.otherOpEx || {}),
        }
      };

      setFinancials(mergedFinancials);
      setIsDataLoaded(true);
      setStep(2);
      addLog("File Extracted", "System", `Data successfully extracted from ${file.name}.`);
      
      // Auto-save after extraction if property is selected
      if (selectedPropertyId) {
        // We need to use the merged financials directly because setFinancials is async
        saveMonthlyFinancials(mergedFinancials, resolvedMonth, extractedData.occupancyStats?.preleasedBeds || profile.preleasedBeds);
      }
    } catch (error: any) {
      console.error("File upload/extraction failed:", error);
      if (isQuotaError(error)) {
        setQuotaExceeded(true);
        setStep(3); // Go to step 3 so the quota exceeded UI is visible
      } else {
        alert(`Upload failed: ${(error as Error)?.message || 'Unknown error'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleWeeklyTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedPropertyId) return;

    setIsWeeklyImporting(true);
    try {
      let records: Array<Record<string, unknown>> = [];
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        records = parseWeeklyRowsFromCsvText(text);
      } else {
        try {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
          const firstSheet = workbook.SheetNames[0];
          if (!firstSheet) throw new Error('No worksheet found in uploaded file.');
          const ws = workbook.Sheets[firstSheet];
          records = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        } catch (sheetError) {
          const text = await file.text();
          records = parseWeeklyRowsFromCsvText(text);
          if (records.length === 0) {
            throw new Error(
              `Unable to parse file as spreadsheet or CSV. ${
                sheetError instanceof Error ? sheetError.message : String(sheetError)
              }`
            );
          }
        }
      }

      const rows = records
        .map((r) => {
          const keyed = Object.entries(r).reduce<Record<string, unknown>>((acc, [k, v]) => {
            acc[normalizeHeaderKey(k)] = v;
            return acc;
          }, {});
          const week = toISODate(
            keyed.weekendingdate ??
            keyed.weekof ??
            keyed.week ??
            keyed.date
          );
          const preleasedRaw =
            keyed.preleasedbeds ??
            keyed.bedsleased ??
            keyed.preleasebeds ??
            keyed.leasedbeds ??
            keyed.preleased;
          const totalRaw = keyed.totalbeds ?? keyed.totalunits ?? profile.totalBeds;
          const preleasedBeds = Number(preleasedRaw);
          const totalBeds = Number(totalRaw) || profile.totalBeds;
          return { week, preleasedBeds, totalBeds };
        })
        .filter((r) => r.week && Number.isFinite(r.preleasedBeds) && r.preleasedBeds >= 0)
        .map((r) => ({
          propertyExternalId: selectedPropertyId,
          weekEndingDate: r.week as string,
          totalBeds: r.totalBeds,
          preleasedBeds: r.preleasedBeds
        }));

      if (rows.length === 0) {
        throw new Error('No valid weekly rows found. Required columns: weekEndingDate (or week/date), preleasedBeds (or bedsLeased), and optionally totalBeds.');
      }

      const ingestRes = await fetch('/api/ingest/weekly-prelease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSystem: 'demo_excel_upload',
          runId: `ui_${new Date().toISOString().slice(0, 10)}`,
          rows
        })
      });
      const rawText = await ingestRes.text();
      const ingestData = rawText ? JSON.parse(rawText) : {};
      if (!ingestRes.ok) {
        if (ingestRes.status === 404) {
          throw new Error('Weekly ingest endpoint not found. Please restart the dev server (`npm run dev`) to load the latest backend.');
        }
        throw new Error(ingestData?.message || ingestData?.error || 'Weekly ingest failed.');
      }

      await fetchRecords(selectedPropertyId);
      addLog(
        'Weekly Demo Imported',
        'Prelease',
        `Imported ${rows.length} weekly rows (${ingestData.inserted} inserted, ${ingestData.updated} updated).`
      );
      alert(`Weekly import complete: ${ingestData.inserted} inserted, ${ingestData.updated} updated, ${ingestData.rejected} rejected.`);
    } catch (error: any) {
      console.error('Weekly template import failed', error);
      alert(`Weekly template import failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsWeeklyImporting(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePropertyProfile();
  };

  const clearCachedAnalysis = () => {
    if (!selectedPropertyId) {
      alert("Select a property first.");
      return;
    }
    localStorage.removeItem(`asset_signal_analysis_${selectedPropertyId}`);
    setResult(null);
    addLog("Cache Cleared", "System", `Cleared cached analysis for property ID ${selectedPropertyId}.`);
    alert("Cached analysis cleared. Click 'Refresh Data' to run a fresh scan.");
  };

  const computeAverageCompRent = (compIntelligence: any[]): number => {
    const rents: number[] = [];
    for (const comp of compIntelligence || []) {
      if (Array.isArray(comp?.floorplanRanges)) {
        for (const fp of comp.floorplanRanges) {
          const min = Number(fp?.minRent);
          const max = Number(fp?.maxRent);
          if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
            rents.push((min + max) / 2);
          }
        }
      }
    }
    if (rents.length === 0) return 0;
    return rents.reduce((sum, v) => sum + v, 0) / rents.length;
  };

  const persistConcessionSnapshot = async (
    propertyId: string,
    promoCount: number,
    avgRent: number,
    sourceSystem: string
  ) => {
    const snapshotDate = new Date().toISOString().slice(0, 10);
    await fetch(`/api/properties/${propertyId}/concession-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: snapshotDate,
        promoCount,
        avgRent,
        sourceSystem
      })
    });
  };

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    setQuotaExceeded(false);
    addLog("Analysis Triggered", "System", "User confirmed data and triggered Student Housing Intelligence Scrape");
    const competitorNames = profile.competitorNames.filter(Boolean);
    let websiteOnlyCompData: { compIntelligence: any[]; activePromos: any[] } = {
      compIntelligence: competitorNames.map((name, idx) => ({
        id: `comp-fallback-${idx + 1}`,
        name,
        url: getKnownCompetitorUrl(name, profile.competitorUrls) || '',
        currentPromo: "No active concession detected on official website.",
        promoType: "None",
        lastChangeDate: new Date().toISOString().split('T')[0],
        avgRent: 0,
        rentTrend: 0,
        isAlert: false,
        rentRangeSummary: "No floorplan rent range found on official website.",
        floorplanRanges: []
      })),
      activePromos: []
    };
    let persistedTimeline: Array<{ date: string; promoCount: number; avgRent: number }> = concessionHistoryData;
    try {
      const isDemoProperty = !!selectedPropertyId?.startsWith('demo-') || profile.propertyName.toLowerCase().includes('(demo)');
      if (isDemoProperty) {
        websiteOnlyCompData = buildDemoWebsiteCompData(profile);
      } else {
        try {
          const scan = await postJson('/api/comp-scan', {
            competitorNames,
            competitorUrls: profile.competitorUrls || {}
          });
          if (Array.isArray(scan.compIntelligence) && Array.isArray(scan.activePromos)) {
            websiteOnlyCompData = {
              compIntelligence: scan.compIntelligence,
              activePromos: scan.activePromos
            };
          }
        } catch (scanError) {
          console.error("Website comp scan failed:", scanError);
        }
      }

      if (selectedPropertyId) {
        try {
          const normalize = (value: string) =>
            String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          const dedupKey = (promo: any) =>
            `${normalize(promo?.competitorName)}|${normalize(promo?.type)}|${normalize(promo?.text)}`;
          const promoCount = new Set(
            (websiteOnlyCompData.activePromos || [])
              .filter((promo: any) => promo?.status !== 'inactive')
              .filter((promo: any) => !promo?.confidence || promo?.confidence === 'visible_banner')
              .map((promo: any) => dedupKey(promo))
          ).size;
          const avgCompRent = computeAverageCompRent(websiteOnlyCompData.compIntelligence || []);

          await persistConcessionSnapshot(selectedPropertyId, promoCount, avgCompRent, 'market_scan');
          const concessionRes = await fetch(`/api/properties/${selectedPropertyId}/concession-history`);
          if (concessionRes.ok) {
            const concessionRows = await concessionRes.json();
            persistedTimeline = Array.isArray(concessionRows) ? concessionRows : [];
            setConcessionHistoryData(persistedTimeline);
          }
        } catch (historyError) {
          console.error("Failed to persist/fetch concession history", historyError);
        }
      }

      const noi = calculateNOI(financials);
      const noiVariance = noi.actual - noi.budget;
      
      const preleasePct = profile.totalBeds > 0 ? (profile.preleasedBeds / profile.totalBeds) * 100 : 0;
      const preleaseVariance = preleasePct - profile.targetOccupancy;
      const attentionModel = calculateAttentionScore({
        noiActual: noi.actual,
        noiBudget: noi.budget
      });

      // Calculate MoM if prior record exists
      // Filter out the current month if it's already in the records to find the TRUE prior month
      const priorRecords = monthlyRecords.filter(r => r.month < currentMonth).sort((a, b) => b.month.localeCompare(a.month));
      const priorRecord = priorRecords.length > 0 ? priorRecords[0] : null;
      
      let mom: MoMAnalysis | null = null;
      if (priorRecord) {
        const getVal = (cat: any) => {
          if (cat.subcategories && cat.subcategories.length > 0) {
            return cat.subcategories.reduce((sum: number, sub: any) => sum + sub.actual, 0);
          }
          return cat.actual || 0;
        };

        const currentRev = Object.values(financials.revenue).reduce((sum, cat) => sum + getVal(cat), 0);
        const priorRev = Object.values(priorRecord.revenue).reduce((sum, cat) => sum + getVal(cat), 0);
        const currentExp = Object.values(financials.expenses).reduce((sum, cat) => sum + getVal(cat), 0);
        const priorExp = Object.values(priorRecord.expenses).reduce((sum, cat) => sum + getVal(cat), 0);
        const currentNoi = currentRev - currentExp;
        const priorNoi = priorRev - priorExp;

        const revDelta = currentRev - priorRev;
        const revDeltaPct = priorRev !== 0 ? (revDelta / Math.abs(priorRev)) * 100 : 0;
        const noiDelta = currentNoi - priorNoi;
        const noiDeltaPct = priorNoi !== 0 ? (noiDelta / Math.abs(priorNoi)) * 100 : 0;

        mom = {
          revenueDelta: revDelta,
          revenueDeltaPct: revDeltaPct,
          noiDelta: noiDelta,
          noiDeltaPct: noiDeltaPct,
          occupancyDelta: preleasePct - priorRecord.occupancy,
          expenseVariances: Object.keys(financials.expenses).map(key => {
            const cur = getVal(financials.expenses[key as keyof typeof financials.expenses]);
            const pri = getVal(priorRecord.expenses[key as keyof typeof priorRecord.expenses]);
            const delta = cur - pri;
            const deltaPct = pri !== 0 ? (delta / Math.abs(pri)) * 100 : 0;
            return {
              category: financials.expenses[key as keyof typeof financials.expenses].name,
              delta,
              deltaPct,
              isSignificant: Math.abs(deltaPct) > 5
            };
          }),
          isRevenueSignificant: Math.abs(revDeltaPct) > 5,
          isOpexSignificant: Math.abs(noiDeltaPct) > 5 // Simplified for now
        };
      }

      const prompt = `
        You are the Asset Signal Intelligence Engine. 
        Current Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
        
        Analyze this Student Housing asset and its competitors using real-time data.
        Asset Profile: ${JSON.stringify(profile)}
        Financial Context: NOI Variance is ${noiVariance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.
        Prelease Status: ${preleasePct.toFixed(1)}% (Target: ${profile.targetOccupancy}%).
        MoM Context: ${mom ? JSON.stringify(mom) : 'No prior month data available.'}
        WEBSITE-ONLY COMP DATA (authoritative for compIntelligence and activePromos): ${JSON.stringify(websiteOnlyCompData)}

        TASK:
        1. Use WEBSITE-ONLY COMP DATA as the source of truth for comp sections.
        2. Do NOT fabricate competitor websites or promotions.
        3. Generate a historical timeline of promo activity. 
           - The report interval MUST be every Monday of the week starting from August 15th, 2025 until today.
           - For each Monday, provide the promoCount (number of active concessions across all competitors).
        4. Provide probing questions for Asset Managers (AMs) to ask Property Managers (PMs) for 1) increasing revenue and 2) decreasing OpEx. 
           - Do NOT give conclusions or direct commands.
           - Instead, ask investigative questions based on the real-time market data found.
        5. If no verifiable market promo data is available, return empty arrays for activePromos/historicalTimeline and keep compIntelligence conservative.

        Return JSON matching the AnalysisResult interface:
        {
          attentionScore: number (1-10),
          attentionLevel: 'Stable' | 'Moderate' | 'Elevated' | 'Critical',
          preleaseVelocity: { 
            current, target, variance, status: 'Ahead' | 'On Track' | 'Behind',
            history: [{ date: string, beds: number }]
          },
          compIntelligence: [
            { id, name, url: "official website URL", currentPromo, promoType, lastChangeDate, avgRent, rentTrend, isAlert: boolean }
          ],
          activePromos: [
            { id, competitorId, competitorName, url: "direct source link (website or instagram)", type, text, detectedDate, status: 'active' }
          ],
          historicalTimeline: [
            { date: string (YYYY-MM-DD), promoCount: number, avgRent: number }
          ],
          strategy: {
            revenue: string[],
            opex: string[]
          }
        }
      `;

      const aiData = await postJson('/api/ai/analyze', { prompt });
      
      // Ensure data structure is correct
      const finalResult: AnalysisResult = {
        attentionScore: attentionModel.score,
        attentionLevel: attentionModel.level,
        preleaseVelocity: {
          current: preleasePct,
          target: profile.targetOccupancy,
          variance: preleaseVariance,
          status: preleaseVariance > 2 ? 'Ahead' : preleaseVariance < -2 ? 'Behind' : 'On Track',
          history: weeklyPreleaseData.length > 0 
            ? weeklyPreleaseData.map(w => ({ date: w.date, beds: w.bedsLeased }))
            : [{ date: new Date().toISOString().split('T')[0], beds: profile.preleasedBeds }]
        },
        compIntelligence: websiteOnlyCompData.compIntelligence,
        activePromos: websiteOnlyCompData.activePromos,
        historicalTimeline: persistedTimeline.length > 0 ? persistedTimeline : (aiData.historicalTimeline || []),
        mom: dynamicMoM,
        ytdTrend: dynamicYTDTrend,
        strategy: aiData.strategy || { revenue: [], opex: [] },
        lastRefresh: new Date().toISOString()
      };

      setResult(finalResult);
      if (selectedPropertyId) {
        localStorage.setItem(`asset_signal_analysis_${selectedPropertyId}`, JSON.stringify(finalResult));
      }
      setStep(3);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      if (isQuotaError(error)) {
        setQuotaExceeded(true);
      }
      const noi = calculateNOI(financials);
      const preleasePct = profile.totalBeds > 0 ? (profile.preleasedBeds / profile.totalBeds) * 100 : 0;
      const attentionModel = calculateAttentionScore({
        noiActual: noi.actual,
        noiBudget: noi.budget
      });
      const fallbackResult = buildFallbackAnalysis(profile, currentMonth, dynamicMoM, dynamicYTDTrend, weeklyPreleaseData, attentionModel);
      fallbackResult.compIntelligence = websiteOnlyCompData.compIntelligence;
      fallbackResult.activePromos = websiteOnlyCompData.activePromos;
      fallbackResult.historicalTimeline = persistedTimeline.length > 0 ? persistedTimeline : fallbackResult.historicalTimeline;
      setResult(fallbackResult);
      if (selectedPropertyId) {
        localStorage.setItem(`asset_signal_analysis_${selectedPropertyId}`, JSON.stringify(fallbackResult));
      }
      setStep(3);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-brand-line p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/asset-signal-logo.svg"
              alt="Asset Signal Logo"
              className="w-11 h-11 rounded-lg border border-brand-line bg-white object-contain p-1"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-brand-ink">Asset Signal</h1>
              <p className="label-caps">Student Housing Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-brand-ink/5 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'portfolio' ? 'bg-brand-ink text-brand-bg shadow-sm' : 'text-brand-ink/60 hover:text-brand-ink'}`}
            >
              PORTFOLIO
            </button>
            <button 
              onClick={() => setActiveTab('property')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'property' ? 'bg-brand-ink text-brand-bg shadow-sm' : 'text-brand-ink/60 hover:text-brand-ink'}`}
            >
              PROPERTY
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-line bg-white/70 hover:bg-white transition-colors label-caps"
            aria-label="Toggle dark mode"
            title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{themeMode === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </button>
          {activeTab === 'property' && (
            <div className="flex items-center gap-3">
              <label className="label-caps opacity-40">Active Asset:</label>
              <select 
                className="bg-transparent border-b border-brand-line font-bold text-sm focus:border-brand-ink outline-none py-1"
                value={selectedPropertyId || 'new'}
                onChange={(e) => handlePropertySelect(e.target.value)}
              >
                <option value="new">+ Add New Property</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="text-right hidden sm:block">
            <p className="label-caps">System Status</p>
            <p className="text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              OPERATIONAL
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        {apiError && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Deployment Configuration Error</p>
              <p>{apiError}</p>
              <p className="mt-1 opacity-80 text-xs">Note: Vercel standard deployments do not support persistent Node.js servers with SQLite. This app requires a full-stack environment.</p>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'portfolio' ? (
            <motion.div 
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic">Portfolio Dashboard</h2>
                  <p className="text-brand-ink/60">Aggregated intelligence across all managed assets.</p>
                </div>
                <div className="flex gap-8 items-center">
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="label-caps opacity-40">Portfolio NOI</p>
                      <p className="text-2xl font-bold font-mono">
                        {formatCurrency(portfolio.filter(p => !p.noData).reduce((sum, p) => sum + p.noi, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="label-caps opacity-40">Avg Occupancy</p>
                      <p className="text-2xl font-bold font-mono">
                        {portfolio.filter(p => !p.noData).length > 0 
                          ? (portfolio.filter(p => !p.noData).reduce((sum, p) => sum + p.occupancy, 0) / portfolio.filter(p => !p.noData).length).toFixed(1)
                          : '0.0'}%
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsQuickUploadOpen(true)}
                    className="flex items-center gap-2 bg-brand-ink text-brand-bg px-6 py-3 rounded-xl label-caps hover:opacity-90 transition-opacity shadow-lg"
                  >
                    <Upload className="w-4 h-4" /> Add Monthly Data
                  </button>
                </div>
              </section>

              <div className="bg-white border border-brand-line rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-ink/[0.02] border-b border-brand-line">
                      <th className="p-4 label-caps">Property</th>
                      <th className="p-4 label-caps">Month</th>
                      <th className="p-4 label-caps text-right">Revenue</th>
                      <th className="p-4 label-caps text-right">NOI</th>
                      <th className="p-4 label-caps text-right">Occupancy</th>
                      <th className="p-4 label-caps text-right">MoM NOI</th>
                      <th className="p-4 label-caps text-center">Risk</th>
                      <th className="p-4 label-caps text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-brand-ink/40 italic">
                          No property data found. Add a property to begin.
                        </td>
                      </tr>
                    ) : (
                      portfolio.map((p, idx) => (
                        <tr 
                          key={idx} 
                          className="border-b border-brand-line hover:bg-brand-ink/[0.01] transition-colors group"
                        >
                          <td className="p-4 font-bold cursor-pointer" onClick={() => handlePropertySelect(p.propertyId)}>{p.propertyName}</td>
                          <td className="p-4 font-mono text-xs opacity-60">
                            {p.noData ? (
                              <span className="text-rose-500 font-bold uppercase text-[8px]">Pending Upload</span>
                            ) : (
                              p.month || '—'
                            )}
                          </td>
                          <td className="p-4 text-right font-mono text-sm">{formatCurrency(p.revenue || 0)}</td>
                          <td className="p-4 text-right font-mono text-sm font-bold">{formatCurrency(p.noi || 0)}</td>
                          <td className="p-4 text-right font-mono text-sm">{(p.occupancy || 0).toFixed(1)}%</td>
                          <td className={`p-4 text-right font-mono text-sm ${(p.momNoiChange || 0) > 0 ? 'text-emerald-600' : (p.momNoiChange || 0) < 0 ? 'text-rose-600' : ''}`}>
                            {p.noData ? '—' : `${(p.momNoiChange || 0) > 0 ? '+' : ''}${(p.momNoiChange || 0).toFixed(1)}%`}
                          </td>
                          <td className="p-4 text-center">
                            {p.riskFlag && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> RISK
                              </div>
                            )}
                            {p.noData && <span className="opacity-20">—</span>}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePropertySelect(p.propertyId);
                                if (!p.noData) setCurrentMonth(p.month);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink flex items-center gap-1 ml-auto"
                            >
                              {p.noData ? (
                                <><Plus className="w-3 h-3" /> Upload P&L</>
                              ) : (
                                <><RefreshCw className="w-3 h-3" /> View Dashboard</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <div key="property-tab">
              {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {new Date().getDay() === 1 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900 shadow-sm animate-pulse">
                  <Calendar className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm uppercase tracking-wider">Weekly Update Required</p>
                    <p className="text-sm opacity-80">It's Monday! Please ensure <span className="font-bold">Total Beds</span> and <span className="font-bold">Preleased Beds</span> are updated for the current week to maintain accurate velocity tracking.</p>
                  </div>
                </div>
              )}

              <section className="space-y-2">
                <h2 className="text-3xl font-serif italic">Asset Profile Collection</h2>
                <p className="text-brand-ink/60">Define the subject asset and market parameters.</p>
              </section>

              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="label-caps">Property Name</label>
                    <input 
                      required
                      className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                      value={profile.propertyName}
                      onChange={e => setProfile({...profile, propertyName: e.target.value})}
                      placeholder="e.g. The Heights at Parkview"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="label-caps">Total Beds</label>
                      <input 
                        type="number"
                        className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                        value={profile.totalBeds === 0 ? '' : profile.totalBeds}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setProfile({...profile, totalBeds: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label-caps">Preleased Beds</label>
                      <input 
                        type="number"
                        className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                        value={profile.preleasedBeds === 0 ? '' : profile.preleasedBeds}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setProfile({...profile, preleasedBeds: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Target Occupancy %</label>
                    <input 
                      type="number"
                      className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                      value={profile.targetOccupancy === 0 ? '' : profile.targetOccupancy}
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                        setProfile({...profile, targetOccupancy: isNaN(val) ? 0 : val});
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="label-caps">Market (City, State)</label>
                    <input 
                      required
                      className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                      value={profile.market}
                      onChange={e => setProfile({...profile, market: e.target.value})}
                      placeholder="e.g. Austin, TX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Top 5 Competitors & URLs (Optional)</label>
                    <div className="space-y-3">
                      {profile.competitorNames.map((name, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            className="flex-1 bg-transparent border-b border-brand-line py-1 text-sm focus:border-brand-ink outline-none transition-colors"
                            value={name}
                            onChange={e => {
                              const newNames = [...profile.competitorNames];
                              newNames[idx] = e.target.value;
                              setProfile({...profile, competitorNames: newNames});
                            }}
                            placeholder={`Competitor ${idx + 1} Name`}
                          />
                          <input 
                            className="flex-1 bg-transparent border-b border-brand-line py-1 text-[10px] font-mono focus:border-brand-ink outline-none transition-colors opacity-60 focus:opacity-100"
                            value={profile.competitorUrls?.[name] || ''}
                            onChange={e => {
                              const newUrls = { ...(profile.competitorUrls || {}) };
                              newUrls[name] = e.target.value;
                              setProfile({...profile, competitorUrls: newUrls});
                            }}
                            placeholder="Official URL (optional)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-8 flex flex-col gap-4">
                  <button 
                    type="submit"
                    className="w-full bg-brand-ink text-brand-bg py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    SAVE PROPERTY PROFILE <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-brand-line"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-brand-bg px-2 text-brand-ink/40 font-mono">Or automated extraction</span>
                    </div>
                  </div>

                  <label className="w-full border-2 border-dashed border-brand-line rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/50 transition-colors group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <RefreshCw className="w-8 h-8 text-brand-ink animate-spin" />
                    ) : (
                      <FileUp className="w-8 h-8 text-brand-ink/40 group-hover:text-brand-ink transition-colors" />
                    )}
                    <div className="text-center">
                      <p className="font-bold">Upload YTD P&L Statement</p>
                      <p className="text-xs text-brand-ink/60 mt-1">PDF, CSV, Excel, or Image</p>
                    </div>
                    {isUploading && <p className="text-[10px] font-mono animate-pulse">EXTRACTING FINANCIAL SIGNALS...</p>}
                  </label>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 relative"
            >
              <div className="flex justify-between items-end">
                <section className="space-y-2">
                  <h2 className="text-3xl font-serif italic">Monthly Financial Upload</h2>
                  <p className="text-brand-ink/60">Input standardized P&L data for variance analysis.</p>
                </section>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsBulkUploadOpen(true)}
                    className="flex items-center gap-2 bg-brand-ink text-brand-bg px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <FileUp className="w-4 h-4" />
                    <span className="label-caps text-[10px]">Bulk Upload P&Ls</span>
                  </button>
                  <div className="flex items-center gap-6 bg-brand-ink text-brand-bg px-6 py-3 rounded-xl shadow-lg">
                    <div className="flex flex-col">
                      <label className="label-caps text-brand-bg/40 text-[8px]">Reporting Month</label>
                      <div className="flex items-center gap-1">
                        <select 
                          className="bg-transparent font-bold text-sm outline-none cursor-pointer appearance-none"
                          value={currentMonth}
                          onChange={(e) => {
                            setCurrentMonth(e.target.value);
                            setIsDataLoaded(false);
                          }}
                        >
                          {REPORTING_MONTHS.map(m => (
                            <option key={m.value} value={m.value} className="text-brand-ink">{m.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-brand-bg/40" />
                      </div>
                    </div>
                    <div className="w-px h-8 bg-brand-bg/10" />
                    <div className="flex flex-col">
                      <label className="label-caps text-brand-bg/40 text-[8px]">Preleased Beds</label>
                      <input 
                        type="number" 
                        className="bg-transparent font-bold text-sm outline-none w-16"
                        value={profile.preleasedBeds}
                        onChange={(e) => setProfile({...profile, preleasedBeds: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="w-px h-8 bg-brand-bg/10" />
                    <div className="flex flex-col">
                      <label className="label-caps text-brand-bg/40 text-[8px]">Occupancy %</label>
                      <span className="font-bold text-sm">
                        {profile.totalBeds > 0 ? ((profile.preleasedBeds / profile.totalBeds) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 bg-brand-ink/5 hover:bg-brand-ink/10 text-brand-ink px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm border border-brand-line">
                    <FileUp className="w-4 h-4" />
                    <span className="label-caps text-[10px]">Upload P&L</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls" 
                      onChange={(e) => {
                        handleFileUpload(e);
                        e.target.value = '';
                      }}
                      disabled={isUploading}
                    />
                  </label>
                  {isDataLoaded && (
                    <button 
                      onClick={() => {
                        setFinancials(INITIAL_FINANCIALS);
                        setProfile(prev => ({ ...prev, preleasedBeds: 0 }));
                        setIsDataLoaded(false);
                      }}
                      className="label-caps text-[10px] text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Current Data
                    </button>
                  )}
                  <button 
                    onClick={() => setShowLogs(!showLogs)}
                    className={`flex items-center gap-2 label-caps px-3 py-1.5 rounded-full transition-colors ${showLogs ? 'bg-brand-ink text-brand-bg' : 'hover:bg-brand-ink/5'}`}
                  >
                    <History className="w-3 h-3" /> Audit Log {auditLogs.length > 0 && `(${auditLogs.length})`}
                  </button>
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-2 label-caps px-3 py-1.5 rounded-full transition-colors ${isEditMode ? 'bg-emerald-600 text-white' : 'hover:bg-brand-ink/5'}`}
                  >
                    <Edit3 className="w-3 h-3" /> {isEditMode ? 'Finish Editing' : 'Manage Categories'}
                  </button>
                  <button onClick={() => setStep(1)} className="label-caps hover:underline">Edit Profile</button>
                </div>
              </div>

              <AnimatePresence>
                {showLogs && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-brand-ink text-brand-bg rounded-xl overflow-hidden shadow-2xl"
                  >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <h4 className="label-caps text-brand-bg">Manual Adjustment Audit Log</h4>
                      <button onClick={() => setShowLogs(false)}><X className="w-4 h-4" /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
                      {auditLogs.length === 0 ? (
                        <p className="opacity-40 text-center py-4">No manual adjustments recorded.</p>
                      ) : (
                        auditLogs.map((log) => (
                          <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2 last:border-0">
                            <div className="flex flex-col min-w-[80px]">
                              <span className="opacity-40 whitespace-nowrap">{log.timestamp}</span>
                              <span className="text-[8px] opacity-30 truncate">{log.user}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-emerald-400">{log.action}</p>
                              <p><span className="opacity-40">Category:</span> {log.category}</p>
                              <p className="opacity-60 italic">{log.details}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Weekly Prelease Velocity Input */}
              <section className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-brand-line bg-brand-ink/[0.02] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-brand-ink" />
                    <h3 className="text-lg font-bold tracking-tight uppercase">Weekly Prelease Velocity Tracking</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-line text-[10px] font-bold uppercase tracking-widest cursor-pointer ${isWeeklyImporting ? 'opacity-50 pointer-events-none' : 'hover:bg-brand-ink/5'}`}>
                      <Upload className="w-3 h-3" />
                      {isWeeklyImporting ? 'Importing...' : 'Import Weekly Demo File'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleWeeklyTemplateUpload}
                        disabled={isWeeklyImporting || !selectedPropertyId}
                      />
                    </label>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Every Monday since Aug 15, 2025</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {(() => {
                      const mondays = [];
                      let d = new Date('2025-08-15');
                      while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
                      const today = new Date();
                      while (d <= today) {
                        mondays.push(new Date(d).toISOString().split('T')[0]);
                        d.setDate(d.getDate() + 7);
                      }
                      return mondays.reverse().map(date => {
                        const existing = weeklyPreleaseData.find(w => w.date === date);
                        return (
                          <div key={date} className="space-y-1 p-3 bg-brand-ink/[0.02] rounded-lg border border-brand-line">
                            <p className="text-[9px] font-bold opacity-40 uppercase">{new Date(date + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}</p>
                            <input 
                              type="number"
                              placeholder="Beds"
                              value={existing?.bedsLeased || ''}
                              onChange={async (e) => {
                                const val = parseInt(e.target.value) || 0;
                                const id = existing?.id || crypto.randomUUID();
                                
                                // Optimistic update
                                setWeeklyPreleaseData(prev => {
                                  const other = prev.filter(w => w.date !== date);
                                  const updated = [...other, { id, date, bedsLeased: val }];
                                  localStorage.setItem('asset_signal_weekly_prelease', JSON.stringify(updated));
                                  return updated;
                                });

                                try {
                                  await fetch(`/api/properties/${selectedPropertyId}/weekly-prelease`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id, date, bedsLeased: val })
                                  });
                                } catch (err) {
                                  console.error("Failed to save weekly data", err);
                                }
                              }}
                              className="w-full bg-transparent border-b border-brand-ink/10 focus:border-brand-ink outline-none text-sm font-mono font-bold"
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </section>

              <div className="space-y-12 bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
                <div className="p-6 border-b border-brand-line bg-brand-ink/[0.02] flex justify-between items-center">
                  <h3 className="text-lg font-bold tracking-tight uppercase">Standardized P&L Statement</h3>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-brand-ink/60 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Extracting Data...</span>
                    </div>
                  )}
                </div>

                <div className="data-grid">
                  <div className="grid grid-cols-[0.8fr_1.5fr_1fr_1fr_1fr_1fr_1fr] p-4 bg-brand-ink/[0.01] border-b border-brand-line">
                    <span className="label-caps">Account Number</span>
                    <span className="label-caps">Account Name</span>
                    <span className="label-caps">Category</span>
                    <span className="label-caps text-right">Current Month</span>
                    <span className="label-caps text-right">Month Budget</span>
                    <span className="label-caps text-right">YTD Actual</span>
                    <span className="label-caps text-right">YTD Budget</span>
                  </div>

                  {/* Revenue Section */}
                  <div className="p-4 bg-brand-ink/[0.03] border-b border-brand-line">
                    <h4 className="label-caps text-brand-ink font-bold">Revenue</h4>
                  </div>
                  {Object.entries(financials.revenue).map(([key, cat]) => (
                    <CategoryRow 
                      key={key}
                      category={cat}
                      parentType="REVENUE"
                      parentCategoryName={CATEGORY_MAP[key] || cat.name}
                      isEditMode={isEditMode}
                      addLog={addLog}
                      onCategoryChange={(subName, newCat) => {
                        moveSubcategory(subName, CATEGORY_MAP[key] || cat.name, newCat, 'REVENUE');
                        addLog("Category Re-mapped", subName, `Moved from ${CATEGORY_MAP[key] || cat.name} to ${newCat}`);
                      }}
                      onUpdate={(updated) => setFinancials({
                        ...financials,
                        revenue: { ...financials.revenue, [key]: updated }
                      })}
                    />
                  ))}
                  <div className="grid grid-cols-[0.8fr_1.5fr_1fr_1fr_1fr_1fr_1fr] p-4 bg-brand-ink/[0.02] border-b border-brand-line font-bold">
                    <span className="col-span-2">Total Revenue</span>
                    <span></span>
                    <span className="text-right">${Object.values(financials.revenue).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.currentMonthActual, 0) || cat.currentMonthActual), 0).toLocaleString()}</span>
                    <span className="text-right opacity-40">${Object.values(financials.revenue).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.currentMonthBudget, 0) || cat.currentMonthBudget), 0).toLocaleString()}</span>
                    <span className="text-right">${Object.values(financials.revenue).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.actual, 0) || cat.actual), 0).toLocaleString()}</span>
                    <span className="text-right opacity-40">${Object.values(financials.revenue).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.budget, 0) || cat.budget), 0).toLocaleString()}</span>
                  </div>

                  {/* Operating Expenses Section */}
                  <div className="p-4 bg-brand-ink/[0.03] border-b border-brand-line mt-8">
                    <h4 className="label-caps text-brand-ink font-bold">Operating Expenses</h4>
                  </div>
                  {Object.entries(financials.expenses).map(([key, cat]) => (
                    <CategoryRow 
                      key={key}
                      category={cat}
                      parentType="EXPENSES"
                      parentCategoryName={CATEGORY_MAP[key] || cat.name}
                      isEditMode={isEditMode}
                      addLog={addLog}
                      onCategoryChange={(subName, newCat) => {
                        moveSubcategory(subName, CATEGORY_MAP[key] || cat.name, newCat, 'EXPENSES');
                        addLog("Category Re-mapped", subName, `Moved from ${CATEGORY_MAP[key] || cat.name} to ${newCat}`);
                      }}
                      onUpdate={(updated) => setFinancials({
                        ...financials,
                        expenses: { ...financials.expenses, [key]: updated }
                      })}
                    />
                  ))}
                  <div className="grid grid-cols-[0.8fr_1.5fr_1fr_1fr_1fr_1fr_1fr] p-4 bg-brand-ink/[0.02] border-b border-brand-line font-bold">
                    <span className="col-span-2">Total Operating Expenses</span>
                    <span></span>
                    <span className="text-right">${Object.values(financials.expenses).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.currentMonthActual, 0) || cat.currentMonthActual), 0).toLocaleString()}</span>
                    <span className="text-right opacity-40">${Object.values(financials.expenses).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.currentMonthBudget, 0) || cat.currentMonthBudget), 0).toLocaleString()}</span>
                    <span className="text-right">${Object.values(financials.expenses).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.actual, 0) || cat.actual), 0).toLocaleString()}</span>
                    <span className="text-right opacity-40">${Object.values(financials.expenses).reduce((sum, cat) => sum + (cat.subcategories?.reduce((s, sub) => s + sub.budget, 0) || cat.budget), 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-4">
                  {isDataLoaded && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        Existing data found for <strong>{currentMonth}</strong>. Saving will <strong>overwrite</strong> the current record.
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={() => saveMonthlyFinancials()}
                    disabled={isAnalyzing}
                    className="w-full bg-brand-ink text-brand-bg py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>PERFORMING LIVE MARKET SEARCH & ANALYSIS <RefreshCw className="w-4 h-4 animate-spin" /></>
                    ) : (
                      <>{isDataLoaded ? 'RE-UPLOAD & UPDATE' : 'SAVE MONTHLY DATA'} & GENERATE INTELLIGENCE <Target className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>

              {/* Monthly History Section */}
              {monthlyRecords.length > 0 && (
                <section className="mt-12 space-y-4">
                  <h3 className="label-caps opacity-40">Monthly Upload History</h3>
                  <div className="bg-white border border-brand-line rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-ink/[0.02] border-b border-brand-line">
                          <th className="p-3 label-caps text-[10px]">Month</th>
                          <th className="p-3 label-caps text-[10px]">Occupancy</th>
                          <th className="p-3 label-caps text-[10px] text-right">Revenue</th>
                          <th className="p-3 label-caps text-[10px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRecords.map((record) => (
                          <tr key={record.id} className="border-b border-brand-line last:border-0 hover:bg-brand-ink/[0.01]">
                            <td className="p-3 font-mono text-xs">{record.month}</td>
                            <td className="p-3 text-xs">{(record.occupancy || 0).toFixed(1)}%</td>
                            <td className="p-3 text-xs text-right font-mono">{formatCurrency(Object.values(record.revenue).reduce((sum, cat) => sum + (cat.currentMonthActual || 0), 0))}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => setCurrentMonth(record.month)}
                                className="text-[10px] font-bold uppercase text-brand-ink/40 hover:text-brand-ink flex items-center gap-1 ml-auto"
                              >
                                <RefreshCw className="w-3 h-3" /> View Data
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 pb-20"
            >
              {quotaExceeded && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-6 my-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-amber-900 uppercase tracking-tight">API Quota Exceeded</h3>
                    <p className="text-amber-700 max-w-md mx-auto">
                      The OpenAI API quota has been reached. To continue with deep market analysis, update your OPENAI_API_KEY billing/limits.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => performAnalysis()}
                      className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                    >
                      Retry Analysis
                    </button>
                    <a 
                      href="https://platform.openai.com/settings/organization/billing/overview" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-amber-900 border border-amber-200 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-amber-50 transition-all"
                    >
                      Billing Info
                    </a>
                  </div>
                </div>
              )}

              {isAnalyzing && !result && !quotaExceeded && (
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-brand-ink/10 border-t-brand-ink rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-brand-ink animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-serif italic">Analyzing Market Intelligence</h3>
                    <p className="text-brand-ink/40 label-caps text-[10px]">Scraping market data & generating intelligence for {(() => {
                      const [y, m] = currentMonth.split('-').map(Number);
                      return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                    })()}...</p>
                  </div>
                </div>
              )}
              {result && !isAnalyzing && !quotaExceeded && (
                <React.Fragment>
                  {/* Score Header */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-brand-line pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-ink/60">
                    <Building2 className="w-4 h-4" />
                    <span className="label-caps">{profile.propertyName} • {profile.market}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-serif italic">Intelligence Dashboard</h2>
                    <div className="bg-brand-ink text-brand-bg px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-1">
                      YTD {(() => {
                        const [y, m] = currentMonth.split('-').map(Number);
                        return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <label className="label-caps opacity-40 text-[8px]">Market Intelligence</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={clearCachedAnalysis}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink transition-colors"
                      >
                        Clear Cached Analysis
                      </button>
                      <button 
                        onClick={() => performAnalysis()}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-ink/60 hover:text-brand-ink transition-colors disabled:opacity-20"
                      >
                        <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        {result?.lastRefresh ? `Refreshed ${new Date(result.lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refresh Data'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <label className="label-caps opacity-40 text-[8px]">Select Period</label>
                    <select 
                      className="bg-transparent font-bold text-sm outline-none cursor-pointer border-b border-brand-line pb-1"
                      value={currentMonth}
                      onChange={(e) => {
                        setCurrentMonth(e.target.value);
                        setIsDataLoaded(false); // This will trigger the useEffect to load data
                      }}
                    >
                      {Array.from(new Set(monthlyRecords.map(r => r.month)))
                        .sort((a, b) => b.localeCompare(a))
                        .map(month => {
                          const [year, monthNum] = month.split('-').map(Number);
                          const date = new Date(year, monthNum - 1, 1);
                          return (
                            <option key={month} value={month}>
                              {date.toLocaleString('default', { month: 'short', year: 'numeric' })}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div className="w-px h-12 bg-brand-line" />
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 label-caps text-[10px] bg-brand-ink/5 hover:bg-brand-ink/10 px-4 py-2 rounded-lg transition-colors border border-brand-line"
                    >
                      <FileText className="w-3 h-3" /> View Financials
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedUploadMonth(new Date().toISOString().slice(0, 7));
                        setIsUploadMonthModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-brand-ink/5 hover:bg-brand-ink/10 text-brand-ink px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm border border-brand-line"
                    >
                      <FileUp className="w-3 h-3" />
                      <span className="label-caps text-[10px]">Upload P&L</span>
                    </button>
                    <div className="text-right">
                    <p className="label-caps flex items-center justify-end gap-1">
                      <span>Attention Score</span>
                      <button
                        type="button"
                        onClick={() => setShowAttentionInfo(true)}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-brand-line text-brand-ink/70 hover:text-brand-ink hover:border-brand-ink/40 transition-colors"
                        title="How the attention score is calculated"
                        aria-label="Attention score logic"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={`text-4xl font-bold ${
                        result.attentionLevel === 'Critical' ? 'text-red-600' : 
                        result.attentionLevel === 'Elevated' ? 'text-orange-600' : 
                        'text-emerald-600'
                      }`}>{result.attentionScore}</span>
                      <span className="label-caps opacity-40">/ 10</span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg border ${
                    result.attentionLevel === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' : 
                    result.attentionLevel === 'Elevated' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{result.attentionLevel} Risk</p>
                  </div>
                </div>
              </div>
            </div>

              <section className="bg-white p-4 rounded-xl border border-brand-line shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-2 bg-brand-ink/5 p-1 rounded-lg w-fit">
                    <button
                      onClick={() => setViewerSection('financial')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${
                        viewerSection === 'financial' ? 'bg-brand-ink text-brand-bg' : 'text-brand-ink/60 hover:text-brand-ink'
                      }`}
                    >
                      P&L vs Budget
                    </button>
                    <button
                      onClick={() => setViewerSection('leasing')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${
                        viewerSection === 'leasing' ? 'bg-brand-ink text-brand-bg' : 'text-brand-ink/60 hover:text-brand-ink'
                      }`}
                    >
                      Prelease Data
                    </button>
                    <button
                      onClick={() => setViewerSection('market')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${
                        viewerSection === 'market' ? 'bg-brand-ink text-brand-bg' : 'text-brand-ink/60 hover:text-brand-ink'
                      }`}
                    >
                      Market Context
                    </button>
                  </div>

                  <div className="text-xs text-brand-ink/60">
                    {viewerSection === 'financial' && (
                      <p>Cadence: Monthly review. Last P&L update: {latestMonthlyUpdate ? latestMonthlyUpdate.toLocaleString() : 'No monthly upload yet'}</p>
                    )}
                    {viewerSection === 'leasing' && (
                      <p>Cadence: Weekly/Daily review. Last prelease update: {latestLeasingUpdate ? latestLeasingUpdate.toLocaleString() : 'No weekly upload yet'}</p>
                    )}
                    {viewerSection === 'market' && (
                      <p>Cadence: Weekly market scan. Last market refresh: {result?.lastRefresh ? new Date(result.lastRefresh).toLocaleString() : 'No market scan yet'}</p>
                    )}
                  </div>
                </div>
              </section>

              {showAttentionInfo && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                  <div className="w-full max-w-xl bg-white border border-brand-line rounded-2xl shadow-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold">Attention Score Logic</h4>
                      <button
                        type="button"
                        onClick={() => setShowAttentionInfo(false)}
                        className="p-1 rounded hover:bg-brand-ink/5"
                        aria-label="Close attention score details"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-sm text-brand-ink/80 space-y-2">
                      <p>Score range is 1-10. Current formula uses only YTD NOI variance.</p>
                      <p className="text-xs opacity-70 font-mono">Score = 1 + max(0, -NOI Variance % / 3), capped at 10</p>
                      <p className="text-xs opacity-70">If YTD NOI is on or above budget, score stays at 1 (Stable). Deeper negative variance increases risk score.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div className="bg-brand-ink/[0.03] rounded-lg p-3">
                        <p className="label-caps opacity-50">YTD NOI vs Budget</p>
                        <p className="font-mono mt-1">Actual {formatCurrency(attentionBreakdown.metrics.noiActual)}</p>
                        <p className="font-mono">Budget {formatCurrency(attentionBreakdown.metrics.noiBudget)}</p>
                        <p className="font-mono">Variance {formatCurrency(attentionBreakdown.metrics.noiVariance)} ({attentionBreakdown.metrics.noiVariancePct.toFixed(1)}%)</p>
                        <p className="font-mono mt-1">Risk points from NOI variance: +{attentionBreakdown.components.noiVsBudget.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-brand-line pt-4">
                      <p className="label-caps opacity-50">Current Output</p>
                      <p className="font-mono font-bold">Score {result.attentionScore}/10 ({result.attentionLevel})</p>
                    </div>
                  </div>
                </div>
              )}

              {viewerSection === 'financial' && (
              <>
              {/* MoM & YTD Snapshot */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="label-caps opacity-40">Current Month MoM</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">Revenue Delta</p>
                      <p className={`text-xl font-bold font-mono ${dynamicMoM?.revenueDelta || 0 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {dynamicMoM?.revenueDelta || 0 >= 0 ? '+' : ''}{formatCurrency(dynamicMoM?.revenueDelta || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">NOI Delta</p>
                      <p className={`text-xl font-bold font-mono ${dynamicMoM?.noiDelta || 0 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {dynamicMoM?.noiDelta || 0 >= 0 ? '+' : ''}{formatCurrency(dynamicMoM?.noiDelta || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="label-caps opacity-40">YTD Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">YTD Actual NOI</p>
                      <p className={`text-xl font-bold font-mono ${calculateNOI(financials).actual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(calculateNOI(financials).actual)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">YTD Budget NOI</p>
                      <p className={`text-xl font-bold font-mono ${calculateNOI(financials).budget >= 0 ? 'text-emerald-600/40' : 'text-rose-600/40'}`}>
                        {formatCurrency(calculateNOI(financials).budget)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              </>
              )}

              {/* Prelease Velocity Rail */}
              {viewerSection === 'leasing' && (
              <section className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="label-caps flex items-center gap-2">
                    <Target className="w-4 h-4" /> Prelease Velocity
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    currentPreleaseStatus === 'Ahead' ? 'bg-emerald-100 text-emerald-700' :
                    currentPreleaseStatus === 'Behind' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {currentPreleaseStatus}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-brand-ink/40 uppercase font-bold">Current</p>
                        <p className="text-2xl font-bold">{currentPreleasePct.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-brand-ink/40 uppercase font-bold">Target</p>
                        <p className="text-2xl font-bold">{profile.targetOccupancy}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-brand-ink/40 uppercase font-bold">Variance</p>
                        <p className={`text-2xl font-bold ${currentPreleaseVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {currentPreleaseVariance > 0 ? '+' : ''}{currentPreleaseVariance.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-brand-ink/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${currentPreleasePct}%` }}
                        className={`h-full ${currentPreleaseStatus === 'Behind' ? 'bg-red-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                  <div className="h-32">
                    <div className="flex items-center justify-between mb-2">
                      <p className="label-caps opacity-40 text-[10px]">Weekly Prelease Trend</p>
                      <label className={`flex items-center gap-1 px-2 py-1 rounded border border-brand-line text-[9px] font-bold uppercase tracking-widest cursor-pointer ${isWeeklyImporting ? 'opacity-50 pointer-events-none' : 'hover:bg-brand-ink/5'}`}>
                        <Upload className="w-3 h-3" />
                        {isWeeklyImporting ? 'Importing...' : 'Import Demo'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleWeeklyTemplateUpload}
                          disabled={isWeeklyImporting || !selectedPropertyId}
                        />
                      </label>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyVelocitySeries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTickColor, opacity: 0.7 }} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const point = payload[0]?.payload as any;
                            const beds = Number(point?.beds || 0);
                            const absPct = Number(point?.absolutePct || 0);
                            const vBeds = Number(point?.velocityBeds || 0);
                            const vPct = Number(point?.velocityPct || 0);
                            const vSign = vBeds > 0 ? '+' : '';
                            return (
                              <div className="rounded-lg px-4 py-3 space-y-2 shadow-xl text-white" style={{ backgroundColor: chartTooltipBg }}>
                                <p className="text-sm">Week: {label}</p>
                                <p className="text-sm">Beds Leased: {beds} ({absPct.toFixed(1)}%)</p>
                                <p className="text-sm">Weekly Velocity: {vSign}{vBeds} beds ({vSign}{vPct.toFixed(1)}%)</p>
                              </div>
                            );
                          }}
                        />
                        <Line type="monotone" dataKey="velocityBeds" stroke={chartLineColor} strokeWidth={2} dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
              )}

              {/* YTD Trend Chart */}
              {viewerSection === 'financial' && (
              <section className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm">
                <h3 className="label-caps flex items-center gap-2 mb-6">
                  <TrendingUp className="w-4 h-4" /> YTD Financial Trend (Actual vs Budget NOI)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicYTDTrend}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartLineColor} stopOpacity={0.18}/>
                          <stop offset="95%" stopColor={chartLineColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTickColor, opacity: 0.7 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTickColor, opacity: 0.7 }} tickFormatter={(val) => `$${val/1000}k`} />
                      <Tooltip />
                      <Area type="monotone" dataKey="actualNOI" stroke={chartLineColor} fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                      <Area type="monotone" dataKey="budgetNOI" stroke={chartLineColor} strokeDasharray="5 5" fill="none" strokeWidth={1.5} opacity={0.8} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-6 text-[10px] uppercase tracking-widest text-brand-ink/60">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-8 h-[2px] bg-brand-ink" />
                    <span>Actual NOI (Solid)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-8 h-[2px] border-t-2 border-dashed border-brand-ink/70" />
                    <span>Budget NOI (Dotted)</span>
                  </div>
                </div>
              </section>
              )}

              {viewerSection === 'market' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Alerts Feed */}
                <section className="lg:col-span-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="label-caps flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Active Promo Alerts
                    </h3>
                    <button
                      onClick={() => setShowPromoRepeats((prev) => !prev)}
                      className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 hover:text-brand-ink"
                    >
                      {showPromoRepeats ? 'Hide Repeats' : 'Show Repeats'}
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {groupedPromos.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-brand-line shadow-sm space-y-2">
                        <p className="text-sm font-bold leading-tight">No detected alerts from competitor websites.</p>
                        <p className="text-[11px] text-brand-ink/60 leading-relaxed">
                          No detected alerts from the given comps&apos; online resources were found by AI. Ask operators to call the buildings directly to confirm current concessions.
                        </p>
                      </div>
                    ) : groupedPromos.map(({ competitorName, promos }) => (
                      <motion.div 
                        key={competitorName}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-white rounded-xl border border-brand-line shadow-sm space-y-3 relative overflow-hidden group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase text-brand-ink/40">{competitorName}</span>
                          <span className="text-[10px] opacity-40">{promos.length} unique promo{promos.length === 1 ? '' : 's'}</span>
                        </div>
                        {(showPromoRepeats ? promos : promos.slice(0, 1)).map((promo: any) => (
                          <div key={promo.id} className="space-y-2 border-t border-brand-line/60 pt-3 first:border-0 first:pt-0">
                            <div className="flex justify-between items-start gap-3">
                              <p className="text-sm font-bold leading-tight">{promo.text}</p>
                              <span className="text-[10px] font-mono opacity-40 whitespace-nowrap">{promo.detectedDate}</span>
                            </div>
                            {promo.sourceSnippet && (
                              <p className="text-[11px] text-brand-ink/60 leading-relaxed line-clamp-3">
                                Source Snippet: {promo.sourceSnippet}
                              </p>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-brand-ink/5 rounded text-[9px] font-bold uppercase tracking-wider">{promo.type}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  promo.status === 'new'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : promo.status === 'updated'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {promo.status}
                                </span>
                                {promo.repeatCount > 1 && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold uppercase tracking-wider">
                                    Seen {promo.repeatCount}x
                                  </span>
                                )}
                                {promo.confidence && (
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    promo.confidence === 'visible_banner'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {promo.confidence}
                                  </span>
                                )}
                              </div>
                              {(promo.sourceUrl || promo.url) && (
                                <a 
                                  href={(promo.sourceUrl || promo.url).startsWith('http') ? (promo.sourceUrl || promo.url) : `https://${promo.sourceUrl || promo.url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-brand-ink/60 hover:text-brand-ink flex items-center gap-1 transition-colors"
                                >
                                  SHOW DETAIL <ArrowRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-ink opacity-20 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Comp Summary Table */}
                <section className="lg:col-span-2 space-y-4">
                  <h3 className="label-caps flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Competitor Summary
                  </h3>
                  <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
                    <div className="grid grid-cols-4 p-4 bg-brand-ink/[0.02] border-b border-brand-line">
                      <span className="label-caps col-span-1">Competitor</span>
                      <span className="label-caps col-span-3">Floorplan Pricing (Website)</span>
                    </div>
                    {result.compIntelligence.map((comp) => (
                      <div key={comp.id} className="grid grid-cols-4 p-4 items-center border-b border-brand-line last:border-0 hover:bg-brand-ink/[0.01] transition-colors">
                        <div className="col-span-1 flex flex-col pr-3">
                          <span className="font-bold text-sm">{comp.name}</span>
                          <a 
                            href={comp.url.startsWith('http') ? comp.url : `https://${comp.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] opacity-40 truncate hover:opacity-100 transition-opacity hover:text-brand-ink"
                          >
                            {comp.url}
                          </a>
                        </div>
                        <div className="col-span-3 text-xs text-brand-ink/80 leading-relaxed">
                          {Array.isArray(comp.floorplanRanges) && comp.floorplanRanges.length > 0 ? (
                            comp.floorplanRanges.slice(0, 5).map((fp: { name: string; minRent: number; maxRent: number }, idx: number) => (
                              <div key={idx}>
                                <span className="font-semibold">{fp.name}:</span>{' '}
                                <span className="font-mono">
                                  {Number(fp.minRent) === Number(fp.maxRent)
                                    ? `$${Number(fp.minRent).toLocaleString()}`
                                    : `$${Number(fp.minRent).toLocaleString()}-$${Number(fp.maxRent).toLocaleString()}`}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="opacity-50">{comp.rentRangeSummary || 'No floorplan rent range found on official website.'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Historical Timeline */}
                  <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm space-y-6">
                    <h3 className="label-caps">Historical Concession Intensity (count)</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.historicalTimeline}>
                          <defs>
                            <linearGradient id="colorPromo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartLineColor} stopOpacity={0.18}/>
                              <stop offset="95%" stopColor={chartLineColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: chartTooltipBg, border: 'none', borderRadius: '8px', color: '#E2E8F0' }}
                            itemStyle={{ color: '#E4E3E0' }}
                          />
                          <Area type="monotone" dataKey="promoCount" stroke={chartLineColor} fillOpacity={1} fill="url(#colorPromo)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              </div>
              )}

              {/* NOI Loss Drivers */}
              {viewerSection === 'financial' && (
              <>
              <section className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="label-caps flex items-center gap-2 text-rose-600">
                      <AlertTriangle className="w-4 h-4" /> NOI Loss Drivers (GL Red Flags)
                    </h3>
                    <p className="text-xs text-brand-ink/60 mt-1">
                      Ranked in descending order by the largest negative NOI impact.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap md:justify-end">
                    <select
                      className="text-[11px] font-semibold bg-white border border-brand-line rounded-md px-2.5 py-1.5"
                      value={lossViewMode}
                      onChange={(e) => setLossViewMode(e.target.value as 'ytd' | 'month')}
                    >
                      <option value="ytd">Budget YTD vs Actual YTD</option>
                      <option value="month">This Month Budget vs This Month Actual</option>
                    </select>
                    <select
                      className="text-[11px] font-semibold bg-white border border-brand-line rounded-md px-2.5 py-1.5"
                      value={lossRankMetric}
                      onChange={(e) => setLossRankMetric(e.target.value as 'absolute' | 'percent')}
                    >
                      <option value="absolute">Rank by Absolute $</option>
                      <option value="percent">Rank by %</option>
                    </select>
                    <select
                      className="text-[11px] font-semibold bg-white border border-brand-line rounded-md px-2.5 py-1.5"
                      value={lossTopN}
                      onChange={(e) => setLossTopN(Number(e.target.value) as 3 | 5 | 10)}
                    >
                      <option value={3}>Top 3</option>
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                </div>

                {noiLossDrivers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800 text-sm">
                    No material negative NOI drivers detected for the selected comparison view.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-brand-line">
                    <table className="w-full text-xs">
                      <thead className="bg-brand-ink/[0.03] border-b border-brand-line">
                        <tr>
                          <th className="p-3 text-left label-caps">Rank</th>
                          <th className="p-3 text-left label-caps">GL Line</th>
                          <th className="p-3 text-left label-caps">Type</th>
                          <th className="p-3 text-right label-caps">Budget</th>
                          <th className="p-3 text-right label-caps">Actual</th>
                          <th className="p-3 text-right label-caps">NOI Loss ($)</th>
                          <th className="p-3 text-right label-caps">NOI Loss (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {noiLossDrivers.map((line, idx) => (
                          <tr key={`${line.section}-${line.accountCode}-${line.name}-${idx}`} className="border-b border-brand-line/70 last:border-0">
                            <td className="p-3 font-bold text-rose-600">#{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-semibold">{line.name}</div>
                              <div className="opacity-50 font-mono text-[10px]">{line.accountCode || 'N/A'}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                line.section === 'Revenue' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {line.section}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono">{formatCurrency(line.budget)}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(line.actual)}</td>
                            <td className="p-3 text-right font-mono text-rose-600">-{formatCurrency(line.lossAbs)}</td>
                            <td className="p-3 text-right font-mono text-rose-600">{line.lossPct.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Probing Questions for PMs */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm space-y-4">
                  <h3 className="label-caps flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="w-4 h-4" /> Revenue Probing Questions
                  </h3>
                  <ul className="space-y-3">
                    {result.strategy.revenue.map((s, i) => (
                      <li key={i} className="text-sm flex gap-3">
                        <span className="text-emerald-500 font-bold">?</span>
                        <span className="italic text-brand-ink/80">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm space-y-4">
                  <h3 className="label-caps flex items-center gap-2 text-rose-600">
                    <TrendingDown className="w-4 h-4" /> OpEx Probing Questions
                  </h3>
                  <ul className="space-y-3">
                    {result.strategy.opex.map((s, i) => (
                      <li key={i} className="text-sm flex gap-3">
                        <span className="text-rose-500 font-bold">?</span>
                        <span className="italic text-brand-ink/80">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
              </>
              )}

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => {
                    setStep(2);
                    setResult(null);
                  }}
                  className="flex items-center gap-2 label-caps hover:underline"
                >
                  <RefreshCw className="w-4 h-4" /> Upload New Month for Property
                </button>
              </div>
            </React.Fragment>
          )}
        </motion.div>
      )}
    </div>
  )}
</AnimatePresence>
  </main>

          {/* Bulk Upload Progress Overlay */}
          <AnimatePresence>
            {bulkUploadProgress && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-8 right-8 z-50 bg-brand-ink text-brand-bg p-6 rounded-2xl shadow-2xl border border-white/10 w-80"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="label-caps text-brand-bg">Bulk Uploading...</h4>
                  <span className="text-xs font-mono opacity-60">{bulkUploadProgress.current} / {bulkUploadProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    className="bg-emerald-400 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bulkUploadProgress.current / bulkUploadProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono opacity-60 truncate">{bulkUploadProgress.status}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk Upload Modal */}
          <AnimatePresence>
            {isBulkUploadOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsBulkUploadOpen(false)}
                  className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-brand-bg w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-serif italic">Bulk P&L Upload</h3>
                      <button onClick={() => setIsBulkUploadOpen(false)} className="p-2 hover:bg-brand-ink/5 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="p-6 bg-brand-ink/[0.02] rounded-2xl border border-brand-line space-y-4">
                      <div className="flex items-center gap-3 text-brand-ink/60">
                        <Building2 className="w-5 h-5" />
                        <span className="font-bold">{properties.find(p => p.id === selectedPropertyId)?.name || 'Select a property'}</span>
                      </div>
                      <p className="text-sm text-brand-ink/60">Select multiple P&L statements (PDF, Excel, Images). Our AI will extract data for each month and save them automatically to this property.</p>
                    </div>

                    <label className="w-full border-2 border-dashed border-brand-line rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-brand-ink/[0.02] transition-colors group">
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls" 
                        onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                      />
                      <div className="w-16 h-16 bg-brand-ink/5 rounded-full flex items-center justify-center group-hover:bg-brand-ink group-hover:text-brand-bg transition-all">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">Select Files to Upload</p>
                        <p className="text-sm text-brand-ink/60 mt-1">You can select multiple months at once</p>
                      </div>
                    </label>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

      {/* Quick Upload Modal */}
      <AnimatePresence>
        {isQuickUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsQuickUploadOpen(false);
                setQuickUploadAssetId('');
              }}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-brand-bg w-full max-w-md p-8 rounded-2xl shadow-2xl border border-brand-line space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif italic">Quick Monthly Upload</h3>
                <button 
                  onClick={() => {
                    setIsQuickUploadOpen(false);
                    setQuickUploadAssetId('');
                  }} 
                  className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="label-caps">1. Select Asset</label>
                  <select 
                    className="w-full bg-white border border-brand-line p-3 rounded-xl outline-none focus:border-brand-ink transition-colors"
                    value={quickUploadAssetId}
                    onChange={(e) => setQuickUploadAssetId(e.target.value)}
                  >
                    <option value="" disabled>Choose an asset...</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {quickUploadAssetId && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="label-caps">2. Select Month</label>
                    <select 
                      className="w-full bg-white border border-brand-line p-3 rounded-xl outline-none focus:border-brand-ink transition-colors"
                      value={quickUploadMonth}
                      onChange={(e) => setQuickUploadMonth(e.target.value)}
                    >
                      {REPORTING_MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
                
                <button
                  disabled={!quickUploadAssetId}
                  onClick={() => {
                    handlePropertySelect(quickUploadAssetId);
                    setCurrentMonth(quickUploadMonth);
                    setIsDataLoaded(false);
                    setIsQuickUploadOpen(false);
                    setQuickUploadAssetId('');
                  }}
                  className="w-full bg-brand-ink text-brand-bg py-4 rounded-xl font-bold label-caps disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg hover:opacity-90 active:scale-[0.98]"
                >
                  Continue to Upload
                </button>

                <div className="p-4 bg-brand-ink/5 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-brand-ink/40 mt-0.5" />
                  <p className="text-xs text-brand-ink/60 leading-relaxed">
                    Choose the asset and the specific month you want to report for. You'll then be taken to the upload screen to provide the P&L data.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Month Selection Modal */}
      <AnimatePresence>
        {isUploadMonthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadMonthModalOpen(false)}
              className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-brand-bg w-full max-w-md p-8 rounded-2xl shadow-2xl border border-brand-line space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif italic">Upload P&L Statement</h3>
                <button 
                  onClick={() => setIsUploadMonthModalOpen(false)} 
                  className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-brand-ink/[0.02] rounded-xl border border-brand-line">
                  <p className="label-caps opacity-40 text-[8px] mb-1">Target Property</p>
                  <p className="font-bold">{profile.propertyName}</p>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Select Reporting Month</label>
                  <select 
                    className="w-full bg-white border border-brand-line p-3 rounded-xl outline-none focus:border-brand-ink transition-colors"
                    value={selectedUploadMonth}
                    onChange={(e) => setSelectedUploadMonth(e.target.value)}
                  >
                    {REPORTING_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-brand-ink/40 italic">
                    Choose the month this P&L represents. Our AI will also attempt to verify this from the document.
                  </p>
                </div>
                
                <label className="w-full bg-brand-ink text-brand-bg py-4 rounded-xl font-bold label-caps flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:opacity-90 active:scale-[0.98] transition-all">
                  <Upload className="w-4 h-4" />
                  Select P&L File
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls" 
                    onChange={(e) => {
                      setCurrentMonth(selectedUploadMonth);
                      handleFileUpload(e);
                      setIsUploadMonthModalOpen(false);
                      e.target.value = '';
                    }}
                    disabled={isUploading}
                  />
                </label>

                <div className="p-4 bg-brand-ink/5 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-brand-ink/40 mt-0.5" />
                  <p className="text-xs text-brand-ink/60 leading-relaxed">
                    Supported formats: PDF, PNG, JPG, Excel, CSV. The AI will extract financial data and automatically save it to your portfolio.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-brand-line p-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-[10px] font-mono opacity-50">
          <span>Asset Signal v1.0.0</span>
          <span>STUDENT HOUSING INTELLIGENCE ENGINE</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </footer>

      <ChatBot 
        profile={profile} 
        financialData={financials} 
        analysisResult={result}
        onUpdatePreleaseBeds={handleUpdatePreleaseBeds} 
      />
    </div>
  );
}
