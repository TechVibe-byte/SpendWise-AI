import React, { useState, useRef } from 'react';
import { SalaryTrackerItem } from '../types';
import { formatCurrency } from '../utils';
import { Plus, Briefcase, Calendar, FileText, Image as ImageIcon, Trash2, Edit3, CheckCircle, Eye, X } from 'lucide-react';

interface SalaryTrackerProps {
  salaries: SalaryTrackerItem[];
  onAddSalary: (item: Omit<SalaryTrackerItem, 'id'>) => void;
  onEditSalary: (id: string, item: Partial<SalaryTrackerItem>) => void;
  onDeleteSalary: (id: string) => void;
}

export const SalaryTracker: React.FC<SalaryTrackerProps> = ({
  salaries,
  onAddSalary,
  onEditSalary,
  onDeleteSalary
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewSnippet, setViewSnippet] = useState<string | null>(null);

  // Form states
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString(undefined, { month: 'long' })} ${d.getFullYear()}`;
  });
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split('T')[0]);
  const [employerName, setEmployerName] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [status, setStatus] = useState<'credited' | 'pending'>('credited');
  const [payslipSnippet, setPayslipSnippet] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metrics
  const creditedList = salaries.filter(s => s.status === 'credited');
  const totalCredited = creditedList.reduce((s, i) => s + i.netCredited, 0);
  const avgMonthly = creditedList.length > 0 ? Math.round(totalCredited / creditedList.length) : 0;
  const latestSalary = creditedList.length > 0 ? creditedList[0] : null;

  const handleSnippetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB. Please choose a smaller snippet image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayslipSnippet(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    const d = new Date();
    setMonth(`${d.toLocaleString(undefined, { month: 'long' })} ${d.getFullYear()}`);
    setCreditDate(new Date().toISOString().split('T')[0]);
    setEmployerName('');
    setBaseSalary('');
    setBonus('');
    setDeductions('');
    setPaymentMethod('Bank Transfer');
    setStatus('credited');
    setPayslipSnippet(undefined);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: SalaryTrackerItem) => {
    setEditingId(item.id);
    setMonth(item.month);
    setCreditDate(item.creditDate);
    setEmployerName(item.employerName);
    setBaseSalary(item.baseSalary.toString());
    setBonus(item.bonus?.toString() || '');
    setDeductions(item.deductions?.toString() || '');
    setPaymentMethod(item.paymentMethod || 'Bank Transfer');
    setStatus(item.status);
    setPayslipSnippet(item.payslipSnippet);
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(baseSalary);
    const bon = parseFloat(bonus) || 0;
    const ded = parseFloat(deductions) || 0;

    if (!employerName.trim() || isNaN(base) || base <= 0) {
      alert('Please provide your employer/company name and base salary.');
      return;
    }

    const net = Math.max(0, base + bon - ded);

    const payload: Omit<SalaryTrackerItem, 'id'> = {
      month: month.trim(),
      creditDate,
      employerName: employerName.trim(),
      baseSalary: base,
      bonus: bon,
      deductions: ded,
      netCredited: net,
      paymentMethod,
      status,
      payslipSnippet,
      notes: notes.trim()
    };

    if (editingId) {
      onEditSalary(editingId, payload);
    } else {
      onAddSalary(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>💼 Salary Tracker</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log monthly compensation, pay slip snippets, deductions, and annual earnings
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Salary Credit</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Salary Credited</span>
          <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-450">
            {formatCurrency(totalCredited)}
          </h3>
          <span className="text-xs font-semibold text-slate-400 mt-1 block">
            Across {creditedList.length} salary cycles
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Average Monthly Net</span>
          <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(avgMonthly)}
          </h3>
          <span className="text-xs font-semibold text-teal-500 mt-1 block">
            Net in-hand take home
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Latest Pay Slip</span>
          <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {latestSalary ? formatCurrency(latestSalary.netCredited) : '—'}
          </h3>
          <span className="text-xs font-semibold text-slate-400 mt-1 block truncate">
            {latestSalary ? `${latestSalary.month} • ${latestSalary.employerName}` : 'No records yet'}
          </span>
        </div>
      </div>

      {/* Salaries Table / Cards */}
      {salaries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 mx-auto flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Salary Logs Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Log your salary credits, attach pay slips/screenshots, and monitor your earnings trajectory.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            + Log Your First Salary
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {salaries.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 border border-slate-150/10 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{s.month}</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      s.status === 'credited'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.employerName} • Credited on {s.creditDate}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono mt-1.5">
                    <span>Base: {formatCurrency(s.baseSalary)}</span>
                    {s.bonus ? <span className="text-emerald-500 font-semibold">+Bonus: {formatCurrency(s.bonus)}</span> : null}
                    {s.deductions ? <span className="text-rose-400 font-semibold">-Deductions: {formatCurrency(s.deductions)}</span> : null}
                  </div>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between w-full md:w-auto md:space-x-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-lg md:text-xl font-black font-mono text-emerald-600 dark:text-emerald-450 block">
                    {formatCurrency(s.netCredited)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Net In-Hand</span>
                </div>

                <div className="flex items-center space-x-2">
                  {s.payslipSnippet && (
                    <button
                      onClick={() => setViewSnippet(s.payslipSnippet!)}
                      className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="View Payslip Snippet"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Snippet</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Record"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete salary record for ${s.month}?`)) {
                        onDeleteSalary(s.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingId ? 'Edit Salary Record' : 'Log Salary Credit'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Month & Year *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. September 2026"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Credit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={creditDate}
                    onChange={(e) => setCreditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Employer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Infosys, Tech Startup"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Base Salary *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Bonus / Extra
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Deductions (Tax/PF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-300">Estimated Net In-Hand:</span>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-450">
                  {formatCurrency(Math.max(0, (parseFloat(baseSalary) || 0) + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0)))}
                </span>
              </div>

              {/* Pay Slip Snippet Attachment */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Attach Pay Slip / Credit Snippet
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleSnippetUpload}
                  className="hidden"
                />

                {payslipSnippet ? (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={payslipSnippet} alt="Snippet preview" className="w-12 h-12 object-cover rounded-xl" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pay slip image attached</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayslipSnippet(undefined)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer bg-slate-50 dark:bg-slate-950"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Payslip Snippet / Screenshot</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly appraisal hike included"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Log Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snippet Preview Lightbox */}
      {viewSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden p-4 space-y-3 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-white font-bold text-sm">Payslip / Transfer Snippet</h4>
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
export default SalaryTracker;
