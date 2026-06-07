import React, { useMemo, useState } from 'react';
import { Income, Expense } from '../types';
import { formatCurrency, parseLocalDate } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

interface IncomeManagerProps {
  incomes: Income[];
  expenses: Expense[];
  initialBalances: { [bank: string]: number };
  onAddIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
  onEditIncome: (income: Income) => void;
  openForm: () => void;
}

const IncomeManager: React.FC<IncomeManagerProps> = ({
  incomes,
  expenses,
  initialBalances,
  onAddIncome,
  onDeleteIncome,
  onEditIncome,
  openForm
}) => {
  const isDark = window.document.documentElement.classList.contains('dark');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBank, setFilterBank] = useState<string>('all');

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => {
      const matchesCategory = filterCategory === 'all' || inc.category === filterCategory;
      const matchesBank = filterBank === 'all' || inc.bankName === filterBank;
      return matchesCategory && matchesBank;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, filterCategory, filterBank]);

  // All categories present
  const availableCategories = useMemo(() => {
    return Array.from(new Set(incomes.map(i => i.category)));
  }, [incomes]);

  // All banks present
  const availableBanks = useMemo(() => {
    return Array.from(new Set(incomes.map(i => i.bankName)));
  }, [incomes]);

  // Total Income
  const totalIncomeAmount = useMemo(() => {
    return incomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, [incomes]);

  // Filter out salaries specifically
  const salariesOnly = useMemo(() => {
    return incomes
      .filter(inc => inc.category === 'Salary')
      .sort((a, b) => a.date.localeCompare(b.date)); // Chronological order for growth
  }, [incomes]);

  // Salary historical progression list & stats (Requirement 12)
  const salaryProgressStats = useMemo(() => {
    if (salariesOnly.length === 0) {
      return {
        growthPercent: 0,
        highestMonthStr: 'N/A',
        highestAmt: 0,
        avgIncome: 0,
        yearlyIncome: 0,
        monthsData: []
      };
    }

    const monthsData = salariesOnly.map(s => {
      const mLabel = s.salaryMonth || parseLocalDate(s.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return {
        monthLabel: mLabel,
        amount: s.amount,
        bonus: s.bonus || 0,
        total: s.amount + (s.bonus || 0),
        date: s.date
      };
    });

    // Calculate growth % (First vs Latest salary)
    const firstSal = salariesOnly[0].amount;
    const latestSal = salariesOnly[salariesOnly.length - 1].amount;
    const growthPercent = firstSal > 0 ? ((latestSal - firstSal) / firstSal) * 100 : 0;

    // Highest salary credit (including bonus if bundled)
    const sortedByTotal = [...monthsData].sort((a, b) => b.total - a.total);
    const highestMonthStr = sortedByTotal[0]?.monthLabel || 'N/A';
    const highestAmt = sortedByTotal[0]?.total || 0;

    // Average monthly income over logged instances
    const avgIncome = incomes.length > 0 ? totalIncomeAmount / Math.max(salariesOnly.length, 1) : 0;
    
    // Yearly projected/total
    const yearlyIncome = incomes.reduce((sum, inc) => {
      // Sum incomes of calendar year 2026 or latest general
      return sum + inc.amount;
    }, 0);

    return {
      growthPercent,
      highestMonthStr,
      highestAmt,
      avgIncome,
      yearlyIncome,
      monthsData
    };
  }, [salariesOnly, incomes, totalIncomeAmount]);

  // Donut chart of Income Source Breakdown
  const sourceBreakdownData = useMemo(() => {
    const rawMap: { [cat: string]: number } = {};
    incomes.forEach(inc => {
      rawMap[inc.category] = (rawMap[inc.category] || 0) + inc.amount;
    });

    return Object.entries(rawMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [incomes]);

  const COLORS = ['#10B981', '#06B6D4', '#2DD4BF', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Income & Cash Flow</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Salary progress, parent/spouse transfers, and balance growth analytics</p>
        </div>
        <button
          onClick={openForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl flex items-center space-x-2 text-sm shadow-lg shadow-emerald-100 dark:shadow-none transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          <span>Record Income Credit</span>
        </button>
      </div>

      {/* Salary growth trend indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Year Income */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/10 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Income (All Time)</span>
            <h3 className="text-2xl font-black text-emerald-650 dark:text-emerald-400 mt-1 font-mono">
              {formatCurrency(totalIncomeAmount)}
            </h3>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Includes salary, gifts, freelance & ref
          </div>
        </div>

        {/* Highest Salary Month */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/10 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Highest Salary Month</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {salaryProgressStats.highestMonthStr}
            </h3>
          </div>
          <div className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 font-mono mt-2">
            Peak: {formatCurrency(salaryProgressStats.highestAmt)}
          </div>
        </div>

        {/* Salary Growth rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/10 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Salary Growth %</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {salaryProgressStats.growthPercent >= 0 ? '+' : ''}{salaryProgressStats.growthPercent.toFixed(1)}%
            </h3>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center">
            {salaryProgressStats.growthPercent > 0 ? (
              <span className="text-emerald-600 font-bold">Excellent incremental hike progress!</span>
            ) : (
              <span>Earliest vs latest logging difference</span>
            )}
          </div>
        </div>

        {/* Avg Credit Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150/10 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Avg Monthly Income</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {formatCurrency(salaryProgressStats.avgIncome)}
            </h3>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Average over logged months
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Progression Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h4 className="text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base">Salary Credit History</h4>
              <p className="text-xs text-slate-400">Progression scale of base pay + active bonuses</p>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#10b981] bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Salary growth</span>
          </div>

          <div className="h-64">
            {salaryProgressStats.monthsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryProgressStats.monthsData}>
                  <defs>
                    <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis 
                    dataKey="monthLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10}} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={50} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Income']}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#salaryGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                No salary progress tracked yet. Add entries under "Salary" to see progression.
              </div>
            )}
          </div>
        </div>

        {/* Income Source Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="mb-5">
            <h4 className="text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base">Income Source Breakdown</h4>
            <p className="text-xs text-slate-400">Where your absolute revenue is generated from</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1">
            <div className="w-full sm:w-1/2 h-44 relative flex items-center justify-center">
              {sourceBreakdownData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sourceBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Total Amount']}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#f1f5f9' : '#1e293b',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-[10px] font-bold text-slate-400">Total Credits</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono mt-0.5">
                      {formatCurrency(totalIncomeAmount)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-xs flex items-center justify-center h-full">
                  No income entries logged
                </div>
              )}
            </div>

            {/* List breakdown */}
            <div className="w-full sm:w-1/2 space-y-2 max-h-48 overflow-y-auto pr-1">
              {sourceBreakdownData.slice(0, 5).map((entry, idx) => {
                const pct = totalIncomeAmount > 0 ? ((entry.value / totalIncomeAmount) * 100).toFixed(1) : '0';
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-bold text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white mr-2">{formatCurrency(entry.value)}</span>
                      <span className="text-slate-400 text-[10px] font-medium">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Income Records Ledger / Transaction History */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h4 className="text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base">Income Credit Ledger</h4>
            <p className="text-xs text-slate-400">Showing historic credits and corresponding account balances</p>
          </div>

          {/* Filtering row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category selection */}
            <select
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Category: All</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Bank account filter */}
            <select
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
            >
              <option value="all">Account: All</option>
              {availableBanks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger transaction rows */}
        <div className="overflow-hidden">
          <AnimatePresence mode="popLayout">
            {filteredIncomes.length > 0 ? (
              <div className="space-y-3.5">
                {filteredIncomes.map((inc) => (
                  <motion.div
                    key={inc.id}
                    layoutId={inc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150/10 dark:border-slate-805/40 hover:border-emerald-500/20 dark:hover:border-emerald-500/10 transition-all flex items-center justify-between gap-4"
                  >
                    {/* Visual icon representation */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[170px] sm:max-w-xs">{inc.description}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-black tracking-normal uppercase bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-transparent dark:text-emerald-450 rounded-md">
                            {inc.category}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                          <span className="bg-slate-100 dark:bg-slate-805 px-1 rounded truncate max-w-[120px]">{inc.bankName}</span>
                          <span>•</span>
                          <span>{parseLocalDate(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          
                          {inc.isSalary && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400">Employer: {inc.employerName} ({inc.salaryMonth})</span>
                            </>
                          )}

                          {inc.bonus && (
                            <>
                              <span>•</span>
                              <span className="text-amber-650 dark:text-amber-400 font-extrabold">Bonus credit included: {formatCurrency(inc.bonus)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Funds and modification buttons */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-450">+{formatCurrency(inc.amount)}</span>
                      
                      {/* Flow status */}
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono mt-0.5 block">
                        Bal: {formatCurrency(inc.previousBalance || 0)} → {formatCurrency(inc.currentBalance || 0)}
                      </span>

                      {/* Operation action shortcuts */}
                      <div className="flex items-center space-x-2.5 mt-2">
                        <button
                          onClick={() => onEditIncome(inc)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
                          title="Edit credit entry"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this income transaction? Since budget calculations and bank statements depend on it!')) {
                              onDeleteIncome(inc.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete credit entry"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-sm">
                No income transactions matched the criteria. Click "Record Income Credit" above to begin.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IncomeManager;
