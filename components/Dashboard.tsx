import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { Smartphone, Download, X } from 'lucide-react';
import { Expense, CategoryItem, Income, BudgetRuleType, Account, Transfer } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency, parseLocalDate } from '../utils';

interface DashboardProps {
  expenses: Expense[];
  incomes: Income[];
  categories: CategoryItem[];
  monthlyBudget: number; // manual budget
  budgetRuleType: BudgetRuleType;
  budgetRulePercentage: number;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transfers: Transfer[];
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  showInstallBtn?: boolean;
  isStandalone?: boolean;
  handleInstallClick?: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  expenses, 
  incomes, 
  categories, 
  monthlyBudget,
  budgetRuleType,
  budgetRulePercentage,
  accounts,
  setAccounts,
  transfers,
  setTransfers,
  showInstallBtn = false,
  isStandalone = false,
  handleInstallClick
}) => {
  const isDark = window.document.documentElement.classList.contains('dark');
  const [distView, setDistView] = useState<'monthly' | 'yearly' | 'overall'>('monthly');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<'income_expense' | 'savings_trend' | 'balance_trend'>('income_expense');

  // Swipeable statistics carousel states
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0); // -1 for left, 1 for right

  // PWA banner dismiss state
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('spendwise_install_banner_dismissed') === 'true';
  });

  const handleDismissBanner = () => {
    localStorage.setItem('spendwise_install_banner_dismissed', 'true');
    setIsBannerDismissed(true);
  };

  // Money transfer states
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [showTransferForm, setShowTransferForm] = useState(false);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!transferFromId || !transferToId || isNaN(amt) || amt <= 0) {
      alert('Please fill in complete coordinates and valid positive amount.');
      return;
    }

    if (transferFromId === transferToId) {
      alert('Source and destination accounts must be distinct!');
      return;
    }

    const srcAcc = bankBalancesData.accounts.find(a => a.id === transferFromId);
    if (srcAcc && srcAcc.balance < amt) {
      if (!confirm(`Warning: Selected source "${srcAcc.name}" has an active balance of ₹${srcAcc.balance}, which is lower than the transfer amount of ₹${amt}. Proceed with internal overdraft?`)) {
        return;
      }
    }

    const newTransfer: Transfer = {
      id: Math.random().toString(36).substr(2, 9),
      fromAccountId: transferFromId,
      toAccountId: transferToId,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      description: transferDesc.trim() || 'Internal Account Transfer'
    };

    setTransfers(prev => [...prev, newTransfer]);
    setTransferAmount('');
    setTransferDesc('');
    setShowTransferForm(false);
    alert('Internal account transfer completed successfully!');
  };

  // Month definition helpers
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentYearPrefix = useMemo(() => {
    return String(new Date().getFullYear());
  }, []);

  // 1. Current Month figures
  const currentMonthIncome = useMemo(() => {
    return incomes
      .filter(i => i.date.startsWith(currentMonthPrefix))
      .reduce((sum, i) => sum + i.amount, 0);
  }, [incomes, currentMonthPrefix]);

  const currentMonthSpent = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonthPrefix]);

  // Total overall metrics
  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const overallNet = totalIncome - totalSpent;

  // Monthly Savings and Savings Rate
  const currentMonthSavings = currentMonthIncome - currentMonthSpent;
  const currentMonthSavingsRate = useMemo(() => {
    if (currentMonthIncome <= 0) return 0;
    return (currentMonthSavings / currentMonthIncome) * 100;
  }, [currentMonthIncome, currentMonthSavings]);

  const lastMonthPrefix = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const lastMonthIncome = useMemo(() => {
    return incomes
      .filter(i => i.date.startsWith(lastMonthPrefix))
      .reduce((sum, i) => sum + i.amount, 0);
  }, [incomes, lastMonthPrefix]);

  const lastMonthSpent = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(lastMonthPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, lastMonthPrefix]);

  const incomeChangePercent = useMemo(() => {
    if (lastMonthIncome === 0) return null;
    return ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
  }, [currentMonthIncome, lastMonthIncome]);

  const highestSpendingCategoryData = useMemo(() => {
    const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));
    const catMap: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    
    let categoryName = 'None';
    let amount = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > amount) {
        amount = amt;
        categoryName = cat;
      }
    });
    
    const percentage = currentMonthSpent > 0 ? (amount / currentMonthSpent) * 100 : 0;
    return { name: categoryName, amount, percentage };
  }, [expenses, currentMonthPrefix, currentMonthSpent]);

  // Overall Yearly Spending
  const currentYearSpent = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(currentYearPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentYearPrefix]);



  // 2. Automatic budget generator (Section 6)
  const activeBudget = useMemo(() => {
    if (budgetRuleType === 'income_100') {
      return currentMonthIncome > 0 ? currentMonthIncome : monthlyBudget;
    } else if (budgetRuleType === 'income_percentage') {
      if (currentMonthIncome <= 0) return monthlyBudget;
      return currentMonthIncome * (budgetRulePercentage / 100);
    }
    return monthlyBudget; // manual
  }, [budgetRuleType, budgetRulePercentage, currentMonthIncome, monthlyBudget]);

  const budgetUtilization = useMemo(() => {
    if (activeBudget <= 0) return 0;
    return (currentMonthSpent / activeBudget) * 100;
  }, [currentMonthSpent, activeBudget]);

  // Dynamic budget style elements
  const budgetColor = useMemo(() => {
    if (budgetUtilization >= 100) return 'bg-red-500';
    if (budgetUtilization >= 90) return 'bg-orange-500';
    if (budgetUtilization >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [budgetUtilization]);

  const budgetBadgeColor = useMemo(() => {
    if (budgetUtilization >= 100) return 'bg-red-50 text-red-650 dark:bg-red-950/40 dark:text-red-450';
    if (budgetUtilization >= 95) return 'bg-orange-50 text-orange-650 dark:bg-orange-950/40 dark:text-orange-450';
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
  }, [budgetUtilization]);

  // 3. Complete Real Account Balance calculation including internal transfers & detailed metrics
  const bankBalancesData = useMemo(() => {
    const bankMap: { [bankName: string]: number } = {};
    accounts.forEach(acc => {
      bankMap[acc.name] = acc.initialBalance;
    });

    // Handle Income Credits
    incomes.forEach(inc => {
      bankMap[inc.bankName] = (bankMap[inc.bankName] || 0) + inc.amount;
    });

    // Handle Expense Debits
    expenses.forEach(exp => {
      if (exp.bankName) {
        bankMap[exp.bankName] = (bankMap[exp.bankName] || 0) - exp.amount;
      }
    });

    // Handle Transfer credits & debits
    transfers.forEach(tr => {
      const fromAcc = accounts.find(a => a.id === tr.fromAccountId);
      const toAcc = accounts.find(a => a.id === tr.toAccountId);
      if (fromAcc) {
        bankMap[fromAcc.name] = (bankMap[fromAcc.name] || 0) - tr.amount;
      }
      if (toAcc) {
        bankMap[toAcc.name] = (bankMap[toAcc.name] || 0) + tr.amount;
      }
    });

    const entries = accounts.map(acc => {
      const currentBal = bankMap[acc.name] ?? acc.initialBalance;
      
      const thisMonthInc = incomes
        .filter(i => i.bankName === acc.name && i.date.startsWith(currentMonthPrefix))
        .reduce((sum, i) => sum + i.amount, 0);

      const thisMonthExp = expenses
        .filter(e => e.bankName === acc.name && e.date.startsWith(currentMonthPrefix))
        .reduce((sum, e) => sum + e.amount, 0);

      let transferInflow = 0;
      let transferOutflow = 0;
      transfers
        .filter(t => t.date.startsWith(currentMonthPrefix))
        .forEach(t => {
          if (t.toAccountId === acc.id) transferInflow += t.amount;
          if (t.fromAccountId === acc.id) transferOutflow += t.amount;
        });

      const monthlyInflow = thisMonthInc + transferInflow;
      const monthlyOutflow = thisMonthExp + transferOutflow;
      const netChange = monthlyInflow - monthlyOutflow;

      return {
        ...acc,
        balance: currentBal,
        monthlyInflow,
        monthlyOutflow,
        netChange
      };
    });

    const totalBalance = entries.reduce((s, item) => s + item.balance, 0);

    return {
      accounts: entries,
      totalBalance
    };
  }, [incomes, expenses, accounts, transfers, currentMonthPrefix]);

  // Category Color Map
  const getCategoryColor = useCallback((name: string) => {
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
      'other': '#94A3B8',
    };
    if (explicitMap[nameLower]) return explicitMap[nameLower];
    return categories.find(c => c.name.toLowerCase() === nameLower)?.color || '#94a3b8';
  }, [categories]);

  // 4. Interactive reports and analytics databases (Section 14)
  // Income vs Expense chart grouped monthly
  const monthlyCashFlowChartData = useMemo(() => {
    // Generate months list of current year
    const lastSixMonthsList = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return {
        prefix: `${year}-${month}`,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      };
    }).reverse();

    return lastSixMonthsList.map(month => {
      const monthInc = incomes
        .filter(i => i.date.startsWith(month.prefix))
        .reduce((s, i) => s + i.amount, 0);
      const monthExp = expenses
        .filter(e => e.date.startsWith(month.prefix))
        .reduce((s, e) => s + e.amount, 0);
      const monthNet = monthInc - monthExp;
      const savingsRate = monthInc > 0 ? (monthNet / monthInc) * 100 : 0;

      return {
        name: month.label,
        Income: monthInc,
        Expense: monthExp,
        'Net Cash Flow': monthNet,
        'Savings Rate %': parseFloat(savingsRate.toFixed(1))
      };
    });
  }, [incomes, expenses]);

  // Savings Trend progression over past 6 months
  const savingsTrendData = useMemo(() => {
    return monthlyCashFlowChartData.map(item => ({
      name: item.name,
      Savings: item['Net Cash Flow'],
      Rate: item['Savings Rate %']
    }));
  }, [monthlyCashFlowChartData]);

  // Historical Account Balance Trend
  const accountBalanceTrendData = useMemo(() => {
    // Starting overall balance of custom accounts
    let rollingBalance = accounts.reduce((sum, a) => sum + a.initialBalance, 0);
    
    // Combine incomes and expenses chronologically
    const allChronology = [
      ...incomes.map(i => ({ date: i.date, amount: i.amount, type: 'income' })),
      ...expenses.map(e => ({ date: e.date, amount: e.amount, type: 'expense' }))
    ].sort((a, b) => a.date.localeCompare(b.date));

    // Group by month to draw a trend
    const monthsSet = new Set(allChronology.map(x => x.date.split('-').slice(0, 2).join('-')));
    const orderedMonths = Array.from(monthsSet).sort();

    return orderedMonths.map(m => {
      const txs = allChronology.filter(x => x.date.startsWith(m));
      txs.forEach(t => {
        if (t.type === 'income') {
          rollingBalance += t.amount;
        } else {
          rollingBalance -= t.amount;
        }
      });

      const mDate = parseLocalDate(`${m}-01`);
      return {
        name: mDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        'Available Balance': rollingBalance
      };
    });
  }, [incomes, expenses, accounts]);

  // Category spent distribution
  const filteredDistExpenses = useMemo(() => {
    if (distView === 'monthly') {
      return expenses.filter(e => e.date.startsWith(currentMonthPrefix));
    } else if (distView === 'yearly') {
      return expenses.filter(e => e.date.startsWith(currentYearPrefix));
    }
    return expenses;
  }, [expenses, distView, currentMonthPrefix, currentYearPrefix]);

  const distCategoryData = useMemo(() => {
    const usedCategories = Array.from(new Set(filteredDistExpenses.map(e => e.category)));
    return usedCategories.map(catName => ({
      name: catName,
      value: filteredDistExpenses.filter(e => e.category === catName).reduce((sum, e) => sum + e.amount, 0),
      color: getCategoryColor(catName)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [filteredDistExpenses, categories]);

  const { chartCategoryData, hiddenCategories, chartTotal } = useMemo(() => {
    if (distCategoryData.length <= 5) {
      return {
        chartCategoryData: distCategoryData,
        hiddenCategories: [],
        chartTotal: distCategoryData.reduce((sum, item) => sum + item.value, 0)
      };
    }
    const top5 = distCategoryData.slice(0, 5);
    const remaining = distCategoryData.slice(5);
    const remainingValue = remaining.reduce((sum, item) => sum + item.value, 0);
    top5.push({
      name: 'Others',
      value: remainingValue,
      color: '#94A3B8'
    });
    return {
      chartCategoryData: top5,
      hiddenCategories: remaining,
      chartTotal: distCategoryData.reduce((sum, item) => sum + item.value, 0)
    };
  }, [distCategoryData]);

  // 5. Intelligent Financial Score (Section 13)
  const financialHealthScore = useMemo(() => {
    let score = 50; // default baseline

    // Factor 1: Savings rate (Up to 30 points)
    if (currentMonthSavingsRate >= 50) score += 30;
    else if (currentMonthSavingsRate >= 30) score += 20;
    else if (currentMonthSavingsRate >= 15) score += 10;
    else if (currentMonthSavingsRate < 0) score -= 15; // penalize cash burn

    // Factor 2: Budget utilization (Up to 20 points)
    if (budgetUtilization > 100) score -= 20;
    else if (budgetUtilization > 90) score += 2;
    else if (budgetUtilization > 50 && budgetUtilization <= 85) score += 20;
    else if (budgetUtilization <= 50 && budgetUtilization > 0) score += 15;

    // Factor 3: Liquidity index / overall surplus (Up to 20 points)
    if (bankBalancesData.totalBalance > 200000) score += 20;
    else if (bankBalancesData.totalBalance > 50000) score += 10;
    else if (bankBalancesData.totalBalance < 5000) score -= 10;

    return Math.min(Math.max(score, 10), 100);
  }, [currentMonthSavingsRate, budgetUtilization, bankBalancesData.totalBalance]);

  // Financial Health helper status label mapping
  const healthStatusInfo = useMemo(() => {
    const score = financialHealthScore;
    if (score >= 80) return { label: 'Excellent', style: 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' };
    if (score >= 65) return { label: 'Good', style: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' };
    if (score >= 45) return { label: 'Fair', style: 'bg-amber-500/20 text-amber-100 border border-amber-500/30' };
    return { label: 'Needs Attention', style: 'bg-rose-500/20 text-rose-100 border border-rose-500/30' };
  }, [financialHealthScore]);

  // Slide handlers for carousel controls
  const handleNextSlide = useCallback(() => {
    setSlideDirection(1);
    setActiveSlideIndex((prev) => (prev + 1) % 8);
  }, []);

  const handlePrevSlide = useCallback(() => {
    setSlideDirection(-1);
    setActiveSlideIndex((prev) => (prev - 1 + 8) % 8);
  }, []);

  const handleSelectSlide = useCallback((idx: number) => {
    setSlideDirection(idx > activeSlideIndex ? 1 : -1);
    setActiveSlideIndex(idx);
  }, [activeSlideIndex]);

  // Combined 8-Card statistics array in requested default order
  const metricsCards = useMemo(() => [
    {
      id: 'income',
      type: 'income',
      title: 'This Month Income',
      value: formatCurrency(currentMonthIncome),
      change: incomeChangePercent !== null 
        ? `${incomeChangePercent >= 0 ? '+' : ''}${incomeChangePercent.toFixed(0)}% vs Last Month` 
        : '+0% vs Last Month',
      subtext: 'Salary, Bonus & Other Credits',
      gradient: 'from-green-600 via-green-700 to-emerald-800',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
        </svg>
      )
    },
    {
      id: 'spent',
      type: 'expenses',
      title: 'This Month Spent',
      value: formatCurrency(currentMonthSpent),
      change: `${budgetUtilization.toFixed(0)}% of Monthly Budget`,
      subtext: 'Active debit spending matches',
      gradient: 'from-rose-500 via-rose-600 to-red-700',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
        </svg>
      )
    },
    {
      id: 'cashflow',
      type: 'cashflow',
      title: 'Monthly Cash Flow',
      value: `${currentMonthSavings >= 0 ? '+' : ''}${formatCurrency(currentMonthSavings)}`,
      change: `SR: ${currentMonthSavingsRate.toFixed(1)}% (Savings Rate)`,
      subtext: 'Net savings retained in accounts',
      gradient: 'from-blue-500 via-indigo-600 to-indigo-700',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      id: 'highest-category',
      type: 'expenses',
      title: 'Highest Spending Category',
      value: formatCurrency(highestSpendingCategoryData.amount),
      change: `${highestSpendingCategoryData.percentage.toFixed(0)}% of total spends`,
      subtext: highestSpendingCategoryData.name !== 'None' ? highestSpendingCategoryData.name : 'No category logged yet',
      gradient: 'from-amber-500 via-orange-650 to-rose-600',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      id: 'yearly-spent',
      type: 'expenses',
      title: 'Overall Yearly Spending',
      value: formatCurrency(currentYearSpent),
      change: 'Cumulative year-to-date debits',
      subtext: `Total debits recorded in ${currentYearPrefix}`,
      gradient: 'from-rose-600 via-red-600 to-red-750',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'available-balance',
      type: 'income',
      title: 'Total Available Balance',
      value: formatCurrency(bankBalancesData.totalBalance),
      change: `${accounts.length} active wealth positions`,
      subtext: 'Combined bank & wallet positions',
      gradient: 'from-emerald-500 via-teal-600 to-green-750',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'health-score',
      type: 'health',
      title: 'Financial Health Score',
      value: `${financialHealthScore}/100`,
      change: `${healthStatusInfo.label} Standing`,
      subtext: financialHealthScore >= 80 
        ? 'Exceptional savings rate and budget control.' 
        : financialHealthScore >= 65 
        ? 'Healthy score! Keep monitoring small leakages.'
        : financialHealthScore >= 45
        ? 'Fair standing. Try optimizing non-essential bills.'
        : 'Try limiting non-essential bills to bolster buffer.',
      gradient: 'from-purple-650 via-indigo-700 to-purple-800',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      badgeStyle: healthStatusInfo.style
    },
    {
      id: 'savings-month',
      type: 'savings',
      title: 'Savings This Month',
      value: formatCurrency(currentMonthSavings),
      change: `${currentMonthSavingsRate.toFixed(1)}% Savings Rate`,
      subtext: 'Current portion of earnings retained',
      gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
      icon: (
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ], [
    currentMonthIncome, incomeChangePercent, 
    currentMonthSpent, budgetUtilization,
    currentMonthSavings, currentMonthSavingsRate,
    highestSpendingCategoryData, currentYearSpent, currentYearPrefix,
    bankBalancesData.totalBalance, accounts.length,
    financialHealthScore, healthStatusInfo
  ]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* PWA Install Banner */}
      {showInstallBtn && !isStandalone && !isBannerDismissed && (
        <motion.div 
          initial={{ opacity: 0, y: -15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          className="bg-gradient-to-r from-indigo-950/40 via-purple-950/35 to-slate-950/45 border border-[#8B5CF6]/30 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md shadow-[0_10px_35px_-10px_rgba(139,92,246,0.18)]"
        >
          {/* Decorative glowing blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Banner Contents */}
          <div className="flex items-start md:items-center space-x-4 z-10">
            <div className="p-3.5 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6]/90 text-white rounded-2xl shadow-[0_4px_15px_-3px_rgba(139,92,246,0.4)] border border-violet-400/20">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm md:text-base text-white tracking-tight flex items-center space-x-2">
                <span>Experience SpendWise as a Native App! 🚀</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Install SpendWise on your home screen or desktop for a premium app feel, ultra-fast launch, and zero-compromise offline operation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto z-10 mt-2 md:mt-0 shrink-0">
            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white text-xs font-black rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/20 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2 border border-violet-400/10 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install SpendWise</span>
            </button>
            {/* Dismiss Button */}
            <button
              onClick={handleDismissBanner}
              className="px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center border border-white/[0.04] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Dashboard Improvements: Swipeable Carousel summaries (Mobile) & Classic Grid metrics (Desktop) */}
      
      {/* MOBILE INTERACTIVE SWIPEABLE STATISTICS CARD */}
      <div className="block md:hidden pb-1">
        <div className="relative overflow-hidden w-full rounded-3xl" style={{ touchAction: 'pan-y' }}>
          <AnimatePresence initial={false} mode="wait" custom={slideDirection}>
            <motion.div
              key={activeSlideIndex}
              custom={slideDirection}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? '100%' : '-100%',
                  opacity: 0,
                  scale: 0.95
                }),
                center: {
                  x: '0%',
                  opacity: 1,
                  scale: 1
                },
                exit: (dir: number) => ({
                  x: dir < 0 ? '100%' : '-100%',
                  opacity: 0,
                  scale: 0.95
                })
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(e, info) => {
                const swipeThreshold = 50;
                if (info.offset.x < -swipeThreshold) {
                  handleNextSlide();
                } else if (info.offset.x > swipeThreshold) {
                  handlePrevSlide();
                }
              }}
              className={`w-full bg-gradient-to-br ${metricsCards[activeSlideIndex].gradient} p-6 pb-7 rounded-3xl text-white shadow-lg flex flex-col justify-between cursor-grab active:cursor-grabbing relative overflow-hidden select-none min-h-[175px]`}
            >
              {/* Back backing decorative glowing backdrop blur sphere */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-black/10 rounded-full blur-2xl pointer-events-none" />

              {/* Layout Content */}
              <div className="space-y-4 relative z-10 w-full">
                {/* Carousel Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white/80">
                    {metricsCards[activeSlideIndex].title}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    {metricsCards[activeSlideIndex].icon}
                  </div>
                </div>

                {/* Primary Card Value text */}
                <div>
                  <h3 className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-xs leading-none">
                    {metricsCards[activeSlideIndex].value}
                  </h3>
                  
                  {/* Metric Sub-tag change indicator */}
                  <div className="mt-2 text-xs font-black flex items-center gap-1">
                    <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/10 text-[11px] uppercase tracking-wide">
                      {metricsCards[activeSlideIndex].change}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lower description details */}
              <div className="mt-4 text-[11px] font-medium text-white/90 leading-tight border-t border-white/10 pt-3 flex items-center space-x-1.5 relative z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="truncate">{metricsCards[activeSlideIndex].subtext}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Steer Chevrons for swipe fallback */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/15 hover:bg-black/35 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-20 cursor-pointer active:scale-95"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/15 hover:bg-black/35 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-20 cursor-pointer active:scale-95"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Page dot indicators below the card */}
        <div className="flex justify-center items-center gap-2 mt-3.5">
          {metricsCards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleSelectSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlideIndex === idx 
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-400 shadow-xs' 
                  : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP FULL SCANNABLE STATS GRID */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">This Month Income</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/30 flex items-center justify-center">
                ↓
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2.5 font-mono">
              {formatCurrency(currentMonthIncome)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold">
            All salary credits, bonuses, support funds
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">This Month Spent</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-red-500/10 text-red-600 dark:bg-red-900/30 flex items-center justify-center">
                ↑
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2.5 font-mono">
              {formatCurrency(currentMonthSpent)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold">
            Active debit spending matches
          </p>
        </div>

        {/* Monthly Net Savings & Savings Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Monthly Cash Flow</span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-black text-indigo-600 dark:text-indigo-400">
                SR: {currentMonthSavingsRate.toFixed(1)}%
              </span>
            </div>
            <h3 className={`text-2xl font-black mt-2.5 font-mono ${currentMonthSavings >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {currentMonthSavings >= 0 ? '+' : ''}{formatCurrency(currentMonthSavings)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold">
            Net savings retained in accounts
          </p>
        </div>

        {/* Intelligence Score Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-5 rounded-3xl text-white flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Financial Health Score</span>
              <h3 className="text-3xl font-black mt-1 font-mono tracking-tight">{financialHealthScore}<span className="text-xs text-indigo-400 font-bold">/100</span></h3>
            </div>
            <div className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-xl border border-indigo-500/20">
              {financialHealthScore >= 80 ? 'Perfect' : financialHealthScore >= 60 ? 'Healthy' : 'Caution'}
            </div>
          </div>
          <div className="text-[10px] text-indigo-200 mt-3 flex items-center leading-normal">
            <svg className="w-3.5 h-3.5 mr-1.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {financialHealthScore >= 80 ? 'Exceptional savings rate and budget control.' : 'Try limiting non-essential bills to bolster buffer.'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Account Balance Dashboard (Section 11) + Monthly Budget Rules (Section 6 & 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account statement balances */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 md:p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Accounts Overview</h4>
              <p className="text-xs text-slate-400">Current liquid positions in banks & wallets</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Total available balance</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-450 block mt-0.5">
                {formatCurrency(bankBalancesData.totalBalance)}
              </span>
              {/* Account chips summary */}
              {accounts.length > 0 && (
                <div className="flex flex-wrap sm:justify-end gap-1.5 mt-2">
                  {bankBalancesData.accounts.map(acc => (
                    <span 
                      key={acc.id} 
                      className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/40"
                    >
                      <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: acc.color }} />
                      {acc.name.split(' ')[0]}: {formatCurrency(acc.balance)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">No accounts added yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Set up your linked custom bank or liquid accounts in settings to start recording income credits & debits.</p>
              </div>
              <button
                onClick={() => { window.location.hash = '#/settings'; }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                + Add Your First Account
              </button>
            </div>
          ) : (
            <>
              {/* Account analytics grid card elements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {bankBalancesData.accounts.map((ac) => (
                  <div 
                    key={ac.id} 
                    className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-150/10 dark:border-slate-800/60 rounded-2xl hover:shadow-xs transition-shadow relative overflow-hidden"
                  >
                    <div 
                      className="absolute top-0 left-0 w-1 h-full" 
                      style={{ backgroundColor: ac.color }} 
                    />
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{ac.type} • {ac.bankName}</span>
                        <h5 className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                          {formatCurrency(ac.balance)}
                        </h5>
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm mt-0.5 truncate max-w-[170px]">{ac.name}</p>
                      </div>
                      
                      {/* Short spark flow tags for Account Analytics */}
                      <div className="text-right text-[10px] space-y-0.5">
                        <div className="text-emerald-600 dark:text-emerald-450 font-semibold font-mono">
                          In: +{formatCurrency(ac.monthlyInflow)}
                        </div>
                        <div className="text-rose-500 font-semibold font-mono">
                          Out: -{formatCurrency(ac.monthlyOutflow)}
                        </div>
                        <div className={`font-bold font-mono border-t border-slate-200 dark:border-slate-800 pt-0.5 mt-0.5 ${ac.netChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          Net: {ac.netChange >= 0 ? '+' : ''}{formatCurrency(ac.netChange)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Collapsed transfer desk toggle */}
              <div className="pt-2">
                {!showTransferForm ? (
                  <button
                    onClick={() => setShowTransferForm(true)}
                    className="w-full py-2.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/35 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Collapsible Money Transfer Desk</span>
                  </button>
                ) : (
                  <form onSubmit={handleExecuteTransfer} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                      <span className="font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Internal Mudra Transfer</span>
                      <button 
                        type="button" 
                        onClick={() => setShowTransferForm(false)} 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-extrabold cursor-pointer"
                      >
                        ✕ Close Desk
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wildest mb-1">From Account</label>
                        <select
                          required
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-white text-xs font-medium cursor-pointer"
                          value={transferFromId}
                          onChange={(e) => setTransferFromId(e.target.value)}
                        >
                          <option value="">Select Origin</option>
                          {bankBalancesData.accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({formatCurrency(a.balance)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-520 uppercase tracking-wildest mb-1">To Account</label>
                        <select
                          required
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-white text-xs font-medium cursor-pointer"
                          value={transferToId}
                          onChange={(e) => setTransferToId(e.target.value)}
                        >
                          <option value="">Select Destination</option>
                          {bankBalancesData.accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({formatCurrency(a.balance)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-520 uppercase tracking-wildest mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          step="any"
                          placeholder="0.00"
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-semibold"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-520 uppercase tracking-wildest mb-1">Description Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Relocating funds, credit card settlement..."
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                        value={transferDesc}
                        onChange={(e) => setTransferDesc(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowTransferForm(false)}
                        className="px-4 py-2 bg-slate-200/60 dark:bg-slate-800 text-slate-655 font-bold text-[10px] rounded-lg cursor-pointer hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer shadow-sm transition-colors"
                      >
                        Confirm Internal Transfer &rarr;
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Dynamic Budget configuration summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 md:p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Active Budget Hub</h4>
              <p className="text-xs text-slate-400">Budget calculated via configured rule</p>
            </div>
            <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${budgetBadgeColor}`}>
              {budgetRuleType === 'manual' ? 'Manual Limit' : `${budgetRulePercentage}% rule`}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatCurrency(activeBudget)}</span>
                <span className="text-[11px] font-bold text-slate-400 font-mono">/ {budgetUtilization.toFixed(1)}% utilized</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
                  style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Credits logged</span>
                <span className="font-extrabold font-mono text-slate-700 dark:text-slate-350">{formatCurrency(currentMonthIncome)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Remaining balance</span>
                <span className={`font-black font-mono ${activeBudget - currentMonthSpent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(activeBudget - currentMonthSpent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Reports & Analytics Charting Panel (Section 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Financial analytics plots */}
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-5">
            <div>
              <h4 className="text-slate-850 dark:text-slate-200 font-black text-sm md:text-base">Intelligence charts & reports</h4>
              <p className="text-xs text-slate-500">Slice and review structural cashflow datasets</p>
            </div>

            {/* Selector tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
              {(['income_expense', 'savings_trend', 'balance_trend'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAnalyticsTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${analyticsTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab === 'income_expense' ? 'Inc vs Exp' : tab === 'savings_trend' ? 'Savings' : 'Balances'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-68">
            {analyticsTab === 'income_expense' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCashFlowChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={45} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : analyticsTab === 'savings_trend' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsTrendData}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={45} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Saved']}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#savingsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accountBalanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={50} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Statement balance']}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="Available Balance" stroke="#10b981" strokeWidth={3.5} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Existing Distribution Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h4 className="text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base">Expense Distribution</h4>
              <p className="text-xs text-slate-400 mt-0.5">Structure patterns of logged expense categories</p>
            </div>
            {/* View Switcher Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
              {(['monthly', 'yearly', 'overall'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setDistView(view);
                    setActiveIndex(null);
                    setIsOthersExpanded(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black transition-all capitalize ${distView === view ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 flex-1">
            <div className="w-full md:w-1/2 h-44 flex flex-col items-center justify-center relative select-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={1.5}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center mt-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Debits</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatCurrency(chartTotal)}
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {chartCategoryData.map((entry, index) => {
                const pct = chartTotal > 0 ? ((entry.value / chartTotal) * 100).toFixed(1) : '0';
                return (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2 shrink-1 truncate">
                      <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="font-bold text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                    </div>
                    <div className="font-mono text-right shrink-0 ml-2">
                      <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(entry.value)}</span>
                      <span className="text-slate-400 font-medium text-[9px] ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
