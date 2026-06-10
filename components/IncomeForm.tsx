import React, { useState, useEffect } from 'react';
import { Income, Account, Transfer } from '../types';
import { formatCurrency, parseLocalDate } from '../utils';
import { motion } from 'motion/react';

interface IncomeFormProps {
  onAdd: (income: Income) => void;
  onClose: () => void;
  initialIncome?: Income;
  expenses: { amount: number; bankName?: string; date: string }[];
  incomes: { amount: number; bankName: string; date: string; id: string }[];
  accounts: Account[];
  transfers: Transfer[];
}

const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Variable Pay",
  "Incentive",
  "Reimbursement",
  "Freelance",
  "Gift",
  "Parent Support",
  "Refund",
  "Other Income"
];

const IncomeForm: React.FC<IncomeFormProps> = ({ 
  onAdd, 
  onClose, 
  initialIncome,
  expenses,
  incomes,
  accounts,
  transfers
}) => {
  const [amount, setAmount] = useState(initialIncome?.amount.toString() || '');
  
  // If editing an existing income that isn't in our default list, set the mode to Custom...
  const isInitialCustom = initialIncome && !INCOME_CATEGORIES.includes(initialIncome.category) ? true : false;
  const [category, setCategory] = useState(isInitialCustom ? 'Custom...' : (initialIncome?.category || 'Salary'));
  const [customCategoryName, setCustomCategoryName] = useState(isInitialCustom ? initialIncome!.category : '');
  
  const [date, setDate] = useState(initialIncome?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialIncome?.description || '');
  const [bankName, setBankName] = useState(initialIncome?.bankName || (accounts && accounts.length > 0 ? accounts[0].name : ''));

  // Salary Credit Module
  const [employerName, setEmployerName] = useState(initialIncome?.employerName || '');
  const [salaryMonth, setSalaryMonth] = useState(initialIncome?.salaryMonth || '');
  const [salaryBonus, setSalaryBonus] = useState(initialIncome?.bonus?.toString() || '');
  const [salaryAllocation, setSalaryAllocation] = useState<'none' | 'savings' | 'repay' | 'split'>('none');

  // Family Support Transferee
  const [receivedFrom, setReceivedFrom] = useState(initialIncome?.receivedFrom || 'Parents');

  // Automatically update the salaryMonth when the date changes
  useEffect(() => {
    if (category === 'Salary' && date && !salaryMonth) {
      const dt = parseLocalDate(date);
      const mName = dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      setSalaryMonth(mName);
    }
  }, [date, category, salaryMonth]);

  // Dynamic balance helper for selected bank account up to current day (excluding this edit entry if in edit mode)
  const previousBankBalance = React.useMemo(() => {
    if (!bankName) return 0;
    
    // Initial starting balance of the account
    const selectedAcc = accounts.find(a => a.name === bankName);
    let bal = selectedAcc ? selectedAcc.initialBalance : 0;

    // Sum of income in this bank account
    incomes.forEach(inc => {
      // Exclude current item we're editing (if applicable)
      if (initialIncome && inc.id === initialIncome.id) return;
      if (inc.bankName === bankName) {
        bal += inc.amount;
      }
    });

    // Subtract expenses from this bank account
    expenses.forEach(exp => {
      if (exp.bankName === bankName) {
        bal -= exp.amount;
      }
    });

    // Handle Transfer credits & debits for absolute accuracy
    transfers.forEach(tr => {
      const fromAcc = accounts.find(a => a.id === tr.fromAccountId);
      const toAcc = accounts.find(a => a.id === tr.toAccountId);
      
      if (fromAcc && fromAcc.name === bankName) {
        bal -= tr.amount;
      }
      if (toAcc && toAcc.name === bankName) {
        bal += tr.amount;
      }
    });

    return bal;
  }, [bankName, incomes, expenses, accounts, transfers, initialIncome]);

  const addedAmt = parseFloat(amount) || 0;
  const targetCurrentBalance = previousBankBalance + addedAmt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const finalCategory = category === 'Custom...' ? (customCategoryName.trim() || 'Other Income') : category;

    const payload: Income = {
      id: initialIncome?.id || Math.random().toString(36).substr(2, 9),
      amount: finalAmount,
      category: finalCategory,
      date,
      description: description || `${finalCategory} Credit`,
      bankName,
      previousBalance: previousBankBalance,
      currentBalance: previousBankBalance + finalAmount
    };

    if (category === 'Salary') {
      payload.isSalary = true;
      payload.employerName = employerName || 'Employer';
      payload.salaryMonth = salaryMonth || new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const bAmt = parseFloat(salaryBonus);
      if (!isNaN(bAmt) && bAmt > 0) {
        payload.bonus = bAmt;
      }
    }

    if (category.startsWith('Money Received')) {
      const parts = category.match(/\(([^)]+)\)/);
      const recipientType = (parts ? parts[1] : 'Other') as any;
      payload.receivedFrom = recipientType;
    }

    onAdd(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">{initialIncome ? 'Edit Income Record' : 'Record New Income'}</h3>
            <p className="text-emerald-100 text-xs mt-0.5">Keep cash flow records and account growth accurate</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              Income Credit Amount (₹) *
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500 font-bold font-mono text-lg select-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                className="block w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-black font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Income Category *
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Custom...') {
                    setCustomCategoryName('');
                  }
                }}
              >
                {[...INCOME_CATEGORIES, "Custom..."].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              {category === 'Custom...' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Friend, Side Hustle..."
                    className="w-full px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-500/30 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all placeholder:text-emerald-600/40 dark:placeholder:text-emerald-500/40"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Credit Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Account destination */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              Receiving Bank Account / Method *
            </label>
            {accounts && accounts.length > 0 ? (
              <div className="relative">
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer appearance-none"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                >
                  <option value="">Choose Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({acc.bankName !== acc.name ? acc.bankName : ''})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            ) : (
              <div className="text-sm text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>No accounts set up yet. Add one first in Settings.</span>
                <a href="#/settings" className="text-xs font-black underline flex items-center hover:text-emerald-700 shrink-0" onClick={onClose}>
                  Go to Settings &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Special Custom fields for "Salary" Credit Tracking */}
          {category === 'Salary' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 overflow-hidden"
            >
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs font-extrabold uppercase tracking-wide">Special Salary Specifications</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. ABC Company"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Salary Month
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. June 2026"
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Bonus/Incentive Included within this month salary (Optional) (₹)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. 40000"
                  value={salaryBonus}
                  onChange={(e) => setSalaryBonus(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Post-Credit Action (Optional Workflow)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`flex items-center p-2 rounded-xl border text-xs cursor-pointer transition-all ${salaryAllocation === 'savings' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-500/50 dark:text-emerald-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                    <input type="radio" name="allocation" className="hidden" checked={salaryAllocation === 'savings'} onChange={() => setSalaryAllocation('savings')} />
                    <span className="font-semibold">Allocate to Savings</span>
                  </label>
                  <label className={`flex items-center p-2 rounded-xl border text-xs cursor-pointer transition-all ${salaryAllocation === 'repay' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-500/50 dark:text-emerald-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                    <input type="radio" name="allocation" className="hidden" checked={salaryAllocation === 'repay'} onChange={() => setSalaryAllocation('repay')} />
                    <span className="font-semibold">Repay Credit</span>
                  </label>
                  <label className={`flex items-center p-2 rounded-xl border text-xs cursor-pointer transition-all ${salaryAllocation === 'split' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-500/50 dark:text-emerald-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                    <input type="radio" name="allocation" className="hidden" checked={salaryAllocation === 'split'} onChange={() => setSalaryAllocation('split')} />
                    <span className="font-semibold">Split Accounts</span>
                  </label>
                </div>
                {salaryAllocation !== 'none' && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                    You can manage this action from the Transfer Hub in the Dashboard after recording this income.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Description note */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              Description / Credit Note
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400/80"
              placeholder={`e.g. Monthly stipend, reimbursement for travel...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Live Balance growth tracker - Fulfill Section 3 */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2.5">
              Est. Credit Cash Flow
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-normal">Prev. Balance</span>
                <p className="text-xs font-extrabold font-mono text-slate-600 dark:text-slate-350 mt-1">
                  {formatCurrency(previousBankBalance)}
                </p>
              </div>
              <div className="border-x border-slate-200/50 dark:border-slate-800/60">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-normal">Added Funds</span>
                <p className="text-xs font-extrabold font-mono text-emerald-600 dark:text-emerald-450 mt-1">
                  +{formatCurrency(addedAmt)}
                </p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-normal">New Balance</span>
                <p className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {formatCurrency(targetCurrentBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none cursor-pointer text-center"
            >
              {initialIncome ? 'Save Changes' : 'Record Income'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default IncomeForm;
