import React, { useState } from 'react';
import { EMITrackerItem } from '../types';
import { formatCurrency } from '../utils';
import { Plus, CheckCircle, Calendar, Landmark, Trash2, Edit3, AlertCircle } from 'lucide-react';

interface EMITrackerProps {
  emis: EMITrackerItem[];
  onAddEmi: (emi: Omit<EMITrackerItem, 'id'>) => void;
  onEditEmi: (id: string, emi: Partial<EMITrackerItem>) => void;
  onDeleteEmi: (id: string) => void;
  onRecordPayment: (id: string) => void;
}

const COMMON_BANKS = [
  'HDFC Bank', 'State Bank of India (SBI)', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Bajaj Finserv', 'Tata Capital', 'Home Credit',
  'IDFC First Bank', 'Bank of Baroda', 'Punjab National Bank', 'Other Lender'
];

export const EMITracker: React.FC<EMITrackerProps> = ({
  emis,
  onAddEmi,
  onEditEmi,
  onDeleteEmi,
  onRecordPayment
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [lender, setLender] = useState(COMMON_BANKS[0]);
  const [emiAmount, setEmiAmount] = useState('');
  const [totalTenureMonths, setTotalTenureMonths] = useState('12');
  const [paidTenureMonths, setPaidTenureMonths] = useState('0');
  const [dueDayOfMonth, setDueDayOfMonth] = useState('5');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalLoanAmount, setTotalLoanAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Metrics
  const activeEmis = emis.filter(e => e.status === 'active');
  const monthlyTotal = activeEmis.reduce((s, e) => s + e.emiAmount, 0);
  const totalLoanValue = emis.reduce((s, e) => s + (e.totalLoanAmount || e.emiAmount * e.totalTenureMonths), 0);
  const remainingLiability = activeEmis.reduce((s, e) => {
    const remMonths = Math.max(0, e.totalTenureMonths - e.paidTenureMonths);
    return s + (remMonths * e.emiAmount);
  }, 0);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setLender(COMMON_BANKS[0]);
    setEmiAmount('');
    setTotalTenureMonths('12');
    setPaidTenureMonths('0');
    setDueDayOfMonth('5');
    setStartDate(new Date().toISOString().split('T')[0]);
    setTotalLoanAmount('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: EMITrackerItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setLender(item.lender);
    setEmiAmount(item.emiAmount.toString());
    setTotalTenureMonths(item.totalTenureMonths.toString());
    setPaidTenureMonths(item.paidTenureMonths.toString());
    setDueDayOfMonth(item.dueDayOfMonth.toString());
    setStartDate(item.startDate);
    setTotalLoanAmount(item.totalLoanAmount?.toString() || '');
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(emiAmount);
    const tenure = parseInt(totalTenureMonths, 10);
    const paid = parseInt(paidTenureMonths, 10) || 0;
    const dueDay = parseInt(dueDayOfMonth, 10) || 1;

    if (!title.trim() || isNaN(amt) || amt <= 0 || isNaN(tenure) || tenure <= 0) {
      alert('Please provide a valid EMI title, amount, and tenure.');
      return;
    }

    const payload: Omit<EMITrackerItem, 'id'> = {
      title: title.trim(),
      lender,
      emiAmount: amt,
      totalTenureMonths: tenure,
      paidTenureMonths: Math.min(paid, tenure),
      dueDayOfMonth: dueDay,
      startDate,
      totalLoanAmount: totalLoanAmount ? parseFloat(totalLoanAmount) : amt * tenure,
      status: paid >= tenure ? 'completed' : 'active',
      notes: notes.trim()
    };

    if (editingId) {
      onEditEmi(editingId, payload);
    } else {
      onAddEmi(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>💳 EMI Tracker</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active installments, upcoming debit dates, and loan tenure
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New EMI</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Monthly EMI Commitment</span>
          <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(monthlyTotal)}
          </h3>
          <span className="text-xs font-semibold text-violet-500 mt-1 block">
            {activeEmis.length} active {activeEmis.length === 1 ? 'installment' : 'installments'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Remaining EMI Balance</span>
          <h3 className="text-2xl font-black font-mono text-rose-500">
            {formatCurrency(remainingLiability)}
          </h3>
          <span className="text-xs font-semibold text-slate-400 mt-1 block">
            Total remaining across tenures
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Loan Value</span>
          <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalLoanValue)}
          </h3>
          <span className="text-xs font-semibold text-emerald-500 mt-1 block">
            {emis.filter(e => e.status === 'completed').length} completed loans
          </span>
        </div>
      </div>

      {/* EMI List */}
      {emis.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No EMIs Logged</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Keep track of personal loans, credit card EMIs, auto loans, or gadgets installments here.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            + Add Your First EMI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emis.map((item) => {
            const progress = Math.min(100, Math.round((item.paidTenureMonths / item.totalTenureMonths) * 100));
            const remainingMonths = Math.max(0, item.totalTenureMonths - item.paidTenureMonths);
            const isFinished = item.paidTenureMonths >= item.totalTenureMonths || item.status === 'completed';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-violet-500/30 transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isFinished 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                      }`}>
                        {isFinished ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Landmark className="w-3.5 h-3.5" />
                      {item.lender}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.emiAmount)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block">/ month</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Paid: <strong>{item.paidTenureMonths}</strong> of {item.totalTenureMonths} months
                    </span>
                    <span className="text-violet-600 dark:text-violet-400 font-mono font-bold">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-600 to-indigo-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due Day: <strong>{item.dueDayOfMonth}th</strong>
                    </span>
                    <span>Rem: <strong>{remainingMonths} mos</strong></span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {!isFinished && (
                      <button
                        onClick={() => onRecordPayment(item.id)}
                        title="Mark 1 monthly installment paid"
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Pay EMI</span>
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit EMI"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete EMI "${item.title}"?`)) {
                          onDeleteEmi(item.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete EMI"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingId ? 'Edit EMI Details' : 'Add New EMI Obligation'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  EMI Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 16 Pro, Bike Loan, Home Loan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Monthly EMI (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="4500"
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Due Day of Month *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    placeholder="5"
                    value={dueDayOfMonth}
                    onChange={(e) => setDueDayOfMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Lender / Bank
                </label>
                <input
                  type="text"
                  list="bank-list"
                  placeholder="e.g. HDFC Bank, SBI, Bajaj Finserv"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                />
                <datalist id="bank-list">
                  {COMMON_BANKS.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Total Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="12"
                    value={totalTenureMonths}
                    onChange={(e) => setTotalTenureMonths(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Months Paid So Far
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={paidTenureMonths}
                    onChange={(e) => setPaidTenureMonths(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add EMI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EMITracker;
