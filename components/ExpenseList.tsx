import React, { useState, useMemo, useEffect } from 'react';
import { Expense, CategoryItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency, parseLocalDate } from '../utils';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  categories: CategoryItem[];
}

const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit, categories }) => {
  // Load persistent parameters from localStorage with dynamic fallback
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('spendwise_filter_searchQuery') || '');
  const [selectedBank, setSelectedBank] = useState(() => localStorage.getItem('spendwise_filter_selectedBank') || '');
  const [selectedMonth, setSelectedMonth] = useState(() => localStorage.getItem('spendwise_filter_selectedMonth') || '');
  const [selectedYear, setSelectedYear] = useState(() => localStorage.getItem('spendwise_filter_selectedYear') || '');
  const [filterMode, setFilterMode] = useState<'standard' | 'custom'>(() => (localStorage.getItem('spendwise_filter_filterMode') as 'standard' | 'custom') || 'standard');
  const [customStartDate, setCustomStartDate] = useState(() => localStorage.getItem('spendwise_filter_customStartDate') || '');
  const [customEndDate, setCustomEndDate] = useState(() => localStorage.getItem('spendwise_filter_customEndDate') || '');
  const [activeQuickChip, setActiveQuickChip] = useState<string | null>(() => localStorage.getItem('spendwise_filter_activeQuickChip') || 'all_time');

  const [confirmEditExpense, setConfirmEditExpense] = useState<Expense | null>(null);

  // Sync state variables to localStorage
  useEffect(() => {
    localStorage.setItem('spendwise_filter_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('spendwise_filter_selectedBank', selectedBank);
  }, [selectedBank]);

  useEffect(() => {
    localStorage.setItem('spendwise_filter_selectedMonth', selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    localStorage.setItem('spendwise_filter_selectedYear', selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem('spendwise_filter_filterMode', filterMode);
  }, [filterMode]);

  useEffect(() => {
    localStorage.setItem('spendwise_filter_customStartDate', customStartDate);
  }, [customStartDate]);

  useEffect(() => {
    localStorage.setItem('spendwise_filter_customEndDate', customEndDate);
  }, [customEndDate]);

  useEffect(() => {
    if (activeQuickChip) {
      localStorage.setItem('spendwise_filter_activeQuickChip', activeQuickChip);
    } else {
      localStorage.removeItem('spendwise_filter_activeQuickChip');
    }
  }, [activeQuickChip]);

  // Extract unique bank names
  const uniqueBanks = useMemo(() => {
    const banks = new Set(expenses.map(e => e.bankName).filter((name): name is string => !!name));
    return Array.from(banks).sort();
  }, [expenses]);

  // Extract unique years from expenses
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach(e => {
      if (e.date) {
        const yr = e.date.split('-')[0];
        if (yr && yr.length === 4) {
          years.add(yr);
        }
      }
    });
    // Always append current year and previous year for convenience
    const currentYear = new Date().getFullYear();
    years.add(String(currentYear));
    years.add(String(currentYear - 1));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  // Combined Filtering Pipeline
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // 1. Description or Bank Text Search Match
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.bankName && expense.bankName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 2. Specific Bank Match
      const matchesBank = selectedBank ? expense.bankName === selectedBank : true;

      // 3. Date / Time Period Match
      let matchesDate = true;
      if (filterMode === 'custom') {
        if (customStartDate && expense.date < customStartDate) {
          matchesDate = false;
        }
        if (customEndDate && expense.date > customEndDate) {
          matchesDate = false;
        }
      } else {
        // Standard Dropdowns Mode
        const dateParts = expense.date.split('-');
        if (selectedMonth !== '' && dateParts[1]) {
          const expMonth = parseInt(dateParts[1], 10) - 1; // 0-indexed month
          if (expMonth !== parseInt(selectedMonth, 10)) {
            matchesDate = false;
          }
        }
        if (selectedYear !== '' && dateParts[0]) {
          const expYear = parseInt(dateParts[0], 10);
          if (expYear !== parseInt(selectedYear, 10)) {
            matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesBank && matchesDate;
    });
  }, [expenses, searchQuery, selectedBank, filterMode, customStartDate, customEndDate, selectedMonth, selectedYear]);

  // Sort chronological descending
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredExpenses]);

  // Period Analysis Metrics
  const summaryStats = useMemo(() => {
    const totalTransactions = filteredExpenses.length;
    const totalSpending = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageTransaction = totalTransactions > 0 ? (totalSpending / totalTransactions) : 0;
    const highestTransaction = totalTransactions > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0;

    return {
      totalTransactions,
      totalSpending,
      averageTransaction,
      highestTransaction
    };
  }, [filteredExpenses]);

  // Text representation of the filtered scope
  const showingPeriodString = useMemo(() => {
    if (filterMode === 'custom') {
      if (customStartDate && customEndDate) {
        const startStr = parseLocalDate(customStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const endStr = parseLocalDate(customEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${startStr} to ${endStr}`;
      } else if (customStartDate) {
        const startStr = parseLocalDate(customStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `From ${startStr}`;
      } else if (customEndDate) {
        const endStr = parseLocalDate(customEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `Until ${endStr}`;
      }
      return 'Custom Range';
    } else {
      const hasMonth = selectedMonth !== '';
      const hasYear = selectedYear !== '';
      
      if (hasMonth && hasYear) {
        const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
        return `${monthName} ${selectedYear}`;
      } else if (hasMonth) {
        const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
        return `${monthName} (All Years)`;
      } else if (hasYear) {
        return `Year ${selectedYear}`;
      }
      return 'All Time';
    }
  }, [filterMode, customStartDate, customEndDate, selectedMonth, selectedYear]);

  // Apply Quick Period presets
  const applyQuickFilter = (type: 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'all_time') => {
    const today = new Date();
    
    const localFormat = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (type === 'this_month') {
      setFilterMode('standard');
      setSelectedMonth(String(today.getMonth()));
      setSelectedYear(String(today.getFullYear()));
      setCustomStartDate('');
      setCustomEndDate('');
    } else if (type === 'last_month') {
      setFilterMode('standard');
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      setSelectedMonth(String(d.getMonth()));
      setSelectedYear(String(d.getFullYear()));
      setCustomStartDate('');
      setCustomEndDate('');
    } else if (type === 'last_3_months') {
      setFilterMode('custom');
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      const startStr = localFormat(start);
      const endStr = localFormat(today);
      setCustomStartDate(startStr);
      setCustomEndDate(endStr);
    } else if (type === 'last_6_months') {
      setFilterMode('custom');
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      const startStr = localFormat(start);
      const endStr = localFormat(today);
      setCustomStartDate(startStr);
      setCustomEndDate(endStr);
    } else if (type === 'this_year') {
      setFilterMode('standard');
      setSelectedMonth('');
      setSelectedYear(String(today.getFullYear()));
      setCustomStartDate('');
      setCustomEndDate('');
    } else if (type === 'all_time') {
      setFilterMode('standard');
      setSelectedMonth('');
      setSelectedYear('');
      setSelectedBank('');
      setSearchQuery('');
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || '#94a3b8';
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No expenses tracked yet.</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add your first expense to see it here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Filters Top Bar */}
        <div className="px-5 py-4 md:px-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-850 dark:text-slate-200">Recent Transactions</h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {filteredExpenses.length} Filtered ({expenses.length} total)
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search description..."
                className="block w-full pl-10 pr-10 py-3 md:py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveQuickChip(null);
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setActiveQuickChip(null);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bank Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4v3H3V7z" />
                </svg>
              </div>
              <select
                value={selectedBank}
                onChange={(e) => {
                  setSelectedBank(e.target.value);
                  setActiveQuickChip(null);
                }}
                className="appearance-none block w-full pl-10 pr-10 py-3 md:py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="">All Banks</option>
                {uniqueBanks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Month Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
                </svg>
              </div>
              <select
                value={selectedMonth}
                disabled={filterMode === 'custom'}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setFilterMode('standard');
                  setActiveQuickChip(null);
                }}
                className="appearance-none disabled:opacity-50 block w-full pl-10 pr-10 py-3 md:py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="">All Months</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  <polyline points="12 6 12 12 16 14" strokeWidth={2} />
                </svg>
              </div>
              <select
                value={selectedYear}
                disabled={filterMode === 'custom'}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setFilterMode('standard');
                  setActiveQuickChip(null);
                }}
                className="appearance-none disabled:opacity-50 block w-full pl-10 pr-10 py-3 md:py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="">All Years</option>
                {uniqueYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Filter Chips list */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mr-1.5">Preset:</span>
            <button
              type="button"
              onClick={() => { applyQuickFilter('this_month'); setActiveQuickChip('this_month'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeQuickChip === 'this_month'
                  ? 'bg-purple-600 border-transparent text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => { applyQuickFilter('last_month'); setActiveQuickChip('last_month'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeQuickChip === 'last_month'
                  ? 'bg-purple-600 border-transparent text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => { applyQuickFilter('last_3_months'); setActiveQuickChip('last_3_months'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeQuickChip === 'last_3_months'
                  ? 'bg-purple-600 border-transparent text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Last 3 Months
            </button>
            <button
              type="button"
              onClick={() => { applyQuickFilter('last_6_months'); setActiveQuickChip('last_6_months'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeQuickChip === 'last_6_months'
                  ? 'bg-purple-600 border-transparent text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              onClick={() => { applyQuickFilter('this_year'); setActiveQuickChip('this_year'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeQuickChip === 'this_year'
                  ? 'bg-purple-600 border-transparent text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              This Year
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMode = filterMode === 'custom' ? 'standard' : 'custom';
                setFilterMode(nextMode);
                setActiveQuickChip(nextMode === 'custom' ? 'custom' : null);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                filterMode === 'custom'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Custom Range 📅
            </button>
            <button
              type="button"
              onClick={() => { applyQuickFilter('all_time'); setActiveQuickChip('all_time'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeQuickChip === 'all_time'
                  ? 'bg-purple-600 border-transparent text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Custom Date Range Picker Block */}
          {filterMode === 'custom' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-1 duration-200">
              <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-widest shrink-0">
                Custom Range Parameters:
              </span>
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setActiveQuickChip(null);
                    }}
                  />
                </div>
                <span className="text-slate-400 dark:text-slate-600 text-xs font-bold font-mono">to</span>
                <div className="relative flex-1">
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setActiveQuickChip(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Summary Card */}
        <div className="px-5 py-4 md:px-6 bg-slate-50/40 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block leading-none">
                Filtered Scope Analytics
              </span>
              <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                Showing: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{showingPeriodString}</span>
                {selectedBank && (
                  <span className="text-slate-500 dark:text-slate-400 font-medium"> at {selectedBank}</span>
                )}
              </h4>
            </div>

            {(searchQuery || selectedBank || selectedMonth || selectedYear || customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBank('');
                  setSelectedMonth('');
                  setSelectedYear('');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setFilterMode('standard');
                  setActiveQuickChip('all_time');
                }}
                className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center md:self-end self-start"
              >
                Clear Filters ✕
              </button>
            )}
          </div>

          {/* Stats Quad Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-widest leading-none">Transactions</span>
              <p className="text-base md:text-lg font-black font-mono mt-1 text-slate-800 dark:text-slate-100 leading-none">
                {summaryStats.totalTransactions}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm animate-pulse-once">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-widest leading-none">Total Spending</span>
              <p className="text-base md:text-lg font-black font-mono mt-1 text-purple-600 dark:text-purple-400 leading-none">
                {formatCurrency(summaryStats.totalSpending)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-widest leading-none">Average</span>
              <p className="text-base md:text-lg font-black font-mono mt-1 text-slate-800 dark:text-slate-100 leading-none">
                {formatCurrency(summaryStats.averageTransaction)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase block tracking-widest leading-none">Highest Spend</span>
              <p className="text-base md:text-lg font-black font-mono mt-1 text-indigo-600 dark:text-indigo-400 leading-none">
                {formatCurrency(summaryStats.highestTransaction)}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions List View */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
          {sortedExpenses.length > 0 ? (
            sortedExpenses.map((expense) => {
              const color = getCategoryColor(expense.category);
              return (
                <div key={expense.id} className="group flex items-center px-4 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="ml-3 md:ml-4 flex-1 overflow-hidden">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 truncate flex items-center text-sm md:text-base">
                      {expense.description}
                      {expense.receiptImage && (
                        <svg className="w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <title>Receipt Attached</title>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-0.5 md:mt-1 gap-y-1">
                      <span className="flex items-center">
                        <span className="mr-1 inline-block" style={{ color: color }}>
                          <div className="scale-[0.6] w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">{getCategoryIcon(expense.category)}</div>
                        </span>
                        <span className="font-medium text-slate-500 dark:text-slate-400">{expense.category}</span>
                      </span>
                      {expense.bankName && (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="text-indigo-500 dark:text-indigo-400 font-bold">{expense.bankName}</span>
                        </>
                      )}
                      <span className="mx-1.5 hidden xs:inline">•</span>
                      <span className="w-full xs:w-auto mt-0.5 xs:mt-0">{parseLocalDate(expense.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end pl-2">
                    <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base">-{formatCurrency(expense.amount)}</p>
                    {/* Actions: Visible on Mobile, Hover on Desktop */}
                    <div className="flex items-center space-x-2 mt-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setConfirmEditExpense(expense)}
                        className="p-2.5 md:p-1 bg-indigo-50 md:bg-transparent rounded-xl md:rounded-lg text-indigo-600 md:text-indigo-500 hover:text-indigo-700 dark:bg-indigo-900/50 dark:md:bg-transparent dark:text-indigo-400"
                        title="Edit"
                        aria-label="Edit"
                      >
                         <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                         <span className="hidden md:inline text-[10px] font-bold uppercase tracking-tight">Edit</span>
                      </button>
                      <button 
                        onClick={() => onDelete(expense.id)}
                        className="p-2.5 md:p-1 bg-red-50 md:bg-transparent rounded-xl md:rounded-lg text-red-500 md:text-red-400 hover:text-red-600 dark:bg-red-900/40 dark:md:bg-transparent dark:text-red-400"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="hidden md:inline text-[10px] font-bold uppercase tracking-tight">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-6">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                No matching transactions found.
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try resetting or adjusting your active filter parameters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Edit */}
      {confirmEditExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Edit Transaction?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Are you sure you want to modify "{confirmEditExpense.description}"?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmEditExpense(null)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onEdit(confirmEditExpense);
                    setConfirmEditExpense(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  Edit Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseList;
