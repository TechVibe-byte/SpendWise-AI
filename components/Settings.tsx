import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Expense, RecurringExpense, CategoryItem, Income, BudgetRuleType, Account, AccountType } from '../types';
import { formatCurrency } from '../utils';
import { Transfer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Landmark, 
  Check, 
  CreditCard, 
  ChevronRight, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  AlertTriangle, 
  Key, 
  ArrowRightLeft, 
  Database, 
  Plus, 
  RefreshCw, 
  Layers, 
  Sliders, 
  FileSpreadsheet, 
  Power, 
  HelpCircle, 
  Save, 
  X, 
  PiggyBank,
  Smartphone,
  Laptop
} from 'lucide-react';

interface SettingsProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  incomes: Income[];
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
  recurringExpenses: RecurringExpense[];
  setRecurringExpenses: React.Dispatch<React.SetStateAction<RecurringExpense[]>>;
  customCategories: CategoryItem[];
  setCustomCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  monthlyBudget: number;
  setMonthlyBudget: React.Dispatch<React.SetStateAction<number>>;
  budgetRuleType: BudgetRuleType;
  setBudgetRuleType: React.Dispatch<React.SetStateAction<BudgetRuleType>>;
  budgetRulePercentage: number;
  setBudgetRulePercentage: React.Dispatch<React.SetStateAction<number>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transfers: Transfer[];
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  openRouterApiKey: string;
  setOpenRouterApiKey: React.Dispatch<React.SetStateAction<string>>;
  deferredPrompt?: any;
  showInstallBtn?: boolean;
  isStandalone?: boolean;
  handleInstallClick?: () => Promise<void>;
  showPwaHelp?: boolean;
  setShowPwaHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; category: AccountCategory }[] = [
  // Bank Accounts
  { value: 'savings', label: 'Savings Account', category: 'Bank Account' },
  { value: 'salary', label: 'Salary Account', category: 'Bank Account' },
  { value: 'current', label: 'Current Account', category: 'Bank Account' },
  { value: 'cash', label: 'Cash Wallet', category: 'Bank Account' },
  { value: 'wallet', label: 'Digital Wallet', category: 'Bank Account' },
  { value: 'upi', label: 'UPI Linked Account', category: 'Bank Account' },
  
  // Credit Accounts
  { value: 'credit_card', label: 'Credit Card', category: 'Credit Account' },
  { value: 'upi_credit', label: 'UPI Credit Line', category: 'Credit Account' },
  { value: 'bnpl', label: 'Buy Now Pay Later (BNPL)', category: 'Credit Account' },
  { value: 'personal_credit', label: 'Personal Credit Limit', category: 'Credit Account' },
  
  // Custom Account
  { value: 'custom', label: 'Custom Account', category: 'Custom Account' }
];

const ACCOUNT_COLORS = [
  { value: '#6366f1', label: 'Royal Violet' },
  { value: '#3b82f6', label: 'Midnight Blue' },
  { value: '#06b6d4', label: 'Cyan Lagoon' },
  { value: '#10b981', label: 'Emerald Mint' },
  { value: '#f59e0b', label: 'Warm Amber' },
  { value: '#ec4899', label: 'Rose Pink' },
  { value: '#ef4444', label: 'Crimson Red' },
  { value: '#64748b', label: 'Slate Gray' }
];

