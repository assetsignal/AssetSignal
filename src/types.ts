export interface FinancialCategory {
  name: string;
  accountCode?: string;
  currentMonthActual: number;
  currentMonthBudget: number;
  actual: number;
  budget: number;
  subcategories?: FinancialCategory[];
}

export interface FinancialData {
  revenue: {
    rentalIncome: FinancialCategory;
    otherIncome: FinancialCategory;
  };
  expenses: {
    payroll: FinancialCategory;
    repairsMaintenance: FinancialCategory;
    utilities: FinancialCategory;
    insurance: FinancialCategory;
    propertyManagement: FinancialCategory;
    taxes: FinancialCategory;
    marketing: FinancialCategory;
    admin: FinancialCategory;
    otherOpEx: FinancialCategory;
  };
}

export type AssetType = 'Student Housing';

export interface AssetProfile {
  propertyName: string;
  totalBeds: number;
  preleasedBeds: number;
  targetOccupancy: number;
  market: string;
  competitorNames: string[];
}

export interface FloorPlan {
  name: string;
  subjectRent: number;
  comps: {
    name: string;
    rent: number;
  }[];
}

export interface AuditLogEntry {
  id: string;
  user: string;
  timestamp: string;
  action: string;
  category: string;
  details: string;
}

export interface CompPromo {
  id: string;
  competitorId: string;
  competitorName: string;
  url?: string;
  type: 'Gift Card' | 'Free Month' | 'Fee Waiver' | 'Price Drop' | 'Urgency Marketing';
  text: string;
  detectedDate: string;
  status: 'active' | 'inactive';
}

export interface CompIntelligence {
  id: string;
  name: string;
  url: string;
  currentPromo: string;
  promoType: string;
  lastChangeDate: string;
  avgRent: number;
  rentTrend: number;
  isAlert: boolean;
}

export interface Property {
  id: string;
  name: string;
  assetType: 'Student Housing';
  totalBeds: number;
  market: string;
  targetOccupancy: number;
  competitorNames: string[];
  createdAt: string;
}

export interface MonthlyRecord {
  id: string;
  propertyId: string;
  month: string; // YYYY-MM
  revenue: FinancialData['revenue'];
  expenses: FinancialData['expenses'];
  occupancy: number;
  preleasedBeds: number;
  uploadedAt: string;
}

export interface MoMAnalysis {
  revenueDelta: number;
  revenueDeltaPct: number;
  noiDelta: number;
  noiDeltaPct: number;
  occupancyDelta: number;
  expenseVariances: {
    category: string;
    delta: number;
    deltaPct: number;
    isSignificant: boolean;
  }[];
  isRevenueSignificant: boolean;
  isOpexSignificant: boolean;
}

export interface AnalysisResult {
  attentionScore: number;
  attentionLevel: 'Stable' | 'Moderate' | 'Elevated' | 'Critical';
  preleaseVelocity: {
    current: number;
    target: number;
    variance: number;
    status: 'Ahead' | 'On Track' | 'Behind';
    history: { date: string; beds: number }[];
  };
  compIntelligence: CompIntelligence[];
  activePromos: CompPromo[];
  historicalTimeline: {
    date: string;
    promoCount: number;
    avgRent: number;
  }[];
  mom: MoMAnalysis | null;
  ytdTrend: {
    month: string;
    actualNOI: number;
    budgetNOI: number;
  }[];
  strategy: {
    revenue: string[];
    opex: string[];
  };
}
