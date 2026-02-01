
import React, { useState, useMemo } from 'react';
import { Expense, CategoryItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '../utils';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  categories: CategoryItem[];
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit, categories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [confirmEditExpense, setConfirmEditExpense] = useState<Expense | null>(null);

  // Extract unique bank names
  const uniqueBanks = useMemo(() => {
    const banks = new Set(expenses.map(e => e.bankName).filter((name): name is string => !!name));
    return Array.from(banks).sort();
  }, [expenses]);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expense.bankName && expense.bankName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBank = selectedBank ? expense.bankName === selectedBank : true;

    return matchesSearch && matchesBank;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || '#94a3b8';
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No expenses tracked yet.</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add your first expense to see it here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Recent Transactions</h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{filteredExpenses.length} Total</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search description..."
                className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bank Filter Dropdown */}
            {uniqueBanks.length > 0 && (
              <div className="relative min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4v3H3V7z" />
                  </svg>
                </div>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium"
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
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
          {sortedExpenses.length > 0 ? (
            sortedExpenses.map((expense) => {
              const color = getCategoryColor(expense.category);
              return (
                <div key={expense.id} className="group flex items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 truncate flex items-center">
                      <span className="shrink-0 mr-1.5 opacity-50 scale-[0.7] inline-block md:hidden" style={{ color: color }}>
                        {getCategoryIcon(expense.category)}
                      </span>
                      {expense.description}
                      {expense.receiptImage && (
                        <svg className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <title>Receipt Attached</title>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </h4>
                    <div className="flex items-center text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      <span className="flex items-center">
                        <span className="mr-1 inline-block" style={{ color: color }}>
                          <div className="scale-[0.6] w-4 h-4 flex items-center justify-center">{getCategoryIcon(expense.category)}</div>
                        </span>
                        <span className="font-medium text-slate-500 dark:text-slate-400">{expense.category}</span>
                      </span>
                      {expense.bankName && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-indigo-500 dark:text-indigo-400 font-bold">{expense.bankName}</span>
                        </>
                      )}
                      <span className="mx-2">•</span>
                      <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <p className="font-bold text-slate-900 dark:text-white">-{formatCurrency(expense.amount)}</p>
                    <div className="flex items-center space-x-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setConfirmEditExpense(expense)}
                        className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight hover:text-indigo-700 dark:hover:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(expense.id)}
                        className="text-[10px] font-bold text-red-400 uppercase tracking-tight hover:text-red-600 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-6">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {selectedBank && !searchQuery ? `No transactions found for ${selectedBank}` : `No results found for "${searchQuery}"`}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try adjusting your filters.</p>
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