const Settings: React.FC<SettingsProps> = ({
  expenses, setExpenses,
  incomes, setIncomes,
  recurringExpenses, setRecurringExpenses,
  customCategories, setCustomCategories,
  monthlyBudget, setMonthlyBudget,
  budgetRuleType, setBudgetRuleType,
  budgetRulePercentage, setBudgetRulePercentage,
  accounts, setAccounts,
  transfers, setTransfers,
  openRouterApiKey, setOpenRouterApiKey,
  deferredPrompt,
  showInstallBtn = false,
  isStandalone = false,
  handleInstallClick,
  showPwaHelp = false,
  setShowPwaHelp
}) => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'accounts' | 'budget' | 'backup' | 'ai' | 'install' | 'advanced' | 'danger'>('accounts');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isSwActive, setIsSwActive] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'install') {
      const checkSw = async () => {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          setIsSwActive(!!reg && (!!reg.active || !!reg.installing || !!reg.waiting));
        }
      };
      checkSw();
    }
  }, [activeTab]);

  // Custom premium notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Quick Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Budget rule editor states
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const [localRulePercentage, setLocalRulePercentage] = useState(budgetRulePercentage);
  const [localRuleType, setLocalRuleType] = useState<BudgetRuleType>(budgetRuleType);

  // Bank Account Modal States & Fields
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [showMoreAccountOptions, setShowMoreAccountOptions] = useState(false);

  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('savings');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccColor, setNewAccColor] = useState('#6366f1');
  
  // Credit specific states
  const [newAccCreditLimit, setNewAccCreditLimit] = useState('');
  const [newAccBillingDate, setNewAccBillingDate] = useState('1');
  const [newAccDueDate, setNewAccDueDate] = useState('15');
  const [newAccIssuer, setNewAccIssuer] = useState('');
  const [newAccCustomTypeName, setNewAccCustomTypeName] = useState('');

  // Delete confirmations
  const [accountDeletionConfirm, setAccountDeletionConfirm] = useState<{ id: string; name: string; isUsed: boolean } | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // AI assistant config toggle
  const [aiEnabled, setAiEnabled] = useState(true);

  // Advanced Category custom fields
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // File Reference Inputs
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Render Account Badge helpers
  const getAccountTypeLabel = (type: AccountType) => {
    const found = ACCOUNT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Safe Inflow and Outflow metrics for current month
  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const accountMonthFlows = useMemo(() => {
    const flows: Record<string, { income: number; spent: number }> = {};
    accounts.forEach(acc => {
      flows[acc.name] = { income: 0, spent: 0 };
    });

    incomes.forEach(inc => {
      if (inc.date.startsWith(currentMonthPrefix) && flows[inc.bankName]) {
        flows[inc.bankName].income += inc.amount;
      }
    });

    expenses.forEach(exp => {
      if (exp.date.startsWith(currentMonthPrefix) && exp.bankName && flows[exp.bankName]) {
        flows[exp.bankName].spent += exp.amount;
      }
    });

    return flows;
  }, [accounts, incomes, expenses, currentMonthPrefix]);

  const handleUpdateBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val);
      setBudgetRuleType(localRuleType);
      setBudgetRulePercentage(localRulePercentage);
      showToast('Monthly financial boundaries adapted successfully!', 'success');
    } else {
      showToast('Please insert a realistic budget objective.', 'error');
    }
  };

  const openNewAccountModal = () => {
    setEditingAcc(null);
    setNewAccName('');
    setNewAccBank('Self/Bank');
    setNewAccBalance('');
    setNewAccType('savings');
    setNewAccColor('#6366f1');
    setNewAccCreditLimit('');
    setNewAccBillingDate('1');
    setNewAccDueDate('15');
    setNewAccIssuer('');
    setNewAccCustomTypeName('');
    setShowMoreAccountOptions(false);
    setShowAccountModal(true);
  };

  const openEditAccountModal = (acc: Account) => {
    setEditingAcc(acc);
    setNewAccName(acc.name);
    setNewAccBank(acc.bankName || 'Self/Bank');
    setNewAccBalance(acc.initialBalance.toString());
    setNewAccType(acc.type);
    setNewAccColor(acc.color || '#6366f1');
    setNewAccCreditLimit(acc.creditLimit?.toString() || '');
    setNewAccBillingDate(acc.billingDate?.toString() || '1');
    setNewAccDueDate(acc.dueDate?.toString() || '15');
    setNewAccIssuer(acc.issuerName || '');
    setNewAccCustomTypeName(acc.customTypeName || '');
    setShowMoreAccountOptions(true);
    setShowAccountModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccBalance) {
      showToast('Please state a valid name and opening balance.', 'error');
      return;
    }

    const isCreditAccount = ACCOUNT_TYPES.find(t => t.value === newAccType)?.category === 'Credit Account';
    const isCustomAccount = ACCOUNT_TYPES.find(t => t.value === newAccType)?.category === 'Custom Account';
    
    if (isCreditAccount && !newAccCreditLimit) {
      showToast('Please provide a credit limit for credit accounts.', 'error');
      return;
    }

    const accountPayload = {
      name: newAccName.trim(),
      bankName: newAccBank.trim() || 'Self/Bank',
      type: newAccType,
      category: ACCOUNT_TYPES.find(t => t.value === newAccType)?.category || 'Bank Account',
      initialBalance: parseFloat(newAccBalance) || 0,
      color: newAccColor,
      isCreditAccount,
      creditLimit: isCreditAccount ? parseFloat(newAccCreditLimit) : undefined,
      billingDate: isCreditAccount ? parseInt(newAccBillingDate) : undefined,
      dueDate: isCreditAccount ? parseInt(newAccDueDate) : undefined,
      issuerName: isCreditAccount ? newAccIssuer.trim() : undefined,
      customTypeName: isCustomAccount ? newAccCustomTypeName.trim() : undefined,
    };

    if (editingAcc) {
      if (accounts.some(a => a.id !== editingAcc.id && a.name.toLowerCase().trim() === newAccName.toLowerCase().trim())) {
        showToast('Account label already registered. Enter a unique name.', 'error');
        return;
      }

      setAccounts(prev => prev.map(a => a.id === editingAcc.id ? { ...a, ...accountPayload } : a));
      showToast('Account profile modified successfully!', 'success');
    } else {
      if (accounts.some(a => a.name.toLowerCase().trim() === newAccName.toLowerCase().trim())) {
        showToast('An account with this name is already configured.', 'error');
        return;
      }

      const freshAcc: Account = {
        id: Math.random().toString(36).substr(2, 9),
        ...accountPayload
      };
      setAccounts(prev => [...prev, freshAcc]);
      showToast(`Account "${newAccName}" launched perfectly!`, 'success');
    }

    setShowAccountModal(false);
  };

  const triggerDeleteRequest = (id: string, name: string) => {
    const isUsed = expenses.some(e => e.bankName === name) || incomes.some(i => i.bankName === name);
    setAccountDeletionConfirm({ id, name, isUsed });
  };

  const confirmDeleteAccount = () => {
    if (!accountDeletionConfirm) return;
    setAccounts(prev => prev.filter(a => a.id !== accountDeletionConfirm.id));
    showToast(`Deleted ${accountDeletionConfirm.name} permanently.`, 'info');
    setAccountDeletionConfirm(null);
  };

  const handleClearData = () => {
    if (purgeConfirmText !== 'DELETE') {
      showToast('Please write DELETE to confirm data destruction.', 'error');
      return;
    }
    localStorage.clear();
    showToast('Vault wiped completely. Restarting shortly...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const exportJSON = () => {
    const data = {
      version: 3,
      timestamp: new Date().toISOString(),
      expenses,
      incomes,
      recurringExpenses,
      customCategories,
      monthlyBudget,
      budgetRuleType,
      budgetRulePercentage,
      accounts,
      transfers
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendwise_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Secure JSON vault backup exported!', 'success');
  };

  const exportCSV = () => {
    if (expenses.length === 0 && incomes.length === 0) {
      showToast('No entries recorded to construct a ledger.', 'error');
      return;
    }
    const headers = ["Type", "Date", "Description", "Category", "Amount", "Assigned Account"];
    const rows: any[] = [];
    
    expenses.forEach(e => {
      rows.push(["Expense", e.date, `"${e.description.replace(/"/g, '""')}"`, e.category, e.amount, e.bankName || ""]);
    });

    incomes.forEach(i => {
      rows.push(["Income", i.date, `"${i.description.replace(/"/g, '""')}"`, i.category, i.amount, i.bankName]);
    });

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spendwise_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV transaction sheet exported successfully!', 'success');
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        let importedExp = 0;
        let importedInc = 0;
        
        if (data.expenses && Array.isArray(data.expenses)) {
          const existingIds = new Set(expenses.map(e => e.id));
          const newExpenses = data.expenses.filter((e: Expense) => !existingIds.has(e.id));
          if (newExpenses.length > 0) {
            setExpenses(prev => [...prev, ...newExpenses]);
            importedExp += newExpenses.length;
          }
        }

        if (data.incomes && Array.isArray(data.incomes)) {
          const existingIds = new Set(incomes.map(i => i.id));
          const newIncomes = data.incomes.filter((i: Income) => !existingIds.has(i.id));
          if (newIncomes.length > 0) {
            setIncomes(prev => [...prev, ...newIncomes]);
            importedInc += newIncomes.length;
          }
        }
        
        if (data.customCategories && Array.isArray(data.customCategories)) {
          const existingIds = new Set(customCategories.map(c => c.id));
          const newCats = data.customCategories.filter((c: CategoryItem) => !existingIds.has(c.id));
          if (newCats.length > 0) {
            setCustomCategories(prev => [...prev, ...newCats]);
          }
        }
        
        if (data.recurringExpenses && Array.isArray(data.recurringExpenses)) {
          const existingIds = new Set(recurringExpenses.map(r => r.id));
          const newRec = data.recurringExpenses.filter((r: RecurringExpense) => !existingIds.has(r.id));
          if (newRec.length > 0) {
            setRecurringExpenses(prev => [...prev, ...newRec]);
          }
        }

        if (data.accounts && Array.isArray(data.accounts)) {
          const existingIds = new Set(accounts.map(a => a.id));
          const newAccs = data.accounts.filter((a: Account) => !existingIds.has(a.id));
          if (newAccs.length > 0) {
            setAccounts(prev => [...prev, ...newAccs]);
          }
        }

        if (data.transfers && Array.isArray(data.transfers)) {
          const existingIds = new Set(transfers.map(t => t.id));
          const newTrans = data.transfers.filter((t: Transfer) => !existingIds.has(t.id));
          if (newTrans.length > 0) {
            setTransfers(prev => [...prev, ...newTrans]);
          }
        }

        if (data.monthlyBudget && typeof data.monthlyBudget === 'number') {
          setMonthlyBudget(data.monthlyBudget);
          setBudgetInput(data.monthlyBudget.toString());
        }

        if (data.budgetRuleType) {
          setBudgetRuleType(data.budgetRuleType);
          setLocalRuleType(data.budgetRuleType);
        }

        if (typeof data.budgetRulePercentage === 'number') {
          setBudgetRulePercentage(data.budgetRulePercentage);
          setLocalRulePercentage(data.budgetRulePercentage);
        }
        
        showToast(`Successfully synchronised backup state! Combined records.`, 'success');
        if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      } catch (err) {
        showToast('Vault restore failed: Invalid data structure.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('State a specific label for your category.', 'error');
      return;
    }
    if (customCategories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      showToast('This custom category label matches a prefix.', 'error');
      return;
    }

    const freshCat: CategoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCatName.trim(),
      color: newCatColor,
      isCustom: true
    };
    setCustomCategories(prev => [...prev, freshCat]);
    setNewCatName('');
    showToast(`Category "${freshCat.name}" is now ready!`, 'success');
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const isUsed = expenses.some(e => e.category === name) || recurringExpenses.some(r => r.category === name);
    if (isUsed) {
      showToast('Cannot delete! Category currently holds active transactions.', 'error');
      return;
    }
    setCustomCategories(prev => prev.filter(c => c.id !== id));
    showToast('Custom spending category dismantled.', 'info');
  };

  return (
    <div className="space-y-6 md:space-y-8 select-none">
      
      {/* Toast Alert pop-up system */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-semibold border backdrop-blur-md transition-all ${
              toast.type === 'success' 
                ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/30' 
                : toast.type === 'error' 
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/30' 
                : 'bg-indigo-950/95 text-indigo-100 border-indigo-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400 animate-pulse' : toast.type === 'error' ? 'bg-rose-400 animate-pulse' : 'bg-indigo-400 animate-pulse'}`} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-gradient-to-b dark:from-[#071224] dark:to-[#0d1e3d] border border-slate-200 dark:border-white/[0.05] p-5 md:p-8 rounded-[32px] space-y-6 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.08)] dark:shadow-2xl relative overflow-hidden">
        {/* Subtle decorative purple glow background element */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#8B5CF6]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.6)] animate-pulse" />
              Vault Center
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Manage accounts, budgets, and backups.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-start relative z-10">
          
          {/* SIDE BAR / MOBILE CATEGORY NAVIGATION SECTION */}
          <div className="md:col-span-1 grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-2.5 p-2 bg-slate-50 dark:bg-[#040914]/60 border border-slate-200 dark:border-white/[0.03] rounded-[24px]">
            
            {/* 1. Accounts Tab */}
            <button
              onClick={() => setActiveTab('accounts')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'accounts' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.25)] border border-violet-400/20 scale-[1.02]' 
                  : 'bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#111c33] dark:hover:border-violet-500/30 dark:border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(139,92,246,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className={`w-4 h-4 transition-colors ${activeTab === 'accounts' ? 'text-white' : 'text-violet-550 dark:text-violet-400'}`} />
                <span>Accounts</span>
              </div>
              <span className={`text-[10px] font-black font-mono py-0.5 px-2 rounded-full border transition-all ${
                activeTab === 'accounts' 
                  ? 'bg-white/15 text-white border-white/20' 
                  : 'bg-slate-200 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-300 dark:border-white/5'
              }`}>
                {accounts.length}
              </span>
            </button>

            {/* 2. Budget Rules Tab */}
            <button
              onClick={() => setActiveTab('budget')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'budget' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.25)] border border-violet-400/20 scale-[1.02]' 
                  : 'bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#111c33] dark:hover:border-indigo-500/30 dark:border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(99,102,241,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Landmark className={`w-4 h-4 transition-colors ${activeTab === 'budget' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                <span>Budget Rules</span>
              </div>
            </button>

            {/* 3. Backup & Restore Tab */}
            <button
              onClick={() => setActiveTab('backup')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'backup' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.25)] border border-violet-400/20 scale-[1.02]' 
                  : 'bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#111c33] dark:hover:border-cyan-500/30 dark:border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(6,182,212,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className={`w-4 h-4 transition-colors ${activeTab === 'backup' ? 'text-white' : 'text-cyan-500 dark:text-cyan-400'}`} />
                <span>Backup & Restore</span>
              </div>
            </button>

            {/* 4. AI Assistant Tab */}
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'ai' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.25)] border border-violet-400/20 scale-[1.02]' 
                  : 'bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#111c33] dark:hover:border-violet-500/30 dark:border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(139,92,246,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-4 h-4 transition-colors ${activeTab === 'ai' ? 'text-white' : 'text-violet-550 dark:text-violet-400'}`} />
                <span>AI Assistant</span>
              </div>
              {openRouterApiKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
              )}
            </button>

            {/* 5. Advanced Tab */}
            <button
              onClick={() => setActiveTab('advanced')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'advanced' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.25)] border border-violet-400/20 scale-[1.02]' 
                  : 'bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#111c33] dark:hover:border-slate-500/30 dark:border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(148,163,184,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sliders className={`w-4 h-4 transition-colors ${activeTab === 'advanced' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>Advanced</span>
              </div>
            </button>

            {/* 5.5 App Installation Tab */}
            <button
              onClick={() => setActiveTab('install')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'install' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white shadow-[0_4px_20px_-2px_rgba(139,92,246,0.25)] border border-violet-400/20 scale-[1.02]' 
                  : 'bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 dark:bg-[#0F172A] dark:text-slate-400 dark:hover:text-[#8B5CF6] dark:hover:text-white dark:hover:bg-[#111c33] dark:hover:border-[#8B5CF6]/30 dark:border-white/[0.08] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(139,92,246,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Smartphone className={`w-4 h-4 transition-colors ${activeTab === 'install' ? 'text-white' : 'text-[#8B5CF6]'}`} />
                <span>App Installation</span>
              </div>
              {showInstallBtn && !isStandalone && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            {/* 6. Danger Zone Tab */}
            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 transform cursor-pointer ${
                activeTab === 'danger' 
                  ? 'bg-gradient-to-r from-red-650 to-rose-650 text-white shadow-[0_4px_20px_-2px_rgba(239,68,68,0.25)] border border-red-500/30 scale-[1.02]' 
                  : 'bg-red-50 hover:bg-red-105 text-red-650 border border-red-200 hover:text-red-750 dark:bg-[#0F172A] dark:text-rose-500 dark:hover:text-rose-450 dark:hover:bg-[#1c111c] dark:border-red-500/20 dark:hover:border-red-500/40 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(239,68,68,0.12)]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShieldAlert className={`w-4 h-4 transition-colors ${activeTab === 'danger' ? 'text-white' : 'text-rose-500'}`} />
                <span>Danger Zone</span>
              </div>
            </button>

          {/* Brand Identity Showcase */}
          <div className="hidden md:flex flex-col bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.04] p-5 rounded-3xl mt-6 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none transition-all group-hover:scale-125" />
            
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-violet-650 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-3 border border-white/10">
              <div className="w-8 h-8 text-white flex items-center justify-center">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M60 140C60 117.909 77.9086 100 100 100H140V140C140 151.046 131.046 160 120 160H80C68.9543 160 60 151.046 60 140Z" className="fill-slate-800 dark:fill-white" />
                  <path d="M140 60C140 82.0914 122.091 100 100 100H60V60C60 48.9543 68.9543 40 80 40H120C131.046 40 140 48.9543 140 60Z" fill="#22c55e" />
                  <rect x="60" y="90" width="80" height="20" fill="url(#paint0_linear_logo_settings)"/>
                  <defs>
                    <linearGradient id="paint0_linear_logo_settings" x1="60" y1="100" x2="140" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#22c55e"/>
                      <stop offset="1" stopColor="#1e293b"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            
            <h3 className="text-xs font-black text-slate-800 dark:text-white tracking-widest uppercase">SpendWise</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-1">Platform Version 2.4.0</p>
            
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04] flex flex-col gap-1 text-[10px] text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Secure Core:</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Layer:</span>
                <span className="text-slate-705 dark:text-slate-300 font-bold">AES-256</span>
              </div>
            </div>
          </div>

        </div>

        {/* ACTIVE MAIN SETTINGS CONTENT AREA */}
        <div className="md:col-span-3">
          
          {/* TAB 1: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl relative overflow-hidden shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:shadow-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#8B5CF6]" />
                      Manage Accounts
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-405 mt-1">Configure virtual positions, wallets, active bank balances and flow streams.</p>
                  </div>
                  <button
                    onClick={openNewAccountModal}
                    className="h-10 px-4 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white font-extrabold text-xs rounded-2xl hover:scale-[1.03] active:scale-95 duration-150 flex items-center justify-center space-x-1.5 shrink-0 shadow-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bank Account</span>
                  </button>
                </div>

                {accounts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {accounts.map(acc => {
                      const flows = accountMonthFlows[acc.name] || { income: 0, spent: 0 };
                      return (
                        <div 
                          key={acc.id} 
                          className="group bg-slate-50 dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-300 relative overflow-hidden hover:shadow-[0_4px_20px_rgba(15,23,42,0.03)]"
                        >
                          <div 
                            className="absolute top-0 left-0 w-1.5 h-full" 
                            style={{ backgroundColor: acc.color || '#6366f1' }} 
                          />
                          
                          <div className="flex justify-between items-start space-x-4">
                            <div className="min-w-0">
                              <span className="inline-block bg-slate-200/50 dark:bg-white/[0.04] text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md mb-2 border border-slate-300/30 dark:border-white/[0.03]">
                                {acc.customTypeName || getAccountTypeLabel(acc.type)}
                              </span>
                              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">{acc.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold truncate">Issuer: {acc.issuerName || acc.bankName || 'Self'}</p>
                            </div>

                            <div className="flex space-x-0.5">
                              <button 
                                onClick={() => openEditAccountModal(acc)}
                                className="p-1 px-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-405 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => triggerDeleteRequest(acc.id, acc.name)}
                                className="p-1 px-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-rose-600 dark:text-slate-405 dark:hover:bg-slate-850 dark:hover:text-rose-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 flex items-end justify-between border-t border-slate-200 dark:border-white/[0.04] pt-3.5">
                            {acc.isCreditAccount ? (
                              <>
                                <div>
                                  <p className="text-[9px] text-slate-550 dark:text-slate-450 uppercase tracking-widest font-black">Limit</p>
                                  <h5 className="text-sm font-black font-mono tracking-tight text-slate-900 dark:text-slate-200 mt-0.5">
                                    {formatCurrency(acc.creditLimit || 0)}
                                  </h5>
                                </div>
                                <div className="text-center">
                                  <p className="text-[9px] text-slate-550 dark:text-slate-450 uppercase tracking-widest font-black">Starting Outst.</p>
                                  <h5 className="text-sm font-black font-mono tracking-tight text-slate-900 dark:text-slate-200 mt-0.5">
                                    {formatCurrency(acc.initialBalance)}
                                  </h5>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-slate-550 uppercase tracking-widest font-bold">Due Date</p>
                                  <h5 className="text-xs font-black tracking-tight text-slate-700 dark:text-slate-300 mt-1">
                                    {acc.dueDate ? `Day ${acc.dueDate}` : 'N/A'}
                                  </h5>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-[9px] text-slate-550 dark:text-slate-450 uppercase tracking-widest font-black">Opening Balance</p>
                                  <h5 className="text-base font-black font-mono tracking-tight text-slate-900 dark:text-slate-200 mt-0.5">
                                    {formatCurrency(acc.initialBalance)}
                                  </h5>
                                </div>

                                <div className="text-right">
                                  <p className="text-[9px] text-slate-550 uppercase tracking-widest font-bold">Monthly Flow</p>
                                  <p className="text-[10px] font-black font-mono mt-0.5">
                                    <span className="text-emerald-500 dark:text-emerald-400">+{formatCurrency(flows.income)}</span>
                                    <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
                                    <span className="text-rose-500 dark:text-rose-400">-{formatCurrency(flows.spent)}</span>
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 border border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#111827]/40 rounded-3xl flex flex-col items-center justify-center">
                    <PiggyBank className="w-12 h-12 text-slate-400 dark:text-slate-550 mb-3 stroke-[1.2]" />
                    <p className="text-sm text-slate-500 dark:text-slate-350 font-bold mb-4">No accounts added yet</p>
                    <button
                      onClick={openNewAccountModal}
                      className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 text-white font-extrabold text-xs rounded-2xl transition-all duration-150 hover:scale-[1.03] active:scale-95 flex items-center justify-center space-x-1.5 shadow-lg border border-white/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BUDGET LIMITS */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl relative overflow-hidden shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:shadow-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#8B5CF6]" />
                    Budget Rule Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure automated calculations to dynamically configure monthly ceilings depending on current income velocity.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <button
                      onClick={() => setLocalRuleType('manual')}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        localRuleType === 'manual' 
                          ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-950/60 dark:to-slate-900 border-indigo-500 text-white shadow-md shadow-indigo-950/10' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-[#111827] dark:border-white/[0.05] text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827]/80'
                      }`}
                    >
                      <span className="font-extrabold text-xs block">Manual Cap</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-1.5 leading-tight">Strict ceiling fixed regardless of income level fluctuations.</span>
                    </button>

                    <button
                      onClick={() => setLocalRuleType('income_100')}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        localRuleType === 'income_100' 
                          ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-950/60 dark:to-slate-900 border-indigo-500 text-white shadow-md shadow-indigo-950/10' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-[#111827] dark:border-white/[0.05] text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827]/80'
                      }`}
                    >
                      <span className="font-extrabold text-xs block">100% Incomes Cap</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-1.5 leading-tight">Entire monthly cumulative income constitutes the available budget.</span>
                    </button>

                    <button
                      onClick={() => setLocalRuleType('income_percentage')}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        localRuleType === 'income_percentage' 
                          ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-950/60 dark:to-slate-900 border-indigo-500 text-white shadow-md shadow-indigo-950/10' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-[#111827] dark:border-white/[0.05] text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827]/80'
                      }`}
                    >
                      <span className="font-extrabold text-xs block">Income Ratio Rules</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-1.5 leading-tight">Allocate ratio target parameters (e.g. 50/30/20) for expenses allocation.</span>
                    </button>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end bg-slate-50 dark:bg-[#111827]/50 p-5 rounded-2xl border border-slate-200 dark:border-white/[0.04]">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                        Fallback Base Goal (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 font-bold font-mono text-sm leading-none focus:outline-none focus:border-indigo-500 transition-colors"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                      />
                      <p className="text-[9px] text-slate-500 mt-1.5 leading-normal">Operational fallback metric applied if net ledger inputs is empty.</p>
                    </div>

                    {localRuleType === 'income_percentage' && (
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Allocation Ratio Limit
                          </label>
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{localRulePercentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          className="w-full h-1.5 bg-slate-200 dark:bg-[#0F172A] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          value={localRulePercentage}
                          onChange={(e) => setLocalRulePercentage(parseInt(e.target.value, 10))}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpdateBudget}
                    className="w-full h-11 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white font-extrabold text-xs rounded-2xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-950/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Synchronize Budget Objectives</span>
                  </button>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUPS & CSV */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl relative overflow-hidden shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:shadow-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#8B5CF6]" />
                    Backup & Restore Registry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Export your structured database vaults to ensure multi-device synchronization and avoid data loss.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* CSV Card */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.04] p-5 rounded-2xl text-center flex flex-col justify-between items-center group hover:border-[#3b82f6]/30 transition-all">
                    <div className="w-10 h-10 bg-[#3b82f6]/10 text-[#3b82f6] rounded-xl flex items-center justify-center mb-4 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Export CSV Sheet</h4>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">Download ledger tables configured for Excel / spreadsheets.</p>
                    </div>
                    <button
                      onClick={exportCSV}
                      className="mt-5 w-full h-9 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center space-x-1 shadow-xs border border-slate-300 dark:border-white/[0.03] cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* JSON Backup Card */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.04] p-5 rounded-2xl text-center flex flex-col justify-between items-center group hover:border-violet-500/30 transition-all">
                    <div className="w-10 h-10 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center mb-4 shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Dump JSON Backup</h4>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">Create an offline database file to save completely.</p>
                    </div>
                    <button
                      onClick={exportJSON}
                      className="mt-5 w-full h-9 bg-violet-100 hover:bg-violet-200 dark:bg-[#2e1065]/35 dark:hover:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center space-x-1 shadow-xs border border-violet-200 dark:border-violet-500/10 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Backup JSON</span>
                    </button>
                  </div>

                  {/* Restore Card */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.04] p-5 rounded-2xl text-center flex flex-col justify-between items-center group hover:border-cyan-500/30 transition-all">
                    <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-4 shrink-0">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Restore Backup File</h4>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">Upload previous offline vaults to overlay details perfectly.</p>
                    </div>
                    <div className="w-full mt-5">
                      <input
                        type="file"
                        accept=".json"
                        ref={jsonFileInputRef}
                        onChange={handleJSONImport}
                        className="hidden"
                      />
                      <button
                        onClick={() => jsonFileInputRef.current?.click()}
                        className="w-full h-9 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-950/25 dark:hover:bg-cyan-900/35 text-cyan-705 dark:text-cyan-400 font-bold text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center space-x-1 shadow-xs border border-cyan-200 dark:border-cyan-500/15 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Restore JSON</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 4: AI ASSISTANT */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl relative overflow-hidden shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:shadow-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                      AI Assistant
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure advanced conversational interfaces, intelligence modeling platforms and API gateways.</p>
                  </div>
                  
                  {/* Dynamic enable toggle */}
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-[#111827] px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/[0.05]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{aiEnabled ? 'Enabled' : 'Disabled'}</span>
                    <button
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${aiEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {aiEnabled ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5"
                    >
                      <div className="bg-slate-50 dark:bg-[#111827]/50 rounded-2xl p-4 border border-slate-200 dark:border-white/[0.04]">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">
                          Optional OpenRouter API Key
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="sk-or-v1-..."
                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 font-bold font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-650"
                            value={openRouterApiKey}
                            onChange={(e) => setOpenRouterApiKey(e.target.value)}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-450 dark:text-slate-500">
                            <Key className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-2.5 leading-normal">
                          Required only for advanced AI conversations. Secure keys are stored exclusively localized inside your browser space.
                        </p>
                      </div>

                      <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-2xl border border-violet-100 dark:border-violet-500/10 flex items-start space-x-3 text-violet-750 dark:text-violet-200">
                        <AlertTriangle className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
                        <div className="text-[10px] leading-normal font-semibold">
                          <span className="font-extrabold block mb-0.5">Need a key?</span>
                          Generate free or pay-as-you-go developer keys securely over OpenRouter portal to activate premium budget recommendation models.
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-6"
                    >
                      <Sliders className="w-10 h-10 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">AI Companion is deactivated</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">Enable artificial intelligence systems on the top toggle to input api secrets and generate forecasts.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* TAB 5: ADVANCED */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl relative overflow-hidden shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:shadow-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#8B5CF6]" />
                    Advanced Controls
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-404 mt-1">Audit customized tags, spending brackets and system-specific data structure files.</p>
                </div>

                <div className="space-y-6">
                  
                  {/* Category manager */}
                  <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.04] p-5 rounded-2xl">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      Custom Category Overlays
                    </h4>
                    
                    <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">New Category Label</label>
                        <input
                          type="text"
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          placeholder="e.g. Subscriptions, Pet Care"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">Theme Accent Choice</label>
                        <select
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-200 text-xs font-bold cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                        >
                          {ACCOUNT_COLORS.map(c => (
                            <option key={c.value} value={c.value} className="text-slate-900 bg-white dark:text-slate-200 dark:bg-[#0F172A]">{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3 mt-1.5">
                        <button
                          type="submit"
                          className="w-full h-10 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Append Custom Category</span>
                        </button>
                      </div>
                    </form>

                    <div className="border-t border-slate-205 dark:border-white/[0.04] pt-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Custom Configured Categories</p>
                      {customCategories.filter(c => c.isCustom).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {customCategories.filter(c => c.isCustom).map(c => (
                            <div 
                              key={c.id} 
                              className="px-3 py-1.5 bg-slate-200/50 dark:bg-[#0b0f19] border border-slate-300/30 dark:border-white/[0.06] rounded-xl flex items-center space-x-2 text-xs"
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{c.name}</span>
                              <button 
                                onClick={() => handleDeleteCategory(c.id, c.name)}
                                className="text-slate-450 hover:text-rose-600 dark:text-slate-550 dark:hover:text-rose-500 transition-colors p-0.5 ml-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 dark:text-slate-550 italic font-medium">No custom categories established yet. Create one above!</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}          {/* TAB 6: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-rose-50/20 dark:bg-[#0f111a] border border-rose-350/50 dark:border-rose-500/25 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="mb-6 pb-4 border-b border-rose-100 dark:border-white/[0.06] flex items-start space-x-3">
                  <div className="w-10 h-10 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-600 dark:text-rose-500">Danger Zone: Absolute Purge</h3>
                    <p className="text-xs text-rose-700/80 dark:text-rose-350/80 mt-1">Irreversible administrative actions. Be extremely careful before triggering deletions.</p>
                  </div>
                </div>

                <div className="space-y-5 bg-rose-50/80 dark:bg-rose-950/10 p-5 rounded-2xl border border-rose-200 dark:border-rose-500/10">
                  <div className="text-[11px] text-rose-850 dark:text-rose-200/80 leading-relaxed font-semibold">
                    <span className="font-extrabold text-rose-600 dark:text-rose-450 block mb-1">WARNING STATEMENT</span>
                    Triggering data destruction wipes all transactional ledger, custom category nodes, recurring plans, initial account balances, and security API keys completely. This action resets SpendWise to baseline out-of-the-box system configurations.
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-rose-700 dark:text-rose-300 uppercase tracking-widest leading-none">
                      Type 'DELETE' to confirm data purge:
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-350 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none focus:border-rose-500 text-xs transition-colors"
                      placeholder="Type 'DELETE' exactly..."
                      value={purgeConfirmText}
                      onChange={(e) => setPurgeConfirmText(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleClearData}
                    disabled={purgeConfirmText !== 'DELETE'}
                    className={`w-full h-11 font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition-all shadow-lg ${
                      purgeConfirmText === 'DELETE' 
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white cursor-pointer active:scale-95 duration-150' 
                        : 'bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-white/[0.02] cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Unleash Total Vault Deletion</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: PWA INSTALLATION */}
          {activeTab === 'install' && (
            <div className="md:col-span-3 space-y-6 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex flex-col space-y-1.5 p-6 bg-[#0B1220] border border-white/[0.04] rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-[#8B5CF6]" />
                  <span>Install SpendWise App</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Access SpendWise instantly from your device's home screen or desktop with offline support.
                </p>
              </div>

              {/* Section: Installation Status */}
              <div className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-white/[0.04] rounded-3xl p-6 space-y-4 shadow-[0_8px_30px_rgb(15,23,42,0.04)] dark:shadow-none">
                <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200 uppercase tracking-wider">Installation Status</h4>
                
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/55 border border-slate-200 dark:border-white/[0.02] flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    isStandalone 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : showInstallBtn 
                        ? 'bg-indigo-550/10 text-indigo-600 dark:text-indigo-400 border border-indigo-505/20' 
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300 dark:border-slate-805'
                  }`}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wide">Current Status</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      {isStandalone ? (
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">Installed ✓</span>
                      ) : showInstallBtn ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">Available to Install</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-405 font-bold font-mono">Not Available</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isStandalone ? (
                    <div className="text-emerald-700 dark:text-emerald-400/90 font-medium bg-emerald-50 dark:bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/10 flex items-center space-x-2">
                      <span className="text-lg">✓</span>
                      <span>SpendWise is already installed on this device.</span>
                    </div>
                  ) : showInstallBtn ? (
                    <div className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/5 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/10 font-bold">
                      Install SpendWise for faster access and offline support.
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/40 font-medium">
                      Installation is currently unavailable.
                    </div>
                  )}
                </div>

                {/* Button container */}
                <div className="pt-2">
                  {isStandalone ? (
                    <div className="w-full bg-slate-100 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 py-3.5 px-4 rounded-xl text-center font-bold text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center space-x-1.5">
                      <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">✓</span>
                      <span>Installed</span>
                    </div>
                  ) : showInstallBtn ? (
                    <button
                      onClick={handleInstallClick}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install SpendWise</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPwaHelp?.(true)}
                      className="w-full bg-slate-100 border-2 border-slate-305 text-slate-700 dark:bg-slate-805 dark:border-slate-705 dark:text-slate-350 py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-white transition-all cursor-pointer shadow-xs"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>How to Install Manually</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section: Browser-Specific Help */}
              {!isStandalone && (
                <div className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-white/[0.04] rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Browser-Specific Guidance</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    If you don't see an option to install, your browser might not support direct installation or you can install it manually:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* Chrome Android */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#040914]/40 border border-slate-200 dark:border-white/[0.03] space-y-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span className="inline-block w-4 h-4 bg-indigo-100 dark:bg-[#8B5CF6]/10 text-indigo-600 dark:text-[#8B5CF6] text-[10px] font-black rounded-full text-center leading-4">C</span>
                        <span>Chrome Android</span>
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed pl-1">
                        <li>Tap Browser Menu (3 dots)</li>
                        <li>Select <strong className="text-slate-300">Install App</strong> or <strong className="text-slate-300">Add to Home Screen</strong></li>
                      </ul>
                    </div>

                    {/* Samsung Internet */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#040914]/40 border border-slate-200 dark:border-white/[0.03] space-y-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span className="inline-block w-4 h-4 bg-indigo-100 dark:bg-[#8B5CF6]/10 text-indigo-600 dark:text-[#8B5CF6] text-[10px] font-black rounded-full text-center leading-4">S</span>
                        <span>Samsung Internet</span>
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed pl-1">
                        <li>Open Menu (3 lines)</li>
                        <li>Select <strong className="text-slate-300">Add Page To</strong></li>
                        <li>Select <strong className="text-slate-300">Home Screen</strong></li>
                      </ul>
                    </div>

                    {/* Edge */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#040914]/40 border border-slate-200 dark:border-white/[0.03] space-y-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span className="inline-block w-4 h-4 bg-indigo-100 dark:bg-[#8B5CF6]/10 text-indigo-600 dark:text-[#8B5CF6] text-[10px] font-black rounded-full text-center leading-4">E</span>
                        <span>Edge</span>
                      </p>
                      <ul className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed pl-1">
                        <li>Open Menu (3 dots)</li>
                        <li>Tap <strong className="text-slate-300">Install App</strong></li>
                      </ul>
                    </div>
                  </div>

                  {/* iOS Help banner as extra value */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#040914]/40 border border-slate-200 dark:border-white/[0.03] space-y-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span className="inline-block w-4 h-4 bg-indigo-100 dark:bg-[#8B5CF6]/10 text-indigo-600 dark:text-[#8B5CF6] text-[10px] font-black rounded-full text-center leading-4">A</span>
                      <span>iOS Safari (Apple)</span>
                    </p>
                    <ul className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed pl-1">
                      <li>Tap the <strong className="text-slate-300">Share</strong> button at bottom toolbar (square with arrow up)</li>
                      <li>Scroll down and select <strong className="text-slate-300">Add to Home Screen</strong></li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Section: Hidden Diagnostics Panel Toggle */}
              <div className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-white/[0.04] rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">PWA Diagnostics</h4>
                  <button
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="text-xs font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-3 py-1.5 rounded-lg hover:bg-[#8B5CF6]/20 transition-all cursor-pointer"
                  >
                    {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  </button>
                </div>

                {showDiagnostics && (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-white/[0.03] font-mono select-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div className="flex items-center justify-between border-b border-white/[0.02] py-1.5">
                        <span className="text-slate-400">Manifest Loaded</span>
                        <span className="text-emerald-400 font-bold">✓</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/[0.02] py-1.5">
                        <span className="text-slate-400">Service Worker Active</span>
                        <span className={isSwActive ? 'text-emerald-400 font-bold' : 'text-slate-455'}>{isSwActive ? '✓' : 'Testing...'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/[0.02] py-1.5">
                        <span className="text-slate-400">Install Prompt Available</span>
                        <span className={showInstallBtn ? 'text-emerald-400 font-bold' : 'text-rose-450 font-bold'}>{showInstallBtn ? '✓' : '✖'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/[0.02] py-1.5">
                        <span className="text-slate-400">Standalone Mode</span>
                        <span className={isStandalone ? 'text-emerald-400 font-bold' : 'text-rose-450'}>{isStandalone ? '✓' : '✖'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/[0.02] py-1.5">
                        <span className="text-slate-400">Icons Valid</span>
                        <span className="text-emerald-400 font-bold">✓</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/[0.02] py-1.5">
                        <span className="text-slate-400">Installable</span>
                        <span className={showInstallBtn || isStandalone ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{showInstallBtn || isStandalone ? '✓' : '✖'}</span>
                      </div>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-500 text-center">
                      Browser UA: {navigator.userAgent.slice(0, 50)}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      </div>

       {/* COMPACT MODAL FOR ACCOUNT CREATION & PROFILE EDITS */}
      <AnimatePresence>
        {showAccountModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 15 }}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.1] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setShowAccountModal(false)}
                  className="p-1 px-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                <h4 className="text-base font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  {editingAcc ? 'Modify Account Details' : 'Initialize Bank Account'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-5 leading-normal">
                  Configure active currency positions, starting balance levels, and account groupings.
                </p>

                <form onSubmit={handleSaveAccount} className="space-y-4">
                  
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Account Title name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Salary, Cash Wallet"
                      className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-505"
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const isCreditAccount = ACCOUNT_TYPES.find(t => t.value === newAccType)?.category === 'Credit Account';
                      const isCustomAccount = ACCOUNT_TYPES.find(t => t.value === newAccType)?.category === 'Custom Account';
                      return (
                        <>
                          <div>
                      <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                        Account Position *
                      </label>
                      <select
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold cursor-pointer focus:outline-none focus:border-indigo-500"
                        value={newAccType}
                        onChange={(e) => setNewAccType(e.target.value as AccountType)}
                      >
                        {ACCOUNT_TYPES.map(t => (
                          <option key={t.value} value={t.value} className="text-slate-900 bg-white dark:text-slate-200 dark:bg-[#111827]">{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                        {isCreditAccount ? 'Starting Outstanding (₹) *' : 'Opening Balance (₹) *'}
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                        value={newAccBalance}
                        onChange={(e) => setNewAccBalance(e.target.value)}
                      />
                    </div>
                      {isCustomAccount && (
                        <div className="col-span-2 mt-2">
                          <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                            Custom Account Type Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Amazon Pay Later"
                            className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                            value={newAccCustomTypeName}
                            onChange={(e) => setNewAccCustomTypeName(e.target.value)}
                          />
                        </div>
                      )}
                      
                      {isCreditAccount && (
                        <div className="col-span-2 grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5 text-rose-500 dark:text-rose-400">
                              Credit Limit (₹) *
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="100000"
                              className="w-full h-10 px-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-bold font-mono focus:outline-none focus:border-rose-500 transition-colors"
                              value={newAccCreditLimit}
                              onChange={(e) => setNewAccCreditLimit(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                              Issuer / Provider
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. HDFC Bank"
                              className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                              value={newAccIssuer}
                              onChange={(e) => setNewAccIssuer(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                              Billing Date (1-31)
                            </label>
                            <input
                              type="number"
                              min="1" max="31"
                              className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                              value={newAccBillingDate}
                              onChange={(e) => setNewAccBillingDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                              Due Date (1-31)
                            </label>
                            <input
                              type="number"
                              min="1" max="31"
                              className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                              value={newAccDueDate}
                              onChange={(e) => setNewAccDueDate(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMoreAccountOptions(!showMoreAccountOptions)}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors focus:outline-none flex items-center space-x-1 cursor-pointer"
                    >
                      <span>More Customization Options</span>
                      <span className="text-[9px] leading-none">{showMoreAccountOptions ? '▲' : '▼'}</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {showMoreAccountOptions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden pt-2"
                      >
                        <div>
                          <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                            Bank / Issuer Entity Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC Bank, SBI Bank, Cash"
                            className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-505"
                            value={newAccBank}
                            onChange={(e) => setNewAccBank(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 dark:text-slate-404 uppercase tracking-widest mb-1.5">
                            Visual Accent Color Badge
                          </label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {ACCOUNT_COLORS.map(c => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setNewAccColor(c.value)}
                                className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer hover:scale-105 active:scale-95 ${
                                  newAccColor === c.value ? 'border-slate-900 dark:border-white scale-102' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-4 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-white/[0.04] mt-5">
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(false)}
                      className="h-10 border border-slate-250 dark:border-white/[0.08] bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      className="h-10 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {editingAcc ? 'Update Account' : 'Initialize Account'}
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION OVERLAY FOR BANK ACCOUNT DELETION */}
      <AnimatePresence>
        {accountDeletionConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.1] w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 dark:text-rose-455 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h4 className="text-base font-black text-rose-600 dark:text-rose-500 mb-2">Delete Account Confirmation</h4>
              
              <p className="text-xs text-slate-605 dark:text-slate-350 leading-relaxed font-semibold mb-4">
                Are you sure you want to completely discard the account <span className="text-slate-900 dark:text-slate-100 font-black">"{accountDeletionConfirm.name}"</span>?
              </p>

              {accountDeletionConfirm.isUsed && (
                <div className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-450 text-[10px] font-bold p-3 rounded-xl border border-orange-200 dark:border-orange-500/15 text-left mb-5 leading-normal">
                  ⚠️ Note: This account has active entries listed under your expenses or inflows. Deleting it maps the transactions as orphan accounts.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAccountDeletionConfirm(null)}
                  className="h-10 border border-slate-250 dark:border-white/[0.08] bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="h-10 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Settings;
