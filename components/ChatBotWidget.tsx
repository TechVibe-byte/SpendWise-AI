import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Expense, RecurringExpense } from '../types';
import { formatCurrency } from '../utils';
import { Send, Sparkles } from 'lucide-react';
import { processChatQuery, ChatResult } from '../chatEngine';

interface ChatBotWidgetProps {
  expenses: Expense[];
  monthlyBudget: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ui?: 'budget-progress' | 'top-categories' | 'upcoming-bills';
  data?: any;
}

export const ChatBotWidget: React.FC<ChatBotWidgetProps> = ({ expenses, monthlyBudget }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am your SpendWise Assistant. Ask me anything about your current budget, top spending items, or upcoming dues!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

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

    return { curMonthSpent, prevMonthSpent, curMonthExpenses, prevMonthExpenses, now };
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

    return { monthlyComm, activeCount: activeRules.length };
  }, [expenses]);

  const categoryTrends = useMemo(() => {
    const categoryTotalsCur = stats.curMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCur = Object.entries(categoryTotalsCur).sort((a, b) => b[1] - a[1]);
    const highestSpender = sortedCur.length > 0 ? sortedCur[0][0] : 'None';
    
    return { highestSpender };
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

    // Run offline NLP engine
    setTimeout(() => {
      const localAnswer = processChatQuery(queryToCheck, expenses, monthlyBudget);
      setChatHistory(prev => [...prev, { role: 'assistant', content: localAnswer }]);
      setChatLoading(false);
    }, 400); // Simulate brief thought process for UX
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-[580px]">
      <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 text-center">
        <div className="flex items-center space-x-2.5 mb-1.5">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight">AI Chat Assistant</h3>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Ask questions about your finances</p>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden mt-4">
        {/* Quick Queries */}
        <div className="mb-3 shrink-0">
          <div className="flex flex-wrap gap-1.5 pr-1">
            <button onClick={() => handleQueryAssistant('Where did I spend the most money?')} className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#CBD5E1] rounded-full transition-all">
              🔍 Where did I spend the most?
            </button>
            <button onClick={() => handleQueryAssistant('What are my upcoming EMIs?')} className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#CBD5E1] rounded-full transition-all">
              📅 upcoming due dates?
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 overflow-y-auto mb-3 space-y-3 font-medium text-xs shadow-inner [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full pr-2">
          {chatHistory.map((ch, idx) => (
            <div key={idx} className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3.5 rounded-2xl max-w-[85%] shadow-sm border ${ch.role === 'user' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-tr-none border-transparent' : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-[#FFFFFF] border-slate-200/85 dark:border-slate-800 rounded-tl-none font-medium'}`}>
                <p className={`whitespace-pre-wrap leading-relaxed text-[13px] ${ch.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-[#CBD5E1]'}`}>{ch.content}</p>
                
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
          ))}
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

        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="text"
            placeholder="Ask about spending..."
            className="flex-1 px-4 py-3 text-xs bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-[#FFFFFF] placeholder-[#94A3B8] outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQueryAssistant()}
          />
          <button onClick={() => handleQueryAssistant()} disabled={!chatInput.trim() || chatLoading} className="w-10 h-10 shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
