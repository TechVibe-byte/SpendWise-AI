
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Expense, CategoryItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '../utils';

interface DashboardProps {
  expenses: Expense[];
  categories: CategoryItem[];
  monthlyBudget: number;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, categories, monthlyBudget }) => {
  const isDark = window.document.documentElement.classList.contains('dark');
  const [spendingView, setSpendingView] = useState<'monthly' | 'overall'>('monthly');
  
  const getCategoryColor = (name: string) => {
    const nameLower = name.trim().toLowerCase();
    const explicitMap: Record<string, string> = {
      'food & dining': '#FF6B6B',
      'transportation': '#4D96FF',
      'shopping': '#FFC93C',
      'entertainment': '#A66CFF',
      'bills & utilities': '#2DD4BF',
      'health & wellness': '#FF7AA2',
      'loan expenses': '#64748B',
      'emi expenses': '#818CF8',
      'borrow expenses': '#F97316',
      'investment': '#10B981',
      'credit card bill': '#EF4444',
      'credit bill': '#EF4444',
      'credit rupay bill': '#8B5CF6',
      'gadget': '#06B6D4',
      'other': '#94A3B8',
      'others': '#94A3B8',
    };
    if (explicitMap[nameLower]) {
      return explicitMap[nameLower];
    }
    return categories.find(c => c.name.toLowerCase() === nameLower)?.color || '#94a3b8';
  };

  const totalSpent = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0), 
  [expenses]);

  const currentMonthSpent = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;
    
    return expenses
      .filter(e => e.date.startsWith(monthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const budgetUtilization = useMemo(() => {
    if (monthlyBudget <= 0) return 0;
    return (currentMonthSpent / monthlyBudget) * 100;
  }, [currentMonthSpent, monthlyBudget]);

  const budgetColor = useMemo(() => {
    if (budgetUtilization >= 100) return 'bg-red-500 dark:bg-red-600';
    if (budgetUtilization >= 90) return 'bg-orange-500 dark:bg-orange-600';
    if (budgetUtilization >= 75) return 'bg-amber-500 dark:bg-amber-600';
    if (budgetUtilization >= 50) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-emerald-500 dark:bg-emerald-600';
  }, [budgetUtilization]);

  const budgetBadgeColor = useMemo(() => {
    if (budgetUtilization >= 100) return 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/40';
    if (budgetUtilization >= 90) return 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40';
    if (budgetUtilization >= 75) return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
    if (budgetUtilization >= 50) return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/40';
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
  }, [budgetUtilization]);

  const categoryData = useMemo(() => {
    // Get all unique categories present in expenses
    const usedCategories = Array.from(new Set(expenses.map(e => e.category))) as string[];
    
    const data = usedCategories.map(catName => ({
      name: catName,
      value: expenses.filter(e => e.category === catName).reduce((sum, e) => sum + e.amount, 0),
      color: getCategoryColor(catName)
    })).filter(d => d.value > 0);
    return data;
  }, [expenses, categories]);

  const chartCategoryData = useMemo(() => {
    if (categoryData.length === 0) return [];
    
    // Sort categoryData by value descending
    const sorted = [...categoryData].sort((a, b) => b.value - a.value);
    
    if (sorted.length <= 5) {
      return sorted;
    }
    
    // Top 5
    const top5 = sorted.slice(0, 5);
    // Remaining
    const remaining = sorted.slice(5);
    const remainingValue = remaining.reduce((sum, item) => sum + item.value, 0);
    
    top5.push({
      name: 'Others',
      value: remainingValue,
      color: '#94A3B8'
    });
    
    return top5;
  }, [categoryData]);

  const chartTotal = useMemo(() => {
    return chartCategoryData.reduce((sum, item) => sum + item.value, 0);
  }, [chartCategoryData]);

  const largestCategoryIndex = useMemo(() => {
    if (chartCategoryData.length === 0) return -1;
    let maxVal = -1;
    let idx = -1;
    for (let i = 0; i < chartCategoryData.length; i++) {
      if (chartCategoryData[i].value > maxVal) {
        maxVal = chartCategoryData[i].value;
        idx = i;
      }
    }
    return idx;
  }, [chartCategoryData]);

  const dailyData = useMemo(() => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      amount: expenses
        .filter(e => e.date === date)
        .reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [expenses]);

  // Calculate 30-day averages per category
  const categoryAverages30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const usedCategories = Array.from(new Set(recentExpenses.map(e => e.category))) as string[];

    return usedCategories.map(catName => {
      const totalInCategory = recentExpenses
        .filter(e => e.category === catName)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        category: catName,
        total: totalInCategory,
        average: totalInCategory / 30,
        color: getCategoryColor(catName)
      };
    }).filter(item => item.total > 0)
      .sort((a, b) => b.average - a.average);
  }, [expenses, categories]);

  const bankData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const bankMap = new Map<string, number>();
    
    recentExpenses.forEach(e => {
      if (e.bankName) {
        const current = bankMap.get(e.bankName) || 0;
        bankMap.set(e.bankName, current + e.amount);
      }
    });

    return Array.from(bankMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="relative bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between overflow-hidden min-h-[148px] md:min-h-[158px]">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_: any, info: any) => {
              if (info.offset.x < -40) {
                setSpendingView('overall');
              } else if (info.offset.x > 40) {
                setSpendingView('monthly');
              }
            }}
            className="flex-1 cursor-grab active:cursor-grabbing select-none touch-pan-y"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={spendingView}
                initial={{ opacity: 0, x: spendingView === 'monthly' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: spendingView === 'monthly' ? 20 : -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">
                    {spendingView === 'monthly' ? 'Monthly Spending' : 'Total Spending'}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center">
                    {spendingView === 'monthly' ? 'Monthly' : 'Overall'}
                  </span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(spendingView === 'monthly' ? currentMonthSpent : totalSpent)}
                </h3>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <div>
              {spendingView === 'monthly' ? (
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-semibold">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
              ) : (
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs font-semibold">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Overall history
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setSpendingView('monthly')}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${spendingView === 'monthly' ? 'bg-indigo-600 dark:bg-indigo-400 scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`}
                aria-label="View Monthly Spending"
              />
              <button
                type="button"
                onClick={() => setSpendingView('overall')}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${spendingView === 'overall' ? 'bg-emerald-600 dark:bg-emerald-400 scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`}
                aria-label="View Overall Spending"
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[148px] md:min-h-[158px]">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Monthly Budget</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${budgetBadgeColor}`}>
                {budgetUtilization.toFixed(1)}% used
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(monthlyBudget)}</h3>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium">
                {formatCurrency(currentMonthSpent)} spent
              </p>
              <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium">
                {currentMonthSpent > monthlyBudget 
                  ? `Over by ${formatCurrency(currentMonthSpent - monthlyBudget)}`
                  : `${formatCurrency(monthlyBudget - currentMonthSpent)} left`
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 sm:col-span-2 md:col-span-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Highest Category</p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1 truncate">
            {categoryData.length > 0 
              ? [...categoryData].sort((a, b) => b.value - a.value)[0].name.split(' ')[0]
              : 'N/A'}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs mt-4 italic">Updated just now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 text-sm md:text-base">Spending Trend (Last 30 Days)</h4>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  minTickGap={15}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={40} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 text-sm md:text-base">Distribution</h4>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-8 flex-1">
            {/* Donut Chart with center overlay */}
            <div className="w-full sm:w-1/2 h-48 flex items-center justify-center relative select-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {chartCategoryData.map((entry, index) => {
                      const isLargest = index === largestCategoryIndex;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke={isLargest ? (isDark ? '#ffffff' : '#0f172a') : 'none'}
                          strokeWidth={isLargest ? 3 : 0}
                          style={{ outline: 'none' }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Spent']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">Total</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(chartTotal)}</span>
              </div>
            </div>

            {/* Custom Responsive Legend with percentages & exact values */}
            <div className="w-full sm:w-1/2">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                {chartCategoryData.map((entry, index) => {
                  const pct = chartTotal > 0 ? ((entry.value / chartTotal) * 100).toFixed(1) : '0.0';
                  const isLargest = index === largestCategoryIndex;
                  return (
                    <div 
                      key={`legend-${index}`} 
                      className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all duration-300 ${isLargest ? 'bg-indigo-50/40 dark:bg-slate-800/60 border-indigo-100/50 dark:border-slate-800 ring-1 ring-indigo-500/10' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="min-w-0 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate leading-tight">
                            {entry.name}
                          </span>
                          {isLargest && (
                            <span className="text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
                              Top
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                            {pct}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono">
                            {formatCurrency(entry.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bank Breakdown Section */}
      {bankData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 text-sm md:text-base">Bank Breakdown (Last 30 Days)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={bankData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: isDark ? '#e2e8f0' : '#475569', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 30-Day Averages Section */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold text-sm md:text-base">30-Day Category Averages</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">Daily Burn Rate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {categoryAverages30Days.length > 0 ? (
            categoryAverages30Days.map((item) => (
              <div key={item.category} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{item.category}</p>
                   <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.average)}/day</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Not enough data for 30-day averages yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
