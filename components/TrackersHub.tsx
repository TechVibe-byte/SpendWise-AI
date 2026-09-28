import React, { useState, useRef } from 'react';
import { EMITrackerItem, SalaryTrackerItem, BorrowMoneyItem, LendMoneyItem } from '../types';
import { formatCurrency } from '../utils';
import { 
  Plus, Calendar, CheckCircle2, Clock, Landmark, Briefcase, 
  HandCoins, Users, ArrowUpRight, ArrowDownLeft, Image as ImageIcon, 
  Eye, X, ExternalLink, ChevronRight, UploadCloud 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrackersHubProps {
  emis: EMITrackerItem[];
  onAddEmi: (item: Omit<EMITrackerItem, 'id'>) => void;
  onEditEmi: (id: string, item: Partial<EMITrackerItem>) => void;
  onDeleteEmi: (id: string) => void;
  onRecordEmiPayment: (id: string) => void;

  salaries: SalaryTrackerItem[];
  onAddSalary: (item: Omit<SalaryTrackerItem, 'id'>) => void;
  onEditSalary: (id: string, item: Partial<SalaryTrackerItem>) => void;
  onDeleteSalary: (id: string) => void;

  borrowedList: BorrowMoneyItem[];
  onAddBorrowed: (item: Omit<BorrowMoneyItem, 'id'>) => void;
  onEditBorrowed: (id: string, item: Partial<BorrowMoneyItem>) => void;
  onDeleteBorrowed: (id: string) => void;
  onRecordBorrowRepayment: (id: string, repayAmount: number) => void;

  lentList: LendMoneyItem[];
  onAddLent: (item: Omit<LendMoneyItem, 'id'>) => void;
  onEditLent: (id: string, item: Partial<LendMoneyItem>) => void;
  onDeleteLent: (id: string) => void;
  onRecordLentReturn: (id: string, returnAmount: number) => void;
}

export const TrackersHub: React.FC<TrackersHubProps> = ({
  emis,
  onAddEmi,
  onRecordEmiPayment,
  salaries,
  onAddSalary,
  borrowedList,
  onAddBorrowed,
  onRecordBorrowRepayment,
  lentList,
  onAddLent,
  onEditLent,
  onRecordLentReturn
}) => {
  const [activeTab, setActiveTab] = useState<'emi' | 'salary' | 'borrow' | 'lent'>('emi');

  // Modals state
  const [showAddEmiModal, setShowAddEmiModal] = useState(false);
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);
  const [showAddBorrowModal, setShowAddBorrowModal] = useState(false);
  const [showAddLentModal, setShowAddLentModal] = useState(false);
  const [viewSnippetUrl, setViewSnippetUrl] = useState<string | null>(null);
  const [showRepayModal, setShowRepayModal] = useState<{ id: string; name: string; pending: number; isLent: boolean } | null>(null);
  const [repayInput, setRepayInput] = useState('');

  // Form: EMI
  const [emiTitle, setEmiTitle] = useState('');
  const [emiLender, setEmiLender] = useState('HDFC Bank');
  const [emiAmount, setEmiAmount] = useState('');
  const [emiTenure, setEmiTenure] = useState('12');
  const [emiDueDay, setEmiDueDay] = useState('5');

  // Form: Salary
  const [salMonth, setSalMonth] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString(undefined, { month: 'long' })} ${d.getFullYear()}`;
  });
  const [salEmployer, setSalEmployer] = useState('');
  const [salAmount, setSalAmount] = useState('');
  const [salDate, setSalDate] = useState(new Date().toISOString().split('T')[0]);
  const [salSnippet, setSalSnippet] = useState<string | undefined>(undefined);
  const salFileRef = useRef<HTMLInputElement>(null);

  // Form: Borrow
  const [borrowLender, setBorrowLender] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [borrowDueDate, setBorrowDueDate] = useState('');

  // Form: Give Money (Lent)
  const [lentName, setLentName] = useState('');
  const [lentRelation, setLentRelation] = useState<LendMoneyItem['relationship']>('Friend');
  const [lentAmount, setLentAmount] = useState('');
  const [lentDate, setLentDate] = useState(new Date().toISOString().split('T')[0]);
  const [lentReturnDate, setLentReturnDate] = useState('');
  const [lentNotes, setLentNotes] = useState('');
  const [lentSnippet, setLentSnippet] = useState<string | undefined>(undefined);
  const lentFileRef = useRef<HTMLInputElement>(null);
  const quickSnippetFileRef = useRef<HTMLInputElement>(null);
  const [quickSnippetTargetId, setQuickSnippetTargetId] = useState<string | null>(null);

  // Metrics calculations
  const activeEmis = emis.filter(e => e.status === 'active');
  const totalMonthlyEmi = activeEmis.reduce((s, e) => s + e.emiAmount, 0);

  const curMonthPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSalary = salaries.find(s => s.creditDate.startsWith(curMonthPrefix));

  const totalBorrowed = borrowedList.reduce((s, b) => s + b.amount, 0);
  const totalBorrowedRepaid = borrowedList.reduce((s, b) => s + (b.repaidAmount || 0), 0);
  const pendingBorrowed = Math.max(0, totalBorrowed - totalBorrowedRepaid);

  const totalLent = lentList.reduce((s, l) => s + l.amount, 0);
  const totalLentReturned = lentList.reduce((s, l) => s + (l.returnedAmount || 0), 0);
  const pendingLent = Math.max(0, totalLent - totalLentReturned);

  // Handlers
  const handleCreateEmi = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(emiAmount);
    const tenure = parseInt(emiTenure, 10);
    const dueDay = parseInt(emiDueDay, 10) || 1;
    if (!emiTitle.trim() || isNaN(amt) || amt <= 0 || isNaN(tenure) || tenure <= 0) return;

    onAddEmi({
      title: emiTitle.trim(),
      lender: emiLender,
      emiAmount: amt,
      totalTenureMonths: tenure,
      paidTenureMonths: 0,
      dueDayOfMonth: dueDay,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
    setEmiTitle('');
    setEmiAmount('');
    setShowAddEmiModal(false);
  };

  const handleCreateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(salAmount);
    if (!salEmployer.trim() || isNaN(amt) || amt <= 0) return;

    onAddSalary({
      month: salMonth,
      creditDate: salDate,
      employerName: salEmployer.trim(),
      baseSalary: amt,
      netCredited: amt,
      status: 'credited',
      payslipSnippet: salSnippet
    });
    setSalEmployer('');
    setSalAmount('');
    setSalSnippet(undefined);
    setShowAddSalaryModal(false);
  };

  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(borrowAmount);
    if (!borrowLender.trim() || isNaN(amt) || amt <= 0) return;

    onAddBorrowed({
      lenderName: borrowLender.trim(),
      amount: amt,
      borrowDate,
      repaymentDueDate: borrowDueDate || undefined,
      repaidAmount: 0,
      status: 'pending'
    });
    setBorrowLender('');
    setBorrowAmount('');
    setShowAddBorrowModal(false);
  };

  const handleCreateLent = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(lentAmount);
    if (!lentName.trim() || isNaN(amt) || amt <= 0) return;

    onAddLent({
      borrowerName: lentName.trim(),
      relationship: lentRelation,
      amount: amt,
      dateGiven: lentDate,
      promisedReturnDate: lentReturnDate || undefined,
      returnedAmount: 0,
      status: 'pending',
      snippetImage: lentSnippet,
      notes: lentNotes.trim() || undefined
    });
    setLentName('');
    setLentAmount('');
    setLentSnippet(undefined);
    setLentNotes('');
    setShowAddLentModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | undefined) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleQuickSnippetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && quickSnippetTargetId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onEditLent(quickSnippetTargetId, { snippetImage: reader.result as string });
        setQuickSnippetTargetId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRepayModal) return;
    const amt = parseFloat(repayInput);
    if (isNaN(amt) || amt <= 0) return;

    if (showRepayModal.isLent) {
      onRecordLentReturn(showRepayModal.id, amt);
    } else {
      onRecordBorrowRepayment(showRepayModal.id, amt);
    }
    setShowRepayModal(null);
    setRepayInput('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
      {/* Header and Tracker Tab Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Financial Trackers
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Free Essential
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your EMIs, salary credits, borrowed debts, and money given to friends & relatives
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('emi')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'emi'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💳 EMIs</span>
            {activeEmis.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 font-black text-indigo-600 dark:text-indigo-400">
                {activeEmis.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('salary')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'salary'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💼 Salary</span>
            {thisMonthSalary && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('borrow')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'borrow'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🤝 Borrowed</span>
            {pendingBorrowed > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(pendingBorrowed)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('lent')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'lent'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🎁 Given / Friends</span>
            {pendingLent > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950 font-black text-violet-600 dark:text-violet-400">
                {formatCurrency(pendingLent)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: EMI TRACKER */}
      {activeTab === 'emi' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Outflow</span>
              <span className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {formatCurrency(totalMonthlyEmi)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active EMIs</span>
              <span className="text-lg md:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {activeEmis.length} {activeEmis.length === 1 ? 'Loan' : 'Loans'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Action</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Add or manage loans</span>
              </div>
              <button
                onClick={() => setShowAddEmiModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add EMI</span>
              </button>
            </div>
          </div>

          {/* EMI Items List */}
          {emis.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No active EMIs added yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Track gadget loans, vehicle finance, or personal EMIs.</p>
              <button
                onClick={() => setShowAddEmiModal(true)}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + Add First EMI
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {emis.map((emi) => {
                const pct = Math.min(100, Math.round((emi.paidTenureMonths / emi.totalTenureMonths) * 100));
                return (
                  <div
                    key={emi.id}
                    className="p-3.5 bg-slate-50/70 dark:bg-slate-850 border border-slate-150/10 dark:border-slate-800/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{emi.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                          {emi.lender}
                        </span>
                        {emi.status === 'completed' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-black">
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span>Due Day: <strong className="text-slate-700 dark:text-slate-300 font-mono">{emi.dueDayOfMonth}th</strong> of month</span>
                        <span>•</span>
                        <span>Tenure: <strong className="text-slate-700 dark:text-slate-300 font-mono">{emi.paidTenureMonths}/{emi.totalTenureMonths}</strong> ({pct}%)</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full sm:w-60 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block font-semibold">Monthly EMI</span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {formatCurrency(emi.emiAmount)}
                        </span>
                      </div>

                      {emi.status === 'active' && (
                        <button
                          onClick={() => onRecordEmiPayment(emi.id)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 transition-colors cursor-pointer"
                          title="Record Monthly Payment"
                        >
                          ✓ Pay EMI
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-400">Auto-deductions tracked in monthly spend</span>
            <Link to="/emi" className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline">
              <span>Open Full EMI Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY TRACKER */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">This Month Status</span>
              <span className={`text-base font-black mt-0.5 flex items-center space-x-1.5 ${thisMonthSalary ? 'text-emerald-600' : 'text-amber-500'}`}>
                {thisMonthSalary ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                <span>{thisMonthSalary ? 'Credited' : 'Pending'}</span>
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latest Net Credited</span>
              <span className="text-lg md:text-xl font-black font-mono text-emerald-600 dark:text-emerald-450 mt-0.5 block">
                {salaries.length > 0 ? formatCurrency(salaries[0].netCredited) : '₹0'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary Action</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Log monthly pay</span>
              </div>
              <button
                onClick={() => setShowAddSalaryModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Salary</span>
              </button>
            </div>
          </div>

          {/* Salaries List */}
          {salaries.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No salary records logged yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Track your monthly payroll with employer info and payslip snippets.</p>
              <button
                onClick={() => setShowAddSalaryModal(true)}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + Log Salary
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {salaries.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 bg-slate-50/70 dark:bg-slate-850 border border-slate-150/10 dark:border-slate-800/70 rounded-2xl flex items-center justify-between hover:border-emerald-500/30 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{s.month}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold">
                        {s.employerName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Credit Date: {s.creditDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {s.payslipSnippet && (
                      <button
                        onClick={() => setViewSnippetUrl(s.payslipSnippet || null)}
                        className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                        title="View Payslip Snippet"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-semibold">Credited</span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-450">
                        +{formatCurrency(s.netCredited)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-400">Keep payroll history secure and offline</span>
            <Link to="/salary" className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline">
              <span>Open Salary Manager</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 3: BORROW MONEY TRACKER */}
      {activeTab === 'borrow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Borrowed</span>
              <span className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {formatCurrency(totalBorrowed)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending to Repay</span>
              <span className="text-lg md:text-xl font-black font-mono text-rose-500 mt-0.5 block">
                {formatCurrency(pendingBorrowed)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Debt Action</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Record a loan taken</span>
              </div>
              <button
                onClick={() => setShowAddBorrowModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Borrowed</span>
              </button>
            </div>
          </div>

          {borrowedList.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <HandCoins className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No borrowed money logged</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Keep track of money borrowed from friends, family or lenders.</p>
              <button
                onClick={() => setShowAddBorrowModal(true)}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + Log Borrowed Money
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {borrowedList.map((b) => {
                const pending = Math.max(0, b.amount - (b.repaidAmount || 0));
                return (
                  <div
                    key={b.id}
                    className="p-3.5 bg-slate-50/70 dark:bg-slate-850 border border-slate-150/10 dark:border-slate-800/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">From: {b.lenderName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${b.status === 'settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.status === 'settled' ? 'Settled' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                        <span>Borrowed: {b.borrowDate}</span>
                        {b.repaymentDueDate && <span>• Due: {b.repaymentDueDate}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block">Pending to Repay</span>
                        <span className="text-base font-black font-mono text-rose-500">
                          {formatCurrency(pending)}
                        </span>
                      </div>

                      {b.status !== 'settled' && (
                        <button
                          onClick={() => {
                            setShowRepayModal({ id: b.id, name: b.lenderName, pending, isLent: false });
                            setRepayInput(pending.toString());
                          }}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Repay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-400">Clear liabilities and avoid awkward reminders</span>
            <Link to="/borrow-lend" className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline">
              <span>Open Borrow & Lend Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 4: GIVEN TO FRIENDS OR RELATIVES (LENT TRACKER WITH DATE & SNIPPET) */}
      {activeTab === 'lent' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Given to Others</span>
              <span className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {formatCurrency(totalLent)}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Return</span>
              <span className="text-lg md:text-xl font-black font-mono text-amber-500 mt-0.5 block">
                {formatCurrency(pendingLent)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Friend/Relative</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Give with date & receipt snippet</span>
              </div>
              <button
                onClick={() => setShowAddLentModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Give Money</span>
              </button>
            </div>
          </div>

          {lentList.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No money given to friends or relatives</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Record who you gave money to, when it was given, and upload transfer screenshot snippets.
              </p>
              <button
                onClick={() => setShowAddLentModal(true)}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + Give Money (With Date & Snippet)
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {lentList.map((item) => {
                const pending = Math.max(0, item.amount - (item.returnedAmount || 0));
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/70 dark:bg-slate-850 border border-slate-150/10 dark:border-slate-800/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-violet-500/30 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{item.borrowerName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold">
                          {item.relationship}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${item.status === 'returned' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status === 'returned' ? 'Returned' : 'Pending'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>📅 Given on: <strong className="text-slate-700 dark:text-slate-300">{item.dateGiven}</strong></span>
                        {item.promisedReturnDate && (
                          <span>• Expected: <strong className="text-slate-700 dark:text-slate-300">{item.promisedReturnDate}</strong></span>
                        )}
                        {item.notes && <span className="italic">"{item.notes}"</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800">
                      {/* Snippet preview or upload button */}
                      {item.snippetImage ? (
                        <button
                          onClick={() => setViewSnippetUrl(item.snippetImage || null)}
                          className="px-2.5 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 flex items-center space-x-1 text-xs font-bold cursor-pointer hover:bg-violet-100"
                          title="View Receipt Snippet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Snippet</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setQuickSnippetTargetId(item.id);
                            quickSnippetFileRef.current?.click();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center space-x-1 text-[11px] font-semibold cursor-pointer"
                          title="Upload Snippet"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>+ Snippet</span>
                        </button>
                      )}

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block">Pending Return</span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {formatCurrency(pending)}
                        </span>
                      </div>

                      {item.status !== 'returned' && (
                        <button
                          onClick={() => {
                            setShowRepayModal({ id: item.id, name: item.borrowerName, pending, isLent: true });
                            setRepayInput(pending.toString());
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                        >
                          Received
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-400">Keep receipts and dates organized for friends & family</span>
            <Link to="/borrow-lend" className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline">
              <span>Open Borrow & Lend Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Hidden file input for quick snippet upload */}
      <input
        type="file"
        ref={quickSnippetFileRef}
        accept="image/*"
        className="hidden"
        onChange={handleQuickSnippetUpload}
      />

      {/* MODAL: ADD EMI */}
      {showAddEmiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Add New EMI</h4>
              <button onClick={() => setShowAddEmiModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEmi} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Loan Title / Item</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 16 Pro, Bike Loan"
                  value={emiTitle}
                  onChange={(e) => setEmiTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Lender / Bank</label>
                  <input
                    type="text"
                    value={emiLender}
                    onChange={(e) => setEmiLender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 4500"
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Total Tenure (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    required
                    value={emiTenure}
                    onChange={(e) => setEmiTenure(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={emiDueDay}
                    onChange={(e) => setEmiDueDay(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmiModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md cursor-pointer hover:bg-indigo-700"
                >
                  Save EMI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG SALARY */}
      {showAddSalaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Log Salary Credit</h4>
              <button onClick={() => setShowAddSalaryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSalary} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Employer / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Infosys, Tech Corp"
                  value={salEmployer}
                  onChange={(e) => setSalEmployer(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Salary Month</label>
                  <input
                    type="text"
                    required
                    value={salMonth}
                    onChange={(e) => setSalMonth(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Net Credited (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 75000"
                    value={salAmount}
                    onChange={(e) => setSalAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Credit Date</label>
                <input
                  type="date"
                  required
                  value={salDate}
                  onChange={(e) => setSalDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Payslip Snippet / Screenshot (Optional)</label>
                <input
                  type="file"
                  ref={salFileRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setSalSnippet)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:dark:bg-slate-800 file:text-indigo-600 dark:file:text-indigo-400"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSalaryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md cursor-pointer hover:bg-indigo-700"
                >
                  Save Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG BORROWED */}
      {showAddBorrowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Record Money Borrowed</h4>
              <button onClick={() => setShowAddBorrowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBorrow} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Borrowed From (Person / Lender)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh, Rahul, Uncle"
                  value={borrowLender}
                  onChange={(e) => setBorrowLender(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Borrow Date</label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Repayment Due Date</label>
                  <input
                    type="date"
                    value={borrowDueDate}
                    onChange={(e) => setBorrowDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBorrowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md cursor-pointer hover:bg-indigo-700"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GIVE MONEY TO FRIEND / RELATIVE (WITH DATE AND SNIPPET) */}
      {showAddLentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Give Money to Friend or Relative</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Record date given, return date, and upload snippet screenshot</p>
              </div>
              <button onClick={() => setShowAddLentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Friend / Relative Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh, Priya, Cousin Amit"
                  value={lentName}
                  onChange={(e) => setLentName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Relationship</label>
                  <select
                    value={lentRelation}
                    onChange={(e) => setLentRelation(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                    <option value="Family">Family Member</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Amount Given (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 2000"
                    value={lentAmount}
                    onChange={(e) => setLentAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Date Given</label>
                  <input
                    type="date"
                    required
                    value={lentDate}
                    onChange={(e) => setLentDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Promised Return Date</label>
                  <input
                    type="date"
                    value={lentReturnDate}
                    onChange={(e) => setLentReturnDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Snippet Upload Section */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Upload Transfer Snippet / Screenshot
                </label>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-center bg-slate-50/50 dark:bg-slate-800/30">
                  {lentSnippet ? (
                    <div className="space-y-2">
                      <img src={lentSnippet} alt="Snippet preview" className="max-h-32 mx-auto rounded-lg shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setLentSnippet(undefined)}
                        className="text-[11px] text-rose-500 font-bold hover:underline"
                      >
                        Remove Snippet
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={lentFileRef}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setLentSnippet)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => lentFileRef.current?.click()}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Select Snippet Screenshot</span>
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">Upload UPI transfer screenshot, bank debit, or handwritten note</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Notes / Purpose (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. For medical emergency, college fee, etc."
                  value={lentNotes}
                  onChange={(e) => setLentNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md cursor-pointer hover:bg-indigo-700"
                >
                  Save & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL SNIPPET LIGHTBOX */}
      {viewSnippetUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setViewSnippetUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Snippet Receipt Preview</h4>
            <div className="max-h-[75vh] overflow-auto rounded-xl">
              <img src={viewSnippetUrl} alt="Snippet full preview" className="max-w-full rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD REPAYMENT / RETURN */}
      {showRepayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              {showRepayModal.isLent ? 'Record Returned Money' : 'Record Repayment'}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {showRepayModal.isLent
                ? `Received return from ${showRepayModal.name}`
                : `Repaying debt to ${showRepayModal.name}`}
            </p>
            <form onSubmit={handleConfirmRepay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={repayInput}
                  onChange={(e) => setRepayInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Confirm & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackersHub;
