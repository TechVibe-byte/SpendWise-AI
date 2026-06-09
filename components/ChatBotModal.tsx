import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Expense, RecurringExpense } from '../types';
import { formatCurrency } from '../utils';
import { Send, Sparkles, X } from 'lucide-react';
import { processChatQuery, ChatResult } from '../chatEngine';

interface ChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  monthlyBudget: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ui?: 'budget-progress' | 'top-categories' | 'upcoming-bills';
  data?: any;
}

export const ChatBotModal: React.FC<ChatBotModalProps> = ({ isOpen, onClose, expenses, monthlyBudget }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am your SpendWise Assistant. Ask me anything about your current budget, top spending items, or upcoming dues!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading, isOpen]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthYear = prevMonth.getFullYear();
    const prevMonthStr = String(prevMonth.getMonth() + 1).padStart(2, '0');

    const curMonthPrefix = `${currentYear}-${currentMonth}`;
    const prevMonthPrefix = `${prevMonthYear}-${prevMonthStr}`;

    const curMonthExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix));
    const prevMonthExpenses = expenses.filter(e => e.date.startsWith(prevMonthPrefix));

    const curMonthSpent = curMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevMonthSpent = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      curMonthSpent,
      prevMonthSpent,
      curMonthExpenses,
      prevMonthExpenses,
      now
    };
  }, [expenses]);

  const subscriptionTotals = useMemo(() => {
    const savedRulesRaw = localStorage.getItem('spendwise-recurring');
    const recurringList: RecurringExpense[] = savedRulesRaw ? JSON.parse(savedRulesRaw) : [];
    const activeRules = recurringList.filter(r => r.isActive);

    let monthlyComm = 0;
    activeRules.forEach(rule => {
      const amt = rule.amount;
      if (rule.frequency === 'Daily') monthlyComm += amt * 30;
      else if (rule.frequency === 'Weekly') monthlyComm += amt * 4.3;
      else if (rule.frequency === 'Monthly') monthlyComm += amt;
      else if (rule.frequency === 'Yearly') monthlyComm += amt / 12;
    });

    return {
      monthlyComm,
      activeCount: activeRules.length
    };
  }, [expenses]);

  const categoryTrends = useMemo(() => {
    const categoryTotalsCur = stats.curMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCur = Object.entries(categoryTotalsCur).sort((a, b) => b[1] - a[1]);
    const highestSpender = sortedCur.length > 0 ? sortedCur[0][0] : 'None';
    
    return {
      highestSpender,
    };
  }, [stats]);

  const weeklySummary = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
    const weeklyTotal = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { weeklyTotal };
  }, [expenses]);

  const handleQueryAssistant = async (customText?: string) => {
    const queryToCheck = customText || chatInput;
    if (!queryToCheck.trim()) return;

    setChatHistory(prev => [...prev, { role: 'user', content: queryToCheck }]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      const localAnswer = processChatQuery(queryToCheck, expenses, monthlyBudget);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: localAnswer.text,
        ui: localAnswer.ui,
        data: localAnswer.data
      }]);
      setChatLoading(false);
    }, 400); // Simulate processing time for better UX
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1220] w-full max-w-md sm:rounded-3xl rounded-t-3xl sm:border border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] sm:h-[600px] animate-in slide-in-from-bottom-8">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950/40 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">SpendWise Assistant</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Always-on intelligence</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 p-4 overflow-hidden">
          {/* Quick Queries */}
          <div className="mb-3 shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-[#CBD5E1] block mb-1.5 pl-1">
              ⚡ Popular Data Queries
            </span>
            <div className="flex flex-wrap gap-1.5 pr-1">
              <button
                onClick={() => handleQueryAssistant('Where did I spend the most money?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#CBD5E1] rounded-full transition-all"
              >
                🔍 Where did I spend the most?
              </button>
              <button
                onClick={() => handleQueryAssistant('How much did I spend on Food this month?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#CBD5E1] rounded-full transition-all"
              >
                🍔 spent on Food?
              </button>
              <button
                onClick={() => handleQueryAssistant('What are my upcoming EMIs?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#CBD5E1] rounded-full transition-all"
              >
                📅 upcoming due dates?
              </button>
              <button
                onClick={() => handleQueryAssistant('Which category increased compared to last month?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#CBD5E1] rounded-full transition-all"
              >
                📈 rising trends?
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 overflow-y-auto mb-3 space-y-3 font-medium text-xs shadow-inner">
            {chatHistory.map((ch, idx) => {
              const isWelcome = idx === 0 && ch.role === 'assistant';
              if (isWelcome) {
                return (
                  <div key={idx} className="flex justify-start">
                    <div className="p-4 rounded-2xl max-w-[95%] bg-slate-100/50 dark:bg-[#1E293B] text-slate-900 dark:text-[#FFFFFF] border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-tl-none">
                      <div className="flex items-center space-x-2 text-indigo-600 dark:text-purple-400 mb-2 font-black shrink-0">
                        <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                        <span className="text-[11px] tracking-widest uppercase font-bold">SpendWise Hub</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-[13px] font-semibold text-slate-800 dark:text-[#FFFFFF]">
                        {ch.content}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-[85%] shadow-sm border ${
                    ch.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-tr-none border-transparent' 
                      : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-[#FFFFFF] border-slate-200/85 dark:border-slate-800 rounded-tl-none font-medium'
                  }`}>
                    <p className={`whitespace-pre-wrap leading-relaxed text-[13px] ${ch.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-[#CBD5E1]'}`}>
                      {ch.content}
                    </p>

                    {/* Interactive UI Block */}
                    {ch.ui === 'budget-progress' && ch.data && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-[#0B1220] rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                        <div className="flex justify-between text-[10px] font-bold mb-1.5 text-slate-500">
                          <span>{formatCurrency(ch.data.spent)} spent</span>
                          <span>{formatCurrency(ch.data.budget)} limit</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${ch.data.percentage > 100 ? 'bg-red-500' : ch.data.percentage > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min(ch.data.percentage, 100)}%` }} 
                          />
                        </div>
                      </div>
                    )}

                    {ch.ui === 'top-categories' && ch.data && (
                      <div className="mt-3 space-y-1.5">
                        {ch.data.map((cat: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 text-[11px] bg-slate-50 dark:bg-[#0B1220] rounded-lg border border-slate-100 dark:border-slate-800/80">
                            <span className="font-bold text-slate-700 dark:text-slate-300">#{i + 1} {cat[0]}</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(cat[1])}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {ch.ui === 'upcoming-bills' && ch.data && (
                      <div className="mt-3 space-y-1.5">
                        {ch.data.map((bill: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 text-[11px] bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{bill.description}</span>
                              <span className="text-[9px] text-slate-500">Due: {bill.nextOccurrenceDate}</span>
                            </div>
                            <span className="font-mono font-black text-rose-500">{formatCurrency(bill.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#111827] border border-slate-200/85 dark:border-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center space-x-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="flex items-center space-x-2 pb-1 shrink-0">
            <input
              type="text"
              placeholder="Ask about spending or forecast trends..."
              className="flex-1 px-4 py-3 text-xs bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-[#FFFFFF] placeholder-[#94A3B8] placeholder:text-[#94A3B8] caret-purple-600 dark:caret-purple-400 outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQueryAssistant()}
            />
            <button
              onClick={() => handleQueryAssistant()}
              disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
