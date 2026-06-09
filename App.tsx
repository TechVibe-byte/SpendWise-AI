
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bot } from 'lucide-react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Expense, RecurringExpense, RecurringFrequency, CategoryItem, Income, BudgetRuleType, Account, Transfer, SalaryRule } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { formatCurrency, parseLocalDate, formatLocalDate } from './utils';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import RecurringManager from './components/RecurringManager';
import CategoryManager from './components/CategoryManager';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import IncomeForm from './components/IncomeForm';
import IncomeManager from './components/IncomeManager';
import { Logo } from './components/Logo';
import AIInsights from './components/AIInsights';
import { ThemeToggle } from './components/ThemeToggle';
import { ChatBotModal } from './components/ChatBotModal';
import { ChatBotWidget } from './components/ChatBotWidget';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('spendwise-expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem('spendwise-incomes');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgetRuleType, setBudgetRuleType] = useState<BudgetRuleType>(() => {
    const saved = localStorage.getItem('spendwise-budget-rule-type');
    return (saved as BudgetRuleType) || 'manual';
  });

  const [budgetRulePercentage, setBudgetRulePercentage] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise-budget-rule-percentage');
    return saved ? parseInt(saved, 10) : 90;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('spendwise-accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [transfers, setTransfers] = useState<Transfer[]>(() => {
    const saved = localStorage.getItem('spendwise-transfers');
    return saved ? JSON.parse(saved) : [];
  });

  const [salaryRules, setSalaryRules] = useState<SalaryRule[]>(() => {
    const saved = localStorage.getItem('spendwise-salary-rules');
    return saved ? JSON.parse(saved) : [];
  });

  const [skippedSalaries, setSkippedSalaries] = useState<string[]>(() => {
    const saved = localStorage.getItem('spendwise-skipped-salaries');
    return saved ? JSON.parse(saved) : [];
  });

  const initialBalances = useMemo(() => {
    const map: { [bankName: string]: number } = {};
    accounts.forEach(acc => {
      map[acc.name] = acc.initialBalance;
    });
    return map;
  }, [accounts]);

  const setInitialBalances = () => {};

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    const saved = localStorage.getItem('spendwise-recurring');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('spendwise-custom-categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise-budget');
    return saved ? parseFloat(saved) : 50000;
  });

  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => {
    return localStorage.getItem('spendwise-openrouter-key') || '';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('spendwise-theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('spendwise-onboarded');
  });

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPwaHelp, setShowPwaHelp] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallBtn(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  // Combine defaults with custom categories
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('spendwise-expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('spendwise-incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('spendwise-budget-rule-type', budgetRuleType);
  }, [budgetRuleType]);

  useEffect(() => {
    localStorage.setItem('spendwise-budget-rule-percentage', budgetRulePercentage.toString());
  }, [budgetRulePercentage]);

  useEffect(() => {
    localStorage.setItem('spendwise-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('spendwise-transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('spendwise-salary-rules', JSON.stringify(salaryRules));
  }, [salaryRules]);

  useEffect(() => {
    localStorage.setItem('spendwise-skipped-salaries', JSON.stringify(skippedSalaries));
  }, [skippedSalaries]);

  useEffect(() => {
    localStorage.setItem('spendwise-recurring', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);
  
  useEffect(() => {
    localStorage.setItem('spendwise-custom-categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('spendwise-budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  useEffect(() => {
    localStorage.setItem('spendwise-openrouter-key', openRouterApiKey);
  }, [openRouterApiKey]);

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('spendwise-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('spendwise-theme', 'light');
    }
  }, [isDarkMode]);

  // Recurring processing logic
  const processRecurring = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatedRecurring = [...recurringExpenses];
    let newExpensesToAdd: Expense[] = [];
    let modified = false;

    updatedRecurring = updatedRecurring.map(rule => {
      if (!rule.isActive) return rule;

      let nextDate = parseLocalDate(rule.nextOccurrenceDate);
      nextDate.setHours(0, 0, 0, 0);
      
      const instancesToAdd: Expense[] = [];
      const currentRule = { ...rule };
      let dateHasChanged = false;

      while (nextDate <= today) {
        const dateStr = formatLocalDate(nextDate);
        
        // Prevent duplicate transaction entries for details
        const isDuplicate = expenses.some(e => e.recurringId === currentRule.id && e.date === dateStr);
        
        if (!isDuplicate) {
          modified = true;
          const newInstance: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            amount: currentRule.amount,
            description: `${currentRule.description} (Recurring)`,
            category: currentRule.category,
            date: dateStr,
            bankName: currentRule.bankName,
            recurringId: currentRule.id
          };
          instancesToAdd.push(newInstance);
        }

        if (currentRule.frequency === RecurringFrequency.DAILY) {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (currentRule.frequency === RecurringFrequency.WEEKLY) {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (currentRule.frequency === RecurringFrequency.MONTHLY) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (currentRule.frequency === RecurringFrequency.YEARLY) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        
        dateHasChanged = true;
      }

      if (dateHasChanged) {
        modified = true;
        if (instancesToAdd.length > 0) {
          newExpensesToAdd = [...newExpensesToAdd, ...instancesToAdd];
        }
        currentRule.nextOccurrenceDate = formatLocalDate(nextDate);
        return currentRule;
      }
      return rule;
    });

    if (modified) {
      if (newExpensesToAdd.length > 0) {
        setExpenses(prev => [...newExpensesToAdd, ...prev]);
      }
      setRecurringExpenses(updatedRecurring);
    }
  }, [recurringExpenses, expenses]);

  useEffect(() => {
    processRecurring();
  }, [processRecurring]);

  const handleSaveExpense = (newExpenseData: Omit<Expense, 'id'>, recurringInfo?: { frequency: RecurringFrequency }) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(e => 
        e.id === editingExpense.id ? { ...newExpenseData, id: e.id, recurringId: e.recurringId } : e
      ));
      setEditingExpense(null);
    } else if (editingRecurring) {
      if (recurringInfo) {
        // Update existing recurring rule
        setRecurringExpenses(prev => prev.map(r => r.id === editingRecurring.id ? {
            ...r,
            amount: newExpenseData.amount,
            description: newExpenseData.description,
            category: newExpenseData.category,
            bankName: newExpenseData.bankName,
            frequency: recurringInfo.frequency,
            nextOccurrenceDate: newExpenseData.date, // User updated the date, treating it as next due
        } : r));
      } else {
        // User unchecked recurring, convert to one-time expense and remove rule
        const id = Math.random().toString(36).substr(2, 9);
        setExpenses(prev => [{ ...newExpenseData, id }, ...prev]);
        setRecurringExpenses(prev => prev.filter(r => r.id !== editingRecurring.id));
      }
      setEditingRecurring(null);
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const expense: Expense = { ...newExpenseData, id };
      setExpenses(prev => [expense, ...prev]);

      if (recurringInfo) {
        const nextDate = parseLocalDate(newExpenseData.date);
        if (recurringInfo.frequency === RecurringFrequency.DAILY) nextDate.setDate(nextDate.getDate() + 1);
        else if (recurringInfo.frequency === RecurringFrequency.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
        else if (recurringInfo.frequency === RecurringFrequency.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        else if (recurringInfo.frequency === RecurringFrequency.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);

        const recurringRule: RecurringExpense = {
          id: Math.random().toString(36).substr(2, 9),
          amount: newExpenseData.amount,
          description: newExpenseData.description,
          category: newExpenseData.category,
          bankName: newExpenseData.bankName,
          frequency: recurringInfo.frequency,
          startDate: newExpenseData.date,
          nextOccurrenceDate: formatLocalDate(nextDate),
          isActive: true
        };
        setRecurringExpenses(prev => [...prev, recurringRule]);
      }
    }
    setShowForm(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleEditRecurring = (rule: RecurringExpense) => {
    setEditingRecurring(rule);
    setShowForm(true);
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const toggleRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleSaveIncome = (inc: Income) => {
    if (editingIncome) {
      setIncomes(prev => prev.map(item => item.id === editingIncome.id ? inc : item));
      setEditingIncome(null);
    } else {
      setIncomes(prev => [inc, ...prev]);
    }
    setShowIncomeForm(false);
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(item => item.id !== id));
  };

  const handleEditIncome = (inc: Income) => {
    setEditingIncome(inc);
    setShowIncomeForm(true);
  };

  // Category Management Handlers
  const addCustomCategory = (name: string, color: string) => {
    // Prevent duplicates
    if (allCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists!');
      return;
    }
    const newCat: CategoryItem = {
      id: `custom_${Date.now()}`,
      name,
      color,
      isCustom: true
    };
    setCustomCategories(prev => [...prev, newCat]);
  };

  const deleteCustomCategory = (id: string) => {
    const categoryToDelete = customCategories.find(c => c.id === id);
    if (!categoryToDelete) return;

    // Check if being used
    const isUsed = expenses.some(e => e.category === categoryToDelete.name) || 
                   recurringExpenses.some(r => r.category === categoryToDelete.name);
    
    if (isUsed) {
      if (!confirm(`The category "${categoryToDelete.name}" is currently used in your transactions or recurring rules. Deleting it will keep the history but remove it from the list. Continue?`)) {
        return;
      }
    }
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('spendwise-onboarded', 'true');
    setShowOnboarding(false);
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert("No data to export!");
      return;
    }
    const headers = ["Date", "Description", "Category", "Amount", "Bank"];
    const rows = expenses.map(e => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.bankName || "N/A"
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spendwise_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setEditingRecurring(null);
  };

  const NavItems = ({ isMobile = false }: { isMobile?: boolean }) => {
    const items = [
      {
        to: "/",
        label: "Dashboard",
        mobLabel: "Home",
        icon: (className: string) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        )
      },
      {
        to: "/income",
        label: "Income",
        mobLabel: "Income",
        badge: incomes.length,
        badgeType: "emerald",
        icon: (className: string) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        to: "/history",
        label: "Transactions",
        mobLabel: "Txns",
        badge: expenses.length,
        badgeType: "indigo",
        icon: (className: string) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      {
        to: "/recurring",
        label: "Recurring",
        mobLabel: "Bills",
        icon: (className: string) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      },
      {
        to: "/categories",
        label: "Categories",
        mobLabel: "Tags",
        icon: (className: string) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      },
      {
        to: "/settings",
        label: "Settings",
        mobLabel: "Settings",
        icon: (className: string) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ];

    return (
      <>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => {
              if (isMobile) {
                return `flex items-center transition-all duration-350 ease-out select-none ${
                  isActive
                    ? 'flex-grow max-w-[115px] justify-center space-x-1 px-2.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full font-bold shadow-sm border border-indigo-100/35 dark:border-indigo-900/40 transform scale-[1.02]'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2 ml-1'
                }`;
              }
              return `flex flex-col md:flex-row items-center md:space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-semibold ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`;
            }}
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  {item.icon(isMobile ? "w-[21px] h-[21px]" : "w-6 h-6 md:w-5 md:h-5")}
                  {isMobile && !isActive && item.badge !== undefined && item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-black leading-none text-white rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white dark:border-slate-900 shadow-sm ${
                      item.badgeType === "emerald" ? "bg-emerald-600" : "bg-indigo-600"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                
                <span className={
                  isMobile
                    ? isActive
                      ? "ml-1 text-[11px] font-black tracking-tight whitespace-nowrap block"
                      : "hidden"
                    : "text-[10px] md:text-sm mt-1 md:mt-0 flex items-center"
                }>
                  {isMobile ? item.mobLabel : item.label}
                  {!isMobile && item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] md:text-[10px] font-black rounded-full min-w-[1.25rem] text-center shadow-sm ${
                      item.badgeType === "emerald"
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </>
    );
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col md:flex-row transition-colors duration-300 pb-28 md:pb-0">
        
        {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}

        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-40 relative">
          <div className="flex items-center space-x-3.5 z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-violet-650 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100/10 dark:shadow-none border border-white/10">
              <Logo className="w-5.5 h-5.5 text-white" />
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              SpendWise
            </h1>
          </div>

          <div className="flex items-center space-x-3 z-10">
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 animate-pulse border border-indigo-100/50 dark:border-transparent"
                aria-label="Install App"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
            )}
            <ThemeToggle isDarkMode={isDarkMode} onChange={setIsDarkMode} />
          </div>
        </header>

        {/* Desktop Navigation Sidebar */}
        <nav className="hidden md:flex w-64 bg-white dark:bg-[#0B1220] border-r border-slate-200 dark:border-slate-850 p-6 flex-col sticky top-0 h-screen z-40">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-violet-650 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/20 dark:shadow-none border border-white/20">
              <Logo className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight"> SpendWise </h1>
          </div>

          <div className="flex-1 space-y-2">
            <NavItems />
            {/* Redesigned Premium Theme Switcher Row */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 mt-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle isDarkMode={isDarkMode} onChange={setIsDarkMode} />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:opacity-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Install App</span>
              </button>
            )}

            <button 
              onClick={exportToCSV}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:text-indigo-600 dark:hover:text-indigo-400 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export CSV</span>
            </button>

            <button 
              onClick={() => setShowForm(true)}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl hover:bg-indigo-700 transition-all hover:-translate-y-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              <span>Add Expense</span>
            </button>
          </div>
        </nav>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] flex items-center justify-between z-50 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)]">
          <NavItems isMobile={true} />
        </nav>

        {/* AI Chat Bot FAB */}
        <button 
          onClick={() => setIsChatBotOpen(true)}
          className="fixed bottom-[calc(146px+env(safe-area-inset-bottom))] lg:bottom-10 right-5 lg:right-10 w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-purple-500/30 flex items-center justify-center z-50 transition-all duration-300 lg:opacity-100 opacity-30 animate-pulse lg:animate-none lg:hover:scale-110 lg:hover:shadow-purple-500/50 active:scale-95 border border-white/20"
          aria-label="AI Chat Bot"
        >
          <Bot className="w-6 h-6 lg:w-7 lg:h-7" />
        </button>

        {/* Mobile Floating Action Button (FAB) */}
        <button 
          onClick={() => setShowForm(true)}
          className="md:hidden fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center z-45 active:scale-95 transition-all duration-300 hover:scale-105 border border-white/10"
          aria-label="Add Expense"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/" element={
              <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Summary of your financial activity</p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </header>
                
                <Dashboard 
                  expenses={expenses} 
                  incomes={incomes}
                  categories={allCategories} 
                  monthlyBudget={monthlyBudget} 
                  budgetRuleType={budgetRuleType}
                  budgetRulePercentage={budgetRulePercentage}
                  accounts={accounts}
                  setAccounts={setAccounts}
                  transfers={transfers}
                  setTransfers={setTransfers}
                  showInstallBtn={showInstallBtn}
                  isStandalone={isStandalone}
                  handleInstallClick={handleInstallClick}
                />
                
                <div className="flex flex-col space-y-6 md:space-y-8 pb-10">
                  <div className="w-full">
                    <ExpenseList 
                      expenses={expenses} 
                      onDelete={deleteExpense} 
                      onEdit={handleEditExpense} 
                      categories={allCategories}
                    />
                  </div>
                  
                  <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Avg. Daily Spend</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(totalSpent / (expenses.length > 0 ? 30 : 1))}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Highest Transaction</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(Math.max(...expenses.map(e=>e.amount), 0))}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Active Categories</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{new Set(expenses.map(e=>e.category)).size}</span>
                      </div>
                    </div>
                    <AIInsights expenses={expenses} categories={allCategories} openRouterApiKey={openRouterApiKey} />
                  </div>
                </div>
              </div>
            } />
            <Route path="/income" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <IncomeManager 
                  incomes={incomes}
                  expenses={expenses}
                  accounts={accounts}
                  transfers={transfers}
                  onAddIncome={handleSaveIncome}
                  onDeleteIncome={deleteIncome}
                  onEditIncome={handleEditIncome}
                  openForm={() => {
                    setEditingIncome(null);
                    setShowIncomeForm(true);
                  }}
                  salaryRules={salaryRules}
                  setSalaryRules={setSalaryRules}
                  skippedSalaries={skippedSalaries}
                  setSkippedSalaries={setSkippedSalaries}
                />
              </div>
            } />
            <Route path="/history" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Transaction History</h2>
                <ExpenseList 
                  expenses={expenses} 
                  onDelete={deleteExpense} 
                  onEdit={handleEditExpense} 
                  categories={allCategories}
                />
              </div>
            } />
            <Route path="/recurring" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recurring Payments</h2>
                <RecurringManager 
                  recurringExpenses={recurringExpenses} 
                  onDelete={deleteRecurring} 
                  onEdit={handleEditRecurring}
                  onToggle={toggleRecurring}
                  categories={allCategories}
                />
              </div>
            } />
            <Route path="/categories" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Categories</h2>
                <CategoryManager 
                  categories={allCategories} 
                  onAddCategory={addCustomCategory}
                  onDeleteCategory={deleteCustomCategory}
                />
              </div>
            } />
            <Route path="/settings" element={
              <Settings 
                expenses={expenses}
                setExpenses={setExpenses}
                incomes={incomes}
                setIncomes={setIncomes}
                recurringExpenses={recurringExpenses}
                setRecurringExpenses={setRecurringExpenses}
                customCategories={customCategories}
                setCustomCategories={setCustomCategories}
                monthlyBudget={monthlyBudget}
                setMonthlyBudget={setMonthlyBudget}
                budgetRuleType={budgetRuleType}
                setBudgetRuleType={setBudgetRuleType}
                budgetRulePercentage={budgetRulePercentage}
                setBudgetRulePercentage={setBudgetRulePercentage}
                accounts={accounts}
                setAccounts={setAccounts}
                transfers={transfers}
                setTransfers={setTransfers}
                openRouterApiKey={openRouterApiKey}
                setOpenRouterApiKey={setOpenRouterApiKey}
                deferredPrompt={deferredPrompt}
                showInstallBtn={showInstallBtn}
                isStandalone={isStandalone}
                handleInstallClick={handleInstallClick}
                showPwaHelp={showPwaHelp}
                setShowPwaHelp={setShowPwaHelp}
              />
            } />
          </Routes>
        </main>

        {/* Global Modal */}
        {showForm && (
          <ExpenseForm 
            onAdd={handleSaveExpense} 
            onClose={closeForm}
            initialExpense={editingExpense || (editingRecurring ? {
              id: editingRecurring.id,
              amount: editingRecurring.amount,
              description: editingRecurring.description,
              category: editingRecurring.category,
              date: editingRecurring.nextOccurrenceDate,
              bankName: editingRecurring.bankName
            } : undefined)}
            initialRecurringFrequency={editingRecurring?.frequency}
            categories={allCategories}
            accounts={accounts}
            onSwitchToAdd={() => {
              setEditingExpense(null);
              setEditingRecurring(null);
            }}
          />
        )}

        {/* Global Income Modal */}
        {showIncomeForm && (
          <IncomeForm 
            onAdd={handleSaveIncome}
            onClose={() => {
              setShowIncomeForm(false);
              setEditingIncome(null);
            }}
            initialIncome={editingIncome || undefined}
            expenses={expenses}
            incomes={incomes}
            accounts={accounts}
            transfers={transfers}
          />
        )}

        {/* Global Chat Bot Modal */}
        <ChatBotModal
          isOpen={isChatBotOpen}
          onClose={() => setIsChatBotOpen(false)}
          expenses={expenses}
          monthlyBudget={monthlyBudget}
          openRouterApiKey={openRouterApiKey}
        />
      </div>
    </Router>
  );
};

export default App;
