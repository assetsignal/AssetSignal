/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
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
  AlertTriangle
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
import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from 'xlsx';
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

const USER_EMAIL = "sara.sun.ai0221@gmail.com";

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  
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
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
    fetchProperties();
    fetchPortfolio();
  }, []);

  // Load existing data when month or property changes
  React.useEffect(() => {
    if (selectedPropertyId && currentMonth && monthlyRecords.length > 0) {
      const existing = monthlyRecords.find(r => r.month === currentMonth);
      if (existing) {
        setFinancials({
          revenue: existing.revenue,
          expenses: existing.expenses
        });
        setProfile(prev => ({
          ...prev,
          preleasedBeds: existing.preleasedBeds || 0
        }));
        setIsDataLoaded(true);
      } else {
        // Only reset if we were previously showing loaded data
        if (isDataLoaded) {
          setFinancials(INITIAL_FINANCIALS);
          setProfile(prev => ({
            ...prev,
            preleasedBeds: 0
          }));
          setIsDataLoaded(false);
        }
      }
    }
  }, [currentMonth, selectedPropertyId, monthlyRecords, isDataLoaded]);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      setProperties(data);
    } catch (e) {
      console.error("Failed to fetch properties", e);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      setPortfolio(data);
    } catch (e) {
      console.error("Failed to fetch portfolio", e);
    }
  };

  const fetchRecords = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/records`);
      const data = await res.json();
      setMonthlyRecords(data);
    } catch (e) {
      console.error("Failed to fetch records", e);
    }
  };

  const handlePropertySelect = (id: string) => {
    if (id === 'new') {
      setSelectedPropertyId(null);
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
      setProfile({
        propertyName: prop.name,
        totalBeds: prop.totalBeds,
        preleasedBeds: 0, // Will be filled from latest record
        targetOccupancy: prop.targetOccupancy,
        market: prop.market,
        competitorNames: prop.competitorNames
      });
      fetchRecords(id);
      setStep(2);
      setActiveTab('property');
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
      fetchProperties();
      addLog("Profile Saved", "System", `Property profile for ${profile.propertyName} updated.`);
      setStep(2);
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  const saveMonthlyFinancials = async () => {
    if (!selectedPropertyId) return;
    
    const recordId = uuidv4();
    try {
      await fetch(`/api/properties/${selectedPropertyId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordId,
          month: currentMonth,
          revenue: financials.revenue,
          expenses: financials.expenses,
          occupancy: (profile.totalBeds > 0 ? (profile.preleasedBeds / profile.totalBeds) * 100 : 0),
          preleasedBeds: profile.preleasedBeds
        })
      });
      
      fetchRecords(selectedPropertyId);
      fetchPortfolio();
      addLog("Month Saved", "System", `Financial data for ${currentMonth} saved.`);
      performAnalysis();
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
    try {
      let contentPart: any;

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const reader = new FileReader();
        const arrayBufferPromise = new Promise<ArrayBuffer>((resolve) => {
          reader.onload = () => resolve(reader.result as ArrayBuffer);
        });
        reader.readAsArrayBuffer(file);
        const buffer = await arrayBufferPromise;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        
        contentPart = { text: `Here is the financial data from an Excel file in CSV format:\n\n${csvContent}` };
      } else {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;
        
        contentPart = {
          inlineData: {
            data: base64Data,
            mimeType: file.type || "application/pdf"
          }
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          contentPart,
          {
            text: "Extract the financial data from this P&L statement. You MUST extract values for every account and subcategory. Return a JSON object matching this structure: { revenue: { rentalIncome: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, otherIncome: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] } }, expenses: { payroll: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, repairsMaintenance: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, utilities: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, insurance: { currentMonthActual, currentMonthBudget, actual, budget }, propertyManagement: { currentMonthActual, currentMonthBudget, actual, budget }, taxes: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, marketing: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, admin: { currentMonthActual, currentMonthBudget, actual, budget, subcategories: [{accountCode, name, currentMonthActual, currentMonthBudget, actual, budget}] }, otherOpEx: { currentMonthActual, currentMonthBudget, actual, budget } } }. IMPORTANT: Ensure all values are NUMBERS, not strings. If a value is missing, use 0. 'actual' and 'budget' refer to YTD values. If you find sub-line items for a category, include them in 'subcategories'."
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const extractedData = JSON.parse(response.text || '{}');
      
      const ensureNumber = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

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
    } catch (error) {
      console.error("File upload/extraction failed:", error);
      alert("Failed to extract data from file. Please ensure it's a clear P&L statement.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePropertyProfile();
  };

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

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    addLog("Analysis Triggered", "System", "User confirmed data and triggered Student Housing Intelligence Scrape");
    try {
      const noi = calculateNOI(financials);
      const noiVariance = noi.actual - noi.budget;
      
      const preleasePct = profile.totalBeds > 0 ? (profile.preleasedBeds / profile.totalBeds) * 100 : 0;
      const preleaseVariance = preleasePct - profile.targetOccupancy;

      // Calculate MoM if prior record exists
      const sortedRecords = [...monthlyRecords].sort((a, b) => b.month.localeCompare(a.month));
      const priorRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;
      
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

        TASK:
        1. Use Google Search to find the official websites and current leasing specials for these 5 competitors: ${profile.competitorNames.join(', ')}.
        2. Detect REAL, currently active concessions, promotional banners, and pricing shifts.
        3. Classify promos into: Gift Card, Free Month, Fee Waiver, Price Drop, Urgency Marketing.
        4. Generate a historical timeline of promo activity leading up to today (use search results to infer recent changes).
        5. Provide probing questions for Asset Managers (AMs) to ask Property Managers (PMs) for 1) increasing revenue and 2) decreasing OpEx. 
           - Do NOT give conclusions or direct commands.
           - Instead, ask investigative questions based on the real-time market data found.
        6. Generate a YTD trend data (Jan to current month).

        Return JSON matching the AnalysisResult interface:
        {
          attentionScore: number (1-10),
          attentionLevel: 'Stable' | 'Moderate' | 'Elevated' | 'Critical',
          preleaseVelocity: { 
            current, target, variance, status: 'Ahead' | 'On Track' | 'Behind',
            history: [{ date: string, beds: number }]
          },
          compIntelligence: [
            { id, name, url, currentPromo, promoType, lastChangeDate, avgRent, rentTrend, isAlert: boolean }
          ],
          activePromos: [
            { id, competitorId, competitorName, url, type, text, detectedDate, status: 'active' }
          ],
          historicalTimeline: [
            { date, promoCount, avgRent }
          ],
          ytdTrend: [
            { month: string, actualNOI: number, budgetNOI: number }
          ],
          strategy: {
            revenue: string[],
            opex: string[]
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });

      const aiData = JSON.parse(response.text || '{}');
      
      // Ensure data structure is correct
      const finalResult: AnalysisResult = {
        attentionScore: aiData.attentionScore || 5,
        attentionLevel: aiData.attentionLevel || 'Moderate',
        preleaseVelocity: {
          current: preleasePct,
          target: profile.targetOccupancy,
          variance: preleaseVariance,
          status: preleaseVariance > 2 ? 'Ahead' : preleaseVariance < -2 ? 'Behind' : 'On Track',
          history: aiData.preleaseVelocity?.history || []
        },
        compIntelligence: aiData.compIntelligence || [],
        activePromos: aiData.activePromos || [],
        historicalTimeline: aiData.historicalTimeline || [],
        mom,
        ytdTrend: aiData.ytdTrend || [],
        strategy: aiData.strategy || { revenue: [], opex: [] }
      };

      setResult(finalResult);
      setStep(3);
    } catch (error) {
      console.error("Analysis failed:", error);
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
            <div className="w-10 h-10 bg-brand-ink rounded-lg flex items-center justify-center">
              <BarChart3 className="text-brand-bg w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ASSET SIGNAL</h1>
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
                <div className="flex gap-8 text-right">
                  <div>
                    <p className="label-caps opacity-40">Portfolio NOI</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(portfolio.reduce((sum, p) => sum + p.noi, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="label-caps opacity-40">Avg Occupancy</p>
                    <p className="text-2xl font-bold font-mono">
                      {(portfolio.reduce((sum, p) => sum + p.occupancy, 0) / (portfolio.length || 1)).toFixed(1)}%
                    </p>
                  </div>
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
                          <td className="p-4 font-mono text-xs opacity-60">{p.month}</td>
                          <td className="p-4 text-right font-mono text-sm">{formatCurrency(p.revenue)}</td>
                          <td className="p-4 text-right font-mono text-sm font-bold">{formatCurrency(p.noi)}</td>
                          <td className="p-4 text-right font-mono text-sm">{p.occupancy.toFixed(1)}%</td>
                          <td className={`p-4 text-right font-mono text-sm ${p.momNoiChange > 0 ? 'text-emerald-600' : p.momNoiChange < 0 ? 'text-rose-600' : ''}`}>
                            {p.momNoiChange > 0 ? '+' : ''}{p.momNoiChange.toFixed(1)}%
                          </td>
                          <td className="p-4 text-center">
                            {p.riskFlag && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> RISK
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePropertySelect(p.propertyId);
                                setCurrentMonth(p.month);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink flex items-center gap-1 ml-auto"
                            >
                              <RefreshCw className="w-3 h-3" /> Re-upload
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
                        value={profile.totalBeds}
                        onChange={e => setProfile({...profile, totalBeds: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label-caps">Preleased Beds</label>
                      <input 
                        type="number"
                        className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                        value={profile.preleasedBeds}
                        onChange={e => setProfile({...profile, preleasedBeds: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Target Occupancy %</label>
                    <input 
                      type="number"
                      className="w-full bg-transparent border-b border-brand-line py-2 focus:border-brand-ink outline-none transition-colors"
                      value={profile.targetOccupancy}
                      onChange={e => setProfile({...profile, targetOccupancy: parseInt(e.target.value) || 0})}
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
                    <label className="label-caps">Top 5 Competitors</label>
                    <div className="space-y-2">
                      {profile.competitorNames.map((name, idx) => (
                        <input 
                          key={idx}
                          className="w-full bg-transparent border-b border-brand-line py-1 text-sm focus:border-brand-ink outline-none transition-colors"
                          value={name}
                          onChange={e => {
                            const newNames = [...profile.competitorNames];
                            newNames[idx] = e.target.value;
                            setProfile({...profile, competitorNames: newNames});
                          }}
                          placeholder={`Competitor ${idx + 1}`}
                        />
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
                  <div className="flex items-center gap-2 bg-brand-ink text-brand-bg px-4 py-2 rounded-lg shadow-sm">
                    <label className="label-caps text-brand-bg/60 text-[10px]">Uploading For:</label>
                    <input 
                      type="month" 
                      className="bg-transparent font-bold text-sm outline-none cursor-pointer"
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(e.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-2 bg-brand-ink/5 hover:bg-brand-ink/10 text-brand-ink px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm border border-brand-line">
                    <FileUp className="w-4 h-4" />
                    <span className="label-caps text-[10px]">Re-upload P&L</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls" 
                      onChange={handleFileUpload}
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
                    onClick={saveMonthlyFinancials}
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
                            <td className="p-3 text-xs">{record.occupancy.toFixed(1)}%</td>
                            <td className="p-3 text-xs text-right font-mono">{formatCurrency(Object.values(record.revenue).reduce((sum, cat) => sum + (cat.currentMonthActual || 0), 0))}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => setCurrentMonth(record.month)}
                                className="text-[10px] font-bold uppercase text-brand-ink/40 hover:text-brand-ink flex items-center gap-1 ml-auto"
                              >
                                <RefreshCw className="w-3 h-3" /> Re-upload
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

          {step === 3 && result && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 pb-20"
            >
              {/* Score Header */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-brand-line pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-ink/60">
                    <Building2 className="w-4 h-4" />
                    <span className="label-caps">{profile.propertyName} • {profile.market}</span>
                  </div>
                  <h2 className="text-4xl font-serif italic">Intelligence Dashboard</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="label-caps">Attention Score</p>
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

              {/* MoM & YTD Snapshot */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="label-caps opacity-40">Current Month MoM</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">Revenue Delta</p>
                      <p className={`text-xl font-bold font-mono ${result.mom?.revenueDelta || 0 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {result.mom?.revenueDelta || 0 >= 0 ? '+' : ''}{formatCurrency(result.mom?.revenueDelta || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">NOI Delta</p>
                      <p className={`text-xl font-bold font-mono ${result.mom?.noiDelta || 0 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {result.mom?.noiDelta || 0 >= 0 ? '+' : ''}{formatCurrency(result.mom?.noiDelta || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="label-caps opacity-40">YTD Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">YTD Actual NOI</p>
                      <p className="text-xl font-bold font-mono">
                        {formatCurrency(calculateNOI(financials).actual)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-brand-line shadow-sm space-y-1">
                      <p className="label-caps opacity-40 text-[10px]">YTD Budget NOI</p>
                      <p className="text-xl font-bold font-mono opacity-40">
                        {formatCurrency(calculateNOI(financials).budget)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Prelease Velocity Rail */}
              <section className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="label-caps flex items-center gap-2">
                    <Target className="w-4 h-4" /> Prelease Velocity
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    result.preleaseVelocity.status === 'Ahead' ? 'bg-emerald-100 text-emerald-700' :
                    result.preleaseVelocity.status === 'Behind' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {result.preleaseVelocity.status}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-brand-ink/40 uppercase font-bold">Current</p>
                        <p className="text-2xl font-bold">{result.preleaseVelocity.current.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-brand-ink/40 uppercase font-bold">Target</p>
                        <p className="text-2xl font-bold">{result.preleaseVelocity.target}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-brand-ink/40 uppercase font-bold">Variance</p>
                        <p className={`text-2xl font-bold ${result.preleaseVelocity.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {result.preleaseVelocity.variance > 0 ? '+' : ''}{result.preleaseVelocity.variance.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-brand-ink/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.preleaseVelocity.current}%` }}
                        className={`h-full ${result.preleaseVelocity.status === 'Behind' ? 'bg-red-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>
                  <div className="h-32">
                    <p className="label-caps opacity-40 text-[10px] mb-2">Weekly Prelease Trend</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.preleaseVelocity.history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="beds" stroke="#141414" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* YTD Trend Chart */}
              <section className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm">
                <h3 className="label-caps flex items-center gap-2 mb-6">
                  <TrendingUp className="w-4 h-4" /> YTD Financial Trend (Actual vs Budget NOI)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.ytdTrend}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#141414', opacity: 0.4 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#141414', opacity: 0.4 }} tickFormatter={(val) => `$${val/1000}k`} />
                      <Tooltip />
                      <Area type="monotone" dataKey="actualNOI" stroke="#141414" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                      <Area type="monotone" dataKey="budgetNOI" stroke="#141414" strokeDasharray="5 5" fill="none" strokeWidth={1} opacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Alerts Feed */}
                <section className="lg:col-span-1 space-y-4">
                  <h3 className="label-caps flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Active Promo Alerts
                  </h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {result.activePromos.map((promo) => (
                      <motion.div 
                        key={promo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-white rounded-xl border border-brand-line shadow-sm space-y-2 relative overflow-hidden group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase text-brand-ink/40">{promo.competitorName}</span>
                          <span className="text-[10px] font-mono opacity-40">{promo.detectedDate}</span>
                        </div>
                        <p className="text-sm font-bold leading-tight">{promo.text}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 bg-brand-ink/5 rounded text-[9px] font-bold uppercase tracking-wider">{promo.type}</span>
                          {promo.url && (
                            <a 
                              href={promo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-brand-ink/60 hover:text-brand-ink flex items-center gap-1 transition-colors"
                            >
                              SHOW DETAIL <ArrowRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
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
                    <div className="grid grid-cols-5 p-4 bg-brand-ink/[0.02] border-b border-brand-line">
                      <span className="label-caps col-span-2">Competitor</span>
                      <span className="label-caps">Current Promo</span>
                      <span className="label-caps text-right">Avg Rent</span>
                      <span className="label-caps text-right">Trend</span>
                    </div>
                    {result.compIntelligence.map((comp) => (
                      <div key={comp.id} className="grid grid-cols-5 p-4 items-center border-b border-brand-line last:border-0 hover:bg-brand-ink/[0.01] transition-colors">
                        <div className="col-span-2 flex flex-col">
                          <span className="font-bold text-sm">{comp.name}</span>
                          <span className="text-[10px] opacity-40 truncate">{comp.url}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium truncate">{comp.currentPromo || 'None Detected'}</span>
                          <span className="text-[9px] opacity-40 uppercase">{comp.promoType}</span>
                        </div>
                        <span className="text-right font-mono text-sm">${comp.avgRent.toLocaleString()}</span>
                        <div className={`text-right font-mono text-xs flex items-center justify-end gap-1 ${comp.rentTrend > 0 ? 'text-emerald-600' : comp.rentTrend < 0 ? 'text-red-600' : 'opacity-40'}`}>
                          {comp.rentTrend > 0 ? <TrendingUp className="w-3 h-3" /> : comp.rentTrend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                          {comp.rentTrend !== 0 ? `${Math.abs(comp.rentTrend)}%` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Historical Timeline */}
                  <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm space-y-6">
                    <h3 className="label-caps">Historical Concession Intensity</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.historicalTimeline}>
                          <defs>
                            <linearGradient id="colorPromo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E3E0" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '8px', color: '#E4E3E0' }}
                            itemStyle={{ color: '#E4E3E0' }}
                          />
                          <Area type="monotone" dataKey="promoCount" stroke="#141414" fillOpacity={1} fill="url(#colorPromo)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              </div>

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
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  </main>

      {/* Footer */}
      <footer className="border-t border-brand-line p-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-[10px] font-mono opacity-40">
          <span>ASSET SIGNAL v1.0.0</span>
          <span>STUDENT HOUSING INTELLIGENCE ENGINE</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  );
}
