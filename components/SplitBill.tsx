import React, { useState, useEffect, useRef } from 'react';
import { SplitBillItem, SplitParticipant, SplitType, LendMoneyItem, Expense, Category, DefaultCategory } from '../types';
import { formatCurrency } from '../utils';
import { generateSplitBillReceiptCanvas, downloadReceiptImage, shareToWhatsApp, getWhatsAppShareUrl } from './SplitBillReceiptGenerator';
import { 
  Users, Plus, Trash2, CheckCircle2, Share2, Download, Copy, 
  ArrowRight, Sparkles, Receipt, RefreshCw, Smartphone, 
  ExternalLink, Check, Calendar, Landmark, Info, AlertCircle, X
} from 'lucide-react';

interface SplitBillProps {
  onAddLent?: (item: Omit<LendMoneyItem, 'id'>) => void;
  onAddExpense?: (expense: Omit<Expense, 'id'>) => void;
  savedBills?: SplitBillItem[];
  onSaveBills?: (bills: SplitBillItem[]) => void;
}

export const SplitBill: React.FC<SplitBillProps> = ({
  onAddLent,
  onAddExpense,
  savedBills: propSavedBills,
  onSaveBills: propOnSaveBills
}) => {
  // Local persistence for split bills
  const [bills, setBills] = useState<SplitBillItem[]>(() => {
    if (propSavedBills) return propSavedBills;
    try {
      const saved = localStorage.getItem('spendwise_split_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveBills = (newBills: SplitBillItem[]) => {
    setBills(newBills);
    if (propOnSaveBills) {
      propOnSaveBills(newBills);
    } else {
      localStorage.setItem('spendwise_split_bills', JSON.stringify(newBills));
    }
  };

  // Notification / Feedback State (clean non-blocking UI replacing window.alert)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string, duration = 4000) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedback({ type, message });
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, duration);
  };

  const [deleteConfirmBillId, setDeleteConfirmBillId] = useState<string | null>(null);

  // Form State
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [billTitle, setBillTitle] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [billNotes, setBillNotes] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [paidBy, setPaidBy] = useState<string>('You');

  // Participants State — starts with just "You" (no dummy names)
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; customShare?: string }>>([
    { id: '1', name: 'You' }
  ]);
  const [newFriendName, setNewFriendName] = useState<string>('');

  // Real friends from user's own saved bills history (no hardcoded dummy names)
  const recentSavedFriends = React.useMemo(() => {
    const friendSet = new Set<string>();
    bills.forEach(b => {
      b.participants.forEach(p => {
        if (p.name && p.name.trim().toLowerCase() !== 'you') {
          friendSet.add(p.name.trim());
        }
      });
    });
    return Array.from(friendSet);
  }, [bills]);

  // Generated Output & Sharing State
  const [calculatedBill, setCalculatedBill] = useState<SplitBillItem | null>(null);
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [copiedTextNotice, setCopiedTextNotice] = useState<boolean>(false);
  const [exportedToLendNotice, setExportedToLendNotice] = useState<boolean>(false);
  const [exportedToExpenseNotice, setExportedToExpenseNotice] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Add friend
  const handleAddFriend = (nameToAdd?: string) => {
    const name = (nameToAdd || newFriendName).trim();
    if (!name) return;

    // Check duplicate
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      showFeedback('error', `"${name}" is already in the participant list.`);
      return;
    }

    setParticipants(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), name }
    ]);
    if (!nameToAdd) setNewFriendName('');
    showFeedback('success', `Added "${name}" to the split bill.`, 2000);
  };

  // Remove friend
  const handleRemoveFriend = (id: string) => {
    if (participants.length <= 1) {
      showFeedback('error', 'You must have at least one person in the bill.');
      return;
    }
    const target = participants.find(p => p.id === id);
    if (target?.name === paidBy) {
      setPaidBy('You');
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (target) {
      showFeedback('info', `Removed "${target.name}".`, 2000);
    }
  };

  // Calculate Split
  const handleCalculateSplit = async () => {
    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) {
      showFeedback('error', 'Please enter a valid bill amount greater than 0.');
      return;
    }

    if (participants.length < 2) {
      showFeedback('error', 'Please add at least 1 friend to split the bill with.');
      return;
    }

    let calculatedParticipants: SplitParticipant[] = [];

    if (splitType === 'equal') {
      const share = amt / participants.length;
      calculatedParticipants = participants.map(p => ({
        id: p.id,
        name: p.name,
        shareAmount: parseFloat(share.toFixed(2)),
        isPayer: p.name.toLowerCase() === paidBy.toLowerCase(),
        paidAmount: p.name.toLowerCase() === paidBy.toLowerCase() ? amt : 0,
        settled: p.name.toLowerCase() === paidBy.toLowerCase()
      }));

      // Adjust rounding cent discrepancy if any on the last person
      const totalCalculated = calculatedParticipants.reduce((s, p) => s + p.shareAmount, 0);
      const diff = amt - totalCalculated;
      if (Math.abs(diff) > 0 && Math.abs(diff) < 1 && calculatedParticipants.length > 0) {
        calculatedParticipants[0].shareAmount = parseFloat((calculatedParticipants[0].shareAmount + diff).toFixed(2));
      }
    } else if (splitType === 'exact') {
      let sumCustom = 0;
      calculatedParticipants = participants.map(p => {
        const val = parseFloat(p.customShare || '0');
        sumCustom += isNaN(val) ? 0 : val;
        return {
          id: p.id,
          name: p.name,
          shareAmount: isNaN(val) ? 0 : val,
          isPayer: p.name.toLowerCase() === paidBy.toLowerCase(),
          paidAmount: p.name.toLowerCase() === paidBy.toLowerCase() ? amt : 0,
          settled: p.name.toLowerCase() === paidBy.toLowerCase()
        };
      });

      if (Math.abs(sumCustom - amt) > 0.05) {
        showFeedback('error', `The total of individual shares (₹${sumCustom.toFixed(2)}) must equal the bill amount (₹${amt.toFixed(2)}). Difference: ₹${(amt - sumCustom).toFixed(2)}`);
        return;
      }
    } else if (splitType === 'percentage') {
      let sumPct = 0;
      calculatedParticipants = participants.map(p => {
        const pct = parseFloat(p.customShare || '0');
        sumPct += isNaN(pct) ? 0 : pct;
        const share = (amt * (isNaN(pct) ? 0 : pct)) / 100;
        return {
          id: p.id,
          name: p.name,
          percentage: pct,
          shareAmount: parseFloat(share.toFixed(2)),
          isPayer: p.name.toLowerCase() === paidBy.toLowerCase(),
          paidAmount: p.name.toLowerCase() === paidBy.toLowerCase() ? amt : 0,
          settled: p.name.toLowerCase() === paidBy.toLowerCase()
        };
      });

      if (Math.abs(sumPct - 100) > 0.5) {
        showFeedback('error', `The total percentages (${sumPct.toFixed(1)}%) must equal 100%. Currently: ${sumPct.toFixed(1)}%`);
        return;
      }
    }

    const newBill: SplitBillItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: billTitle.trim() || 'Split Expense',
      totalAmount: amt,
      date: billDate,
      paidBy,
      splitType,
      participants: calculatedParticipants,
      notes: billNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setCalculatedBill(newBill);
    setExportedToLendNotice(false);
    setExportedToExpenseNotice(false);
    showFeedback('success', `Bill split generated for ${newBill.participants.length} friends! Receipt image is ready.`);

    // Automatically generate Receipt Card Image
    setIsGeneratingImage(true);
    try {
      const result = await generateSplitBillReceiptCanvas(newBill, { theme: 'light' });
      setGeneratedImageDataUrl(result.dataUrl);
      setGeneratedImageBlob(result.blob);
    } catch (err) {
      console.error('Failed to generate receipt image:', err);
      showFeedback('error', 'Could not render high-res image. Text breakdown is still available to share.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Re-generate image with theme toggle
  const handleRegenerateImageTheme = async (theme: 'light' | 'dark') => {
    if (!calculatedBill) return;
    setIsGeneratingImage(true);
    try {
      const result = await generateSplitBillReceiptCanvas(calculatedBill, { theme });
      setGeneratedImageDataUrl(result.dataUrl);
      setGeneratedImageBlob(result.blob);
      showFeedback('info', `Switched receipt card to ${theme} theme.`, 2000);
    } catch (err) {
      console.error('Failed to regenerate image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Save current bill to history
  const handleSaveToHistory = () => {
    if (!calculatedBill) return;
    if (bills.some(b => b.id === calculatedBill.id)) {
      showFeedback('info', 'This bill is already saved in history.');
      return;
    }
    saveBills([calculatedBill, ...bills]);
    showFeedback('success', 'Bill saved to Split Bills history!');
  };

  // WhatsApp share
  const handleShareWhatsApp = async () => {
    if (!calculatedBill) return;
    try {
      const res = await shareToWhatsApp(calculatedBill, generatedImageBlob || undefined, generatedImageDataUrl || undefined);
      if (res?.sharedVia === 'native-file') {
        showFeedback('success', 'Receipt and message shared via device share dialog!');
      } else if (res?.sharedVia === 'whatsapp-url') {
        showFeedback('success', 'WhatsApp opened with breakdown message and receipt image downloaded!');
      }
    } catch (err) {
      console.error('Error sharing to WhatsApp:', err);
      showFeedback('error', 'Could not launch WhatsApp. You can click Copy Text or Download Image.');
    }
  };

  // Download image
  const handleDownloadImage = () => {
    if (!generatedImageDataUrl || !calculatedBill) return;
    downloadReceiptImage(generatedImageDataUrl, calculatedBill.title);
    showFeedback('success', 'Receipt PNG image downloaded!');
  };

  // Copy text breakdown
  const handleCopyText = () => {
    if (!calculatedBill) return;
    const perPerson = calculatedBill.splitType === 'equal' 
      ? (calculatedBill.totalAmount / calculatedBill.participants.length).toFixed(2)
      : 'as listed';

    const lines = calculatedBill.participants.map(p => {
      if (p.name.toLowerCase() === calculatedBill.paidBy.toLowerCase()) {
        return `• ${p.name}: Paid bill (${formatCurrency(calculatedBill.totalAmount)}) [Share: ${formatCurrency(p.shareAmount)}]`;
      }
      return `• ${p.name}: Owes ${formatCurrency(p.shareAmount)}`;
    }).join('\n');

    const message = 
`🧾 SpendWise Split Bill: ${calculatedBill.title}
Total: ${formatCurrency(calculatedBill.totalAmount)}
Paid By: ${calculatedBill.paidBy}
Date: ${calculatedBill.date}
Per Person: ₹${perPerson}

Settlements:
${lines}

Pay via UPI / GPay / PhonePe`;

    navigator.clipboard.writeText(message);
    setCopiedTextNotice(true);
    showFeedback('success', 'Breakdown copied to clipboard! Paste it directly into any chat.', 3000);
    setTimeout(() => setCopiedTextNotice(false), 2500);
  };

  // Copy image to clipboard
  const handleCopyImage = async () => {
    if (!generatedImageBlob) return;
    try {
      const item = new ClipboardItem({ 'image/png': generatedImageBlob });
      await navigator.clipboard.write([item]);
      showFeedback('success', 'Receipt image copied to clipboard! You can paste it directly into WhatsApp or Telegram.');
    } catch {
      showFeedback('info', 'Direct image clipboard copy is not supported in this browser. Please use Download or WhatsApp Share.');
    }
  };

  // Export friend shares to SpendWise Lend Tracker
  const handleExportToLend = () => {
    if (!calculatedBill || !onAddLent) return;
    const friendsWhoOwe = calculatedBill.participants.filter(
      p => p.name.toLowerCase() !== calculatedBill.paidBy.toLowerCase() && p.shareAmount > 0
    );

    if (friendsWhoOwe.length === 0) {
      showFeedback('info', 'No friends with unpaid balances found.');
      return;
    }

    friendsWhoOwe.forEach(friend => {
      onAddLent({
        borrowerName: friend.name,
        relationship: 'Friend',
        amount: friend.shareAmount,
        dateGiven: calculatedBill.date,
        returnedAmount: 0,
        status: 'pending',
        notes: `Bill Split: ${calculatedBill.title} (${formatCurrency(calculatedBill.totalAmount)} total)`
      });
    });

    setExportedToLendNotice(true);
    showFeedback('success', `Added ${friendsWhoOwe.length} friend shares directly to your SpendWise Lend Tracker!`);
  };

  // Export my share to SpendWise Expenses
  const handleExportToExpenses = () => {
    if (!calculatedBill || !onAddExpense) return;
    const myShare = calculatedBill.participants.find(p => p.name === 'You' || p.name === calculatedBill.paidBy);
    const amountToLog = myShare ? myShare.shareAmount : (calculatedBill.totalAmount / calculatedBill.participants.length);

    onAddExpense({
      description: `Split: ${calculatedBill.title} (My share of ${formatCurrency(calculatedBill.totalAmount)})`,
      amount: amountToLog,
      category: DefaultCategory.FOOD,
      date: calculatedBill.date,
      paymentType: 'bank',
      bankName: 'UPI',
      note: `Split bill with ${calculatedBill.participants.map(p => p.name).join(', ')}`
    });

    setExportedToExpenseNotice(true);
    showFeedback('success', `Logged your share of ${formatCurrency(amountToLog)} as an expense in SpendWise!`);
  };

  // Toggle participant settlement in history
  const handleToggleSettled = (billId: string, participantId: string) => {
    const updated = bills.map(b => {
      if (b.id !== billId) return b;
      return {
        ...b,
        participants: b.participants.map(p => {
          if (p.id !== participantId) return p;
          return { ...p, settled: !p.settled };
        })
      };
    });
    saveBills(updated);
  };

  // Delete bill from history
  const handleDeleteBill = (billId: string) => {
    saveBills(bills.filter(b => b.id !== billId));
    setDeleteConfirmBillId(null);
    showFeedback('info', 'Bill removed from history.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Split Bill with Friends
            </h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              WhatsApp Ready
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Easily split dining, trips, or group expenses, generate receipt images, and share instant settlement cards via WhatsApp
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⚡ Split New Bill</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📜 Saved Bills</span>
            {bills.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {bills.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50'
            : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/50'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeTab === 'calculator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Input Form */}
          <div className="lg:col-span-6 space-y-6">
            {/* Step 1: Bill Amount & Title Card */}
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px]">1</span>
                  Bill Details
                </span>
                <span className="text-[11px] text-slate-400">Enter total amount & name</span>
              </div>

              {/* Bill Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Total Bill Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-black text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono font-black text-xl md:text-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Title & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Bill Title / Event
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner, Goa Trip, Movie..."
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Who Paid & Split Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Who Paid the Bill?
                  </label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  >
                    {participants.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name === 'You' ? 'You (I paid)' : `${p.name} paid`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Split Method
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setSplitType('equal')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        splitType === 'equal'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      = Equal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('exact')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        splitType === 'exact'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ₹ Exact
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('percentage')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        splitType === 'percentage'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Friends Section Card */}
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px]">2</span>
                  Add Friends ({participants.length})
                </span>
                <span className="text-[11px] text-slate-400">Who is in this split?</span>
              </div>

              {/* Add friend input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter friend's name..."
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFriend();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddFriend()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Friend</span>
                </button>
              </div>

              {/* Quick Suggestion Chips from User's Actual Past Bills (No Dummy Names) */}
              {recentSavedFriends.filter(n => !participants.some(p => p.name.toLowerCase() === n.toLowerCase())).length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recent Friends:</span>
                  {recentSavedFriends.filter(n => !participants.some(p => p.name.toLowerCase() === n.toLowerCase())).slice(0, 5).map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleAddFriend(name)}
                      className="px-2.5 py-0.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              )}

              {/* Notice when no friend added yet */}
              {participants.length === 1 && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-indigo-500" />
                  <span>Type your friend's name above and click <strong>"Add Friend"</strong> to split this bill.</span>
                </div>
              )}

              {/* Participant List */}
              <div className="space-y-2 pt-2">
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                          {p.name}
                        </span>
                        {p.name === paidBy && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                            ✓ Bill Payer
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Custom inputs if not equal split */}
                      {splitType === 'exact' && (
                        <div className="relative w-28">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={p.customShare || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, customShare: val } : item));
                            }}
                            className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-right"
                          />
                        </div>
                      )}

                      {splitType === 'percentage' && (
                        <div className="relative w-24">
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">%</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={p.customShare || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, customShare: val } : item));
                            }}
                            className="w-full pr-6 pl-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white text-right"
                          />
                        </div>
                      )}

                      {splitType === 'equal' && totalAmount && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          ~{formatCurrency(parseFloat(totalAmount) / (participants.length || 1))}
                        </span>
                      )}

                      {p.name !== 'You' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove Friend"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Optional Note / UPI ID for Payment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Pay: user@okaxis / Pay before Sunday!"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Calculate & Split Button */}
              <button
                type="button"
                onClick={handleCalculateSplit}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-base active:scale-[0.99]"
              >
                <Sparkles className="w-5 h-5" />
                <span>Split Bill & Generate Receipt</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Output, Visual Breakdown & Image Receipt */}
          <div className="lg:col-span-6 space-y-6">
            {!calculatedBill ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-20 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Receipt className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Ready to Split Your Bill
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Fill in the bill amount and friend names on the left, then click <strong>"Split Bill & Generate Receipt"</strong> to preview settlements and download the image.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Result Card: Breakdown Summary */}
                <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest block">
                        Settlement Breakdown
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {calculatedBill.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Bill</span>
                      <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(calculatedBill.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/30">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid By</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
                        {calculatedBill.paidBy}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Per Person</span>
                      <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                        {calculatedBill.splitType === 'equal' 
                          ? formatCurrency(calculatedBill.totalAmount / calculatedBill.participants.length) 
                          : 'Custom'}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Friends Count</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                        {calculatedBill.participants.length} People
                      </span>
                    </div>
                  </div>

                  {/* Friends settlement rows */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Who Owes Whom:
                    </span>
                    {calculatedBill.participants.map(p => {
                      const isPayer = p.name.toLowerCase() === calculatedBill.paidBy.toLowerCase();
                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isPayer 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                            {isPayer ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                                Paid Full Bill
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                owes {calculatedBill.paidBy}
                              </span>
                            )}
                          </div>
                          <span className={`font-mono font-black text-sm ${
                            isPayer ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {formatCurrency(p.shareAmount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons: WhatsApp Share & Image Download */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share on WhatsApp</span>
                      </button>

                      <a
                        href={getWhatsAppShareUrl(calculatedBill)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                        title="Open WhatsApp directly with prefilled message"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Direct Chat</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadImage}
                        disabled={!generatedImageDataUrl}
                        className="py-2.5 px-3 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyText}
                        className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedTextNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedTextNotice ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleCopyImage}
                        disabled={!generatedImageBlob}
                        className="py-2.5 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Image (Ctrl+V)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveToHistory}
                        className="py-2.5 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save to History</span>
                      </button>
                    </div>

                    {/* SpendWise Connected Actions */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        SpendWise Fast Actions:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {onAddLent && (
                          <button
                            type="button"
                            onClick={handleExportToLend}
                            disabled={exportedToLendNotice}
                            className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-lg border border-violet-200 dark:border-violet-800/40 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <span>🎁 Add to Lend Tracker</span>
                            {exportedToLendNotice && <Check className="w-3 h-3 text-emerald-500" />}
                          </button>
                        )}
                        {onAddExpense && (
                          <button
                            type="button"
                            onClick={handleExportToExpenses}
                            disabled={exportedToExpenseNotice}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/40 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <span>💳 Log My Share as Expense</span>
                            {exportedToExpenseNotice && <Check className="w-3 h-3 text-emerald-500" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated Image Receipt Preview Card */}
                <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Generated Receipt Graphic
                      </span>
                      <p className="text-[11px] text-slate-400">High-resolution image ready to share via WhatsApp</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRegenerateImageTheme('light')}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Light Theme"
                      >
                        ☀️ Light
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegenerateImageTheme('dark')}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Dark Theme"
                      >
                        🌙 Dark
                      </button>
                    </div>
                  </div>

                  {isGeneratingImage ? (
                    <div className="py-16 text-center">
                      <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-400">Rendering receipt card...</span>
                    </div>
                  ) : generatedImageDataUrl ? (
                    <div className="space-y-3">
                      <div className="relative group cursor-pointer" onClick={() => setPreviewModalImage(generatedImageDataUrl)}>
                        <img
                          src={generatedImageDataUrl}
                          alt="Split Bill Receipt"
                          className="w-full rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 object-contain max-h-[380px] bg-slate-50 dark:bg-slate-950 transition-transform group-hover:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white font-bold text-xs gap-1.5">
                          <ExternalLink className="w-4 h-4" />
                          <span>Click to view full resolution</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadImage}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PNG</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleShareWhatsApp}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share Image</span>
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">1600 × auto (Hi-Res PNG)</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Saved Split Bills History ({bills.length})
              </h3>
              <p className="text-xs text-slate-400">Keep track of which friends have settled their shares</p>
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No saved split bills yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">When you calculate a split, click "Save to History" to track settlements here.</p>
              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Split a Bill Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map(bill => {
                const totalParticipants = bill.participants.length;
                const settledParticipants = bill.participants.filter(p => p.settled).length;
                const allSettled = settledParticipants === totalParticipants;

                return (
                  <div
                    key={bill.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-base">
                            {bill.title}
                          </span>
                          <span className={`px-2 py-0.5 text-[9.5px] font-black rounded-md ${
                            allSettled
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {allSettled ? '✓ Fully Settled' : `${settledParticipants}/${totalParticipants} Settled`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{bill.date}</span>
                          <span>•</span>
                          <span>Paid by <strong>{bill.paidBy}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-lg text-slate-900 dark:text-white">
                          {formatCurrency(bill.totalAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCalculatedBill(bill);
                            setActiveTab('calculator');
                            generateSplitBillReceiptCanvas(bill).then(res => {
                              setGeneratedImageDataUrl(res.dataUrl);
                              setGeneratedImageBlob(res.blob);
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                          title="Re-open & Share"
                        >
                          View / Share
                        </button>
                        {deleteConfirmBillId === bill.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBill(bill.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmBillId(null)}
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmBillId(bill.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Friend settlement checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {bill.participants.map(p => {
                        const isPayer = p.name.toLowerCase() === bill.paidBy.toLowerCase();
                        return (
                          <div
                            key={p.id}
                            onClick={() => !isPayer && handleToggleSettled(bill.id, p.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                              isPayer 
                                ? 'bg-slate-100/60 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 cursor-default'
                                : p.settled
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 cursor-pointer'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-indigo-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isPayer || !!p.settled}
                                disabled={isPayer}
                                onChange={() => {}}
                                className="rounded text-indigo-600 cursor-pointer"
                              />
                              <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold">
                              {formatCurrency(p.shareAmount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Full Modal */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500">Split Bill Receipt Image</span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <img src={previewModalImage} alt="Full resolution receipt" className="w-full rounded-2xl" />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  downloadReceiptImage(previewModalImage, billTitle || 'receipt');
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitBill;
