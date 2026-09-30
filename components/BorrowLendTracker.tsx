import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LendMoneyItem, BorrowMoneyItem } from '../types';
import { formatCurrency } from '../utils';
import { Plus, Users, HandCoins, ArrowUpRight, ArrowDownLeft, Calendar, Image as ImageIcon, Eye, Trash2, CheckCircle2, Clock, X } from 'lucide-react';

interface BorrowLendTrackerProps {
  lentList: LendMoneyItem[];
  borrowedList: BorrowMoneyItem[];
  onAddLent: (item: Omit<LendMoneyItem, 'id'>) => void;
  onEditLent: (id: string, item: Partial<LendMoneyItem>) => void;
  onDeleteLent: (id: string) => void;
  onRecordLentReturn: (id: string, returnAmount: number) => void;

  onAddBorrowed: (item: Omit<BorrowMoneyItem, 'id'>) => void;
  onEditBorrowed: (id: string, item: Partial<BorrowMoneyItem>) => void;
  onDeleteBorrowed: (id: string) => void;
  onRecordBorrowRepayment: (id: string, repayAmount: number) => void;
}

export const BorrowLendTracker: React.FC<BorrowLendTrackerProps> = ({
  lentList,
  borrowedList,
  onAddLent,
  onEditLent,
  onDeleteLent,
  onRecordLentReturn,
  onAddBorrowed,
  onEditBorrowed,
  onDeleteBorrowed,
  onRecordBorrowRepayment
}) => {
  const [activeTab, setActiveTab] = useState<'lent' | 'borrowed'>('lent');
  const [showLentModal, setShowLentModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<{ id: string; name: string; pending: number; isLent: boolean } | null>(null);
  const [returnAmountInput, setReturnAmountInput] = useState('');
  const [viewSnippet, setViewSnippet] = useState<string | null>(null);

  // Form states for Lent (Given to Friend / Relative)
  const [borrowerName, setBorrowerName] = useState('');
  const [relationship, setRelationship] = useState<LendMoneyItem['relationship']>('Friend');
  const [lentAmount, setLentAmount] = useState('');
  const [dateGiven, setDateGiven] = useState(new Date().toISOString().split('T')[0]);
  const [promisedReturnDate, setPromisedReturnDate] = useState('');
  const [phone, setPhone] = useState('');
  const [lentNotes, setLentNotes] = useState('');
  const [lentSnippet, setLentSnippet] = useState<string | undefined>(undefined);
  const lentFileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Borrowed
  const [lenderName, setLenderName] = useState('');
  const [borrowRelationship, setBorrowRelationship] = useState('Friend');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [repaymentDueDate, setRepaymentDueDate] = useState('');
  const [borrowNotes, setBorrowNotes] = useState('');
  const [borrowSnippet, setBorrowSnippet] = useState<string | undefined>(undefined);
  const borrowFileInputRef = useRef<HTMLInputElement>(null);

  // Calculations: Money Given (Lent)
  const totalLent = lentList.reduce((s, i) => s + i.amount, 0);
  const totalLentReturned = lentList.reduce((s, i) => s + (i.returnedAmount || 0), 0);
  const pendingToReceive = Math.max(0, totalLent - totalLentReturned);

  // Calculations: Money Borrowed
  const totalBorrowed = borrowedList.reduce((s, i) => s + i.amount, 0);
  const totalBorrowedRepaid = borrowedList.reduce((s, i) => s + (i.repaidAmount || 0), 0);
  const pendingToPay = Math.max(0, totalBorrowed - totalBorrowedRepaid);

  // File upload handlers
  const handleLentSnippet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLentSnippet(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBorrowSnippet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setBorrowSnippet(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(lentAmount);
    if (!borrowerName.trim() || isNaN(amt) || amt <= 0) {
      alert('Please enter recipient name and a valid amount.');
      return;
    }

    onAddLent({
      borrowerName: borrowerName.trim(),
      relationship,
      amount: amt,
      dateGiven,
      promisedReturnDate: promisedReturnDate || undefined,
      returnedAmount: 0,
      status: 'pending',
      snippetImage: lentSnippet,
      phone: phone.trim() || undefined,
      notes: lentNotes.trim() || undefined
    });

    // Reset
    setBorrowerName('');
    setRelationship('Friend');
    setLentAmount('');
    setDateGiven(new Date().toISOString().split('T')[0]);
    setPromisedReturnDate('');
    setPhone('');
    setLentNotes('');
    setLentSnippet(undefined);
    setShowLentModal(false);
  };

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(borrowAmount);
    if (!lenderName.trim() || isNaN(amt) || amt <= 0) {
      alert('Please enter lender name and a valid amount.');
      return;
    }

    onAddBorrowed({
      lenderName: lenderName.trim(),
      relationship: borrowRelationship,
      amount: amt,
      borrowDate,
      repaymentDueDate: repaymentDueDate || undefined,
      repaidAmount: 0,
      status: 'pending',
      snippetImage: borrowSnippet,
      notes: borrowNotes.trim() || undefined
    });

    // Reset
    setLenderName('');
    setBorrowRelationship('Friend');
    setBorrowAmount('');
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setRepaymentDueDate('');
    setBorrowNotes('');
    setBorrowSnippet(undefined);
    setShowBorrowModal(false);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;
    const amt = parseFloat(returnAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (showReturnModal.isLent) {
      onRecordLentReturn(showReturnModal.id, amt);
    } else {
      onRecordBorrowRepayment(showReturnModal.id, amt);
    }

    setShowReturnModal(null);
    setReturnAmountInput('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🤝 Borrow & Lend Tracker</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track money given to friends/relatives with date & receipt snippets, plus money you borrowed
          </p>
        </div>

        {/* Tab switchers & action button */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('lent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'lent'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Money Given (Friends & Relatives)
            </button>
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'borrowed'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Money Borrowed
            </button>
          </div>

          <Link
            to="/split-bill"
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
          >
            <span>👥 Split a Bill</span>
          </Link>

          <button
            onClick={() => activeTab === 'lent' ? setShowLentModal(true) : setShowBorrowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'lent' ? 'Give Money' : 'Log Borrowed'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards based on active tab */}
      {activeTab === 'lent' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Given to Others</span>
            <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalLent)}
            </h3>
            <span className="text-xs font-semibold text-indigo-500 mt-1 block">
              Across {lentList.length} loans to friends/family
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Pending To Receive</span>
            <h3 className="text-2xl font-black font-mono text-amber-500">
              {formatCurrency(pendingToReceive)}
            </h3>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              {lentList.filter(l => l.status !== 'returned').length} outstanding returns
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Returned Back</span>
            <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-450">
              {formatCurrency(totalLentReturned)}
            </h3>
            <span className="text-xs font-semibold text-emerald-500 mt-1 block">
              Successfully recovered
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Borrowed</span>
            <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalBorrowed)}
            </h3>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              Across {borrowedList.length} borrowings
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Pending To Repay</span>
            <h3 className="text-2xl font-black font-mono text-rose-500">
              {formatCurrency(pendingToPay)}
            </h3>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              Your liabilities to pay back
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Repaid So Far</span>
            <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-450">
              {formatCurrency(totalBorrowedRepaid)}
            </h3>
            <span className="text-xs font-semibold text-emerald-500 mt-1 block">
              Cleared obligations
            </span>
          </div>
        </div>
      )}

      {/* Main List Area */}
      {activeTab === 'lent' ? (
        /* MONEY GIVEN TO FRIENDS OR RELATIVES */
        lentList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Money Lent Records</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              If you give money to a friend or relative, log the date, promised return date, and attach a transfer screenshot or chat snippet!
            </p>
            <button
              onClick={() => setShowLentModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              + Record Money Given
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lentList.map((item) => {
              const pending = Math.max(0, item.amount - (item.returnedAmount || 0));
              const isCleared = pending === 0 || item.status === 'returned';

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{item.borrowerName}</h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.relationship}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCleared
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : item.returnedAmount > 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isCleared ? 'Returned' : item.returnedAmount > 0 ? 'Partial' : 'Pending'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Given on {item.dateGiven}
                        {item.promisedReturnDate && ` • Promised: ${item.promisedReturnDate}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block">Total Given</span>
                    </div>
                  </div>

                  {/* Return status bar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Returned Back</span>
                      <span className="font-black font-mono text-emerald-600 dark:text-emerald-450 text-sm">
                        {formatCurrency(item.returnedAmount || 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Balance</span>
                      <span className={`font-black font-mono text-sm ${pending > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {formatCurrency(pending)}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-xl">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Actions & Snippet button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      {item.snippetImage && (
                        <button
                          onClick={() => setViewSnippet(item.snippetImage!)}
                          className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Snippet</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {!isCleared && (
                        <button
                          onClick={() => setShowReturnModal({ id: item.id, name: item.borrowerName, pending, isLent: true })}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Record Return</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete record for ${item.borrowerName}?`)) {
                            onDeleteLent(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* MONEY BORROWED FROM OTHERS */
        borrowedList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Borrowed Records</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Track money you borrowed from colleagues, friends, or relatives so you remember to repay on time.
            </p>
            <button
              onClick={() => setShowBorrowModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              + Log Borrowed Money
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {borrowedList.map((item) => {
              const pending = Math.max(0, item.amount - (item.repaidAmount || 0));
              const isCleared = pending === 0 || item.status === 'settled';

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{item.lenderName}</h4>
                        {item.relationship && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.relationship}
                          </span>
                        )}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCleared
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : item.repaidAmount > 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isCleared ? 'Repaid' : item.repaidAmount > 0 ? 'Partial' : 'Pending'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Borrowed on {item.borrowDate}
                        {item.repaymentDueDate && ` • Due: ${item.repaymentDueDate}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block">Borrowed</span>
                    </div>
                  </div>

                  {/* Repayment progress */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Repaid So Far</span>
                      <span className="font-black font-mono text-emerald-600 dark:text-emerald-450 text-sm">
                        {formatCurrency(item.repaidAmount || 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending To Pay</span>
                      <span className={`font-black font-mono text-sm ${pending > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {formatCurrency(pending)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      {item.snippetImage && (
                        <button
                          onClick={() => setViewSnippet(item.snippetImage!)}
                          className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Snippet</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {!isCleared && (
                        <button
                          onClick={() => setShowReturnModal({ id: item.id, name: item.lenderName, pending, isLent: false })}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Repay</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete borrowed record for ${item.lenderName}?`)) {
                            onDeleteBorrowed(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Give Money to Friend / Relative Modal */}
      {showLentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Give Money to Friend or Relative
              </h3>
              <button
                onClick={() => setShowLentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma, Uncle Suresh"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Relationship *
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                    <option value="Family">Family Member</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Amount Given (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="5000"
                    value={lentAmount}
                    onChange={(e) => setLentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Date Given *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateGiven}
                    onChange={(e) => setDateGiven(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Promised Return Date
                  </label>
                  <input
                    type="date"
                    value={promisedReturnDate}
                    onChange={(e) => setPromisedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Upload Snippet / Screenshot */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Upload Payment Snippet / Receipt / Chat Proof
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={lentFileInputRef}
                  onChange={handleLentSnippet}
                  className="hidden"
                />

                {lentSnippet ? (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={lentSnippet} alt="Snippet" className="w-12 h-12 object-cover rounded-xl" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Snippet uploaded</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLentSnippet(undefined)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => lentFileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer bg-slate-50 dark:bg-slate-950"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Transfer Snippet / Screenshot</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Purpose / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. For medical emergency, will return next salary"
                  value={lentNotes}
                  onChange={(e) => setLentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Record Money Given
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Borrowed Money Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Log Money Borrowed
              </h3>
              <button
                onClick={() => setShowBorrowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBorrowSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Borrowed From (Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram, Cousin Amit, Office Colleague"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="Friend / Relative"
                    value={borrowRelationship}
                    onChange={(e) => setBorrowRelationship(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Amount Borrowed (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="10000"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Borrow Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Repayment Due Date
                  </label>
                  <input
                    type="date"
                    value={repaymentDueDate}
                    onChange={(e) => setRepaymentDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Snippet / Proof */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Upload Payment Snippet / Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={borrowFileInputRef}
                  onChange={handleBorrowSnippet}
                  className="hidden"
                />

                {borrowSnippet ? (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={borrowSnippet} alt="Snippet" className="w-12 h-12 object-cover rounded-xl" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Snippet uploaded</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBorrowSnippet(undefined)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => borrowFileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-violet-500 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer bg-slate-50 dark:bg-slate-950"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Borrow Snippet / Transfer Proof</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance for rent deposit"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Log Borrowed Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Return / Repayment Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {showReturnModal.isLent ? 'Record Money Returned' : 'Record Repayment'}
              </h3>
              <button
                onClick={() => setShowReturnModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {showReturnModal.isLent
                  ? `Recording payment received from ${showReturnModal.name}. Current pending: ${formatCurrency(showReturnModal.pending)}`
                  : `Recording repayment made to ${showReturnModal.name}. Current pending: ${formatCurrency(showReturnModal.pending)}`}
              </p>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Amount Received / Paid (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={showReturnModal.pending}
                  step="any"
                  placeholder={showReturnModal.pending.toString()}
                  value={returnAmountInput}
                  onChange={(e) => setReturnAmountInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirm & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snippet Lightbox Preview */}
      {viewSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden p-4 space-y-3 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-white font-bold text-sm">Receipt / Snippet Proof</h4>
              <button
                onClick={() => setViewSnippet(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-black flex items-center justify-center">
              <img src={viewSnippet} alt="Full Snippet" className="max-w-full max-h-[65vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BorrowLendTracker;
