import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, CategoryItem, RecurringExpense } from '../types';
import { formatCurrency } from '../utils';
import { 
  Award, AlertTriangle, TrendingUp, TrendingDown, Calendar, PiggyBank, Target, Sparkles, 
  Trash2, Plus, Send, ChevronDown, ChevronUp, Bell, RefreshCw, Layers, CheckCircle2, Clock
} from 'lucide-react';

interface AIInsightsProps {
  expenses: Expense[];
  categories: CategoryItem[];
  openRouterApiKey: string;
}

interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ expenses, categories, openRouterApiKey }) => {
  // Global & tab navigation
  const [activeTab, setActiveTab] = useState<'health' | 'alerts' | 'goals' | 'chat'>('health');
  
  // States
  const [isHealthDetailExpanded, setIsHealthDetailExpanded] = useState(false);
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem('spendwise-goals');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Emergency Fund', targetAmount: 25000, currentAmount: 18500, targetDate: '2026-12-31' },
      { id: '2', name: 'Vacation Trip', targetAmount: 12000, currentAmount: 4300, targetDate: '2026-08-15' }
    ];
  });
  
  // Goal form inputs
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Chat/Ask Your Data assistant
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi! I am your SpendWise Assistant. Ask me anything about your current budget, top spending items, or upcoming dues!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-save goals
  useEffect(() => {
    localStorage.setItem('spendwise-goals', JSON.stringify(goals));
  }, [goals]);

  // Retrieve current monthly budget
  const monthlyBudget = useMemo(() => {
    const saved = localStorage.getItem('spendwise-budget');
    return saved ? parseFloat(saved) : 50000;
  }, [expenses]);

  // Scroll chat history
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // Date and chronological helpers
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

  // 1. FINANCIAL HEALTH SCORE CALCULATOR
  const healthScoreDetails = useMemo(() => {
    const spent = stats.curMonthSpent;
    const budget = monthlyBudget;
    
    // Factor A: Budget Adherence (35 Points)
    const spentRatio = spent / (budget || 1);
    let budgetAdherencePoints = 0;
    if (spentRatio <= 0.7) {
      budgetAdherencePoints = 35;
    } else if (spentRatio <= 1.0) {
      budgetAdherencePoints = Math.round(35 * (1 - (spentRatio - 0.7) / 0.3));
    } else {
      budgetAdherencePoints = 0;
    }

    // Factor B: Savings Rate (25 Points)
    const remaining = budget - spent;
    const savingsRate = remaining / (budget || 1);
    let savingsPoints = 0;
    if (savingsRate >= 0.3) {
      savingsPoints = 25;
    } else if (savingsRate > 0) {
      savingsPoints = Math.round(25 * (savingsRate / 0.3));
    } else {
      savingsPoints = 0;
    }

    // Factor C: EMI & Debt Burden (15 Points)
    // Categories matching EMI or Loan
    const debtCategories = ['emi expenses', 'loan expenses', 'borrow expenses'];
    const debtSpent = stats.curMonthExpenses
      .filter(e => debtCategories.includes(e.category.toLowerCase()))
      .reduce((sum, e) => sum + e.amount, 0);
    
    const debtRatio = debtSpent / (spent || 1);
    let debtPoints = 15;
    if (spent > 0) {
      if (debtRatio > 0.4) {
        debtPoints = 0;
      } else {
        debtPoints = Math.round(15 * (1 - debtRatio / 0.4));
      }
    }

    // Factor D: Spending Consistency or Frequency of Tracking (15 Points)
    // Consistent users track at least on 6 distinct days per month
    const trackedDaysSet = new Set(stats.curMonthExpenses.map(e => e.date));
    const trackedCount = trackedDaysSet.size;
    let consistencyPoints = Math.min(15, Math.round((trackedCount / 6) * 15));

    // Factor E: Active Recurring Payment Count to Budget ratio (10 Points)
    // Heavy fixed subscription loads lower financial flexibility
    const savedRulesRaw = localStorage.getItem('spendwise-recurring');
    const recurringList: RecurringExpense[] = savedRulesRaw ? JSON.parse(savedRulesRaw) : [];
    const activeRules = recurringList.filter(r => r.isActive);
    const recurringSum = activeRules.reduce((sum, r) => sum + r.amount, 0);
    const recurringRatio = recurringSum / (budget || 1);
    let recurringFlexibilityPoints = 10;
    if (recurringRatio > 0.5) {
      recurringFlexibilityPoints = 0;
    } else {
      recurringFlexibilityPoints = Math.round(10 * (1 - recurringRatio / 0.5));
    }

    const totalScore = budgetAdherencePoints + savingsPoints + debtPoints + consistencyPoints + recurringFlexibilityPoints;

    let status: 'Excellent' | 'Good' | 'Fair' | 'Critical' = 'Critical';
    let colorClass = 'text-red-500 bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-900/45';
    let progressColor = 'bg-red-500';
    let tagline = 'High risk of overspending. Tighten your purse elements immediately!';

    if (totalScore >= 85) {
      status = 'Excellent';
      colorClass = 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/45';
      progressColor = 'bg-emerald-500';
      tagline = 'Phenomenal wealth controls! You are heading towards solid financial safety.';
    } else if (totalScore >= 70) {
      status = 'Good';
      colorClass = 'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/45';
      progressColor = 'bg-indigo-500';
      tagline = 'Healthy balance. Your recurring and discretionary costs are well-contained.';
    } else if (totalScore >= 50) {
      status = 'Fair';
      colorClass = 'text-amber-500 bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/45';
      progressColor = 'bg-amber-500';
      tagline = 'Moderate financial health. Avoid luxury impulses to reinforce savings.';
    }

    return {
      totalScore,
      status,
      colorClass,
      progressColor,
      tagline,
      breakdown: {
        budgetAdherence: { score: budgetAdherencePoints, max: 35, label: 'Budget Cap Adherence' },
        savingsRate: { score: savingsPoints, max: 25, label: 'Proportion of Budget Saved' },
        debtBurden: { score: debtPoints, max: 15, label: 'Debt & Interest Load Ratio' },
        trackingConsistency: { score: consistencyPoints, max: 15, label: 'Expense Tracking Regularity' },
        recurringLoad: { score: recurringFlexibilityPoints, max: 10, label: 'Fixed Subscription Load' }
      }
    };
  }, [stats, monthlyBudget]);

  // 2. SMART SPENDING ALERTS & DUPLICATE TRACKER
  const smartAlerts = useMemo(() => {
    const list: string[] = [];
    const spent = stats.curMonthSpent;
    const budget = monthlyBudget;
    
    // Budget threshold warnings
    const threshold = spent / (budget || 1);
    if (threshold >= 1.0) {
      list.push(`🚨 Budget Exceeded: You are overspent by ${formatCurrency(spent - budget)} this period!`);
    } else if (threshold >= 0.9) {
      list.push(`⚠️ Critical Allowance: You have depleted 90%+ (${formatCurrency(spent)}) of your allocated budget.`);
    } else if (threshold >= 0.8) {
      list.push(`⚠️ Alert: Spending has exceeded 80% (${formatCurrency(spent)}) of your monthly limits.`);
    }

    // Comparison alert
    if (spent > stats.prevMonthSpent && stats.prevMonthSpent > 0) {
      const excess = spent - stats.prevMonthSpent;
      const pct = Math.round((excess / stats.prevMonthSpent) * 100);
      list.push(`📈 Spending Velocity: Your layout is already ${pct}% (${formatCurrency(excess)}) higher than last month's full total!`);
    }

    // Large transactions alert (Single cost > 15% of budget)
    stats.curMonthExpenses.forEach(e => {
      if (e.amount > budget * 0.15) {
        list.push(`💸 Single Spike: "${e.description}" cost ${formatCurrency(e.amount)} (${Math.round((e.amount/budget)*100)}% of total budget).`);
      }
    });

    // Sector allocation warning (>35% of spending on one category)
    const categoryAgg = stats.curMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryAgg).forEach(([catName, amt]) => {
      if (spent > 0 && (amt / spent) > 0.35) {
        const pct = Math.round((amt / spent) * 100);
        list.push(`⚠️ Congested Vector: ${catName} claims ${pct}% of this month's spending. Review opportunities here.`);
      }
    });

    // Upcoming Dues Warnings (within 5 days)
    const savedRulesRaw = localStorage.getItem('spendwise-recurring');
    const recurringList: RecurringExpense[] = savedRulesRaw ? JSON.parse(savedRulesRaw) : [];
    const activeRules = recurringList.filter(r => r.isActive);
    
    activeRules.forEach(rule => {
      const nextDue = new Date(rule.nextOccurrenceDate);
      const timeDiff = nextDue.getTime() - stats.now.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (dayDiff >= 0 && dayDiff <= 5) {
        list.push(`📅 Upcoming Obligation: "${rule.description}" (${formatCurrency(rule.amount)}) is due in ${dayDiff === 0 ? 'today' : dayDiff === 1 ? '1 day' : `${dayDiff} days`}`);
      }
    });

    // Duplicate transaction detection (same amount, same description, within 3 days)
    const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (let i = 0; i < recentExpenses.length; i++) {
      for (let j = i + 1; j < recentExpenses.length; j++) {
        const e1 = recentExpenses[i];
        const e2 = recentExpenses[j];
        
        if (
          e1.id !== e2.id &&
          e1.amount === e2.amount &&
          e1.description.trim().toLowerCase() === e2.description.trim().toLowerCase()
        ) {
          const d1 = new Date(e1.date);
          const d2 = new Date(e2.date);
          const dateDiff = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
          
          if (dateDiff <= 4) {
            list.push(`👥 Potential Duplicate: Double charge detected for "${e1.description}" (${formatCurrency(e1.amount)}) on ${e1.date} and ${e2.date}.`);
            break; // avoid flooding of duplicate warnings for the same group
          }
        }
      }
    }

    return list.slice(0, 5); // display topmost 5 alerts
  }, [stats, monthlyBudget, expenses]);

  // 3. MONTH-END SPENDING PREDICTION
  const predictionDetails = useMemo(() => {
    const spent = stats.curMonthSpent;
    const now = stats.now;
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // Average daily burn rate
    const dailyRate = spent / (currentDay || 1);
    const predictedTotal = Math.round(dailyRate * daysInMonth);
    const remainingBudget = monthlyBudget - spent;
    const predictedSurplus = monthlyBudget - predictedTotal;
    const budgetStatus = predictedTotal <= monthlyBudget ? 'Under control' : 'Risk of exceeding budget';
    const statusColor = predictedTotal <= monthlyBudget ? 'text-emerald-500' : 'text-rose-500';

    return {
      predictedTotal,
      predictedSurplus,
      budgetStatus,
      statusColor,
      daysInMonth,
      currentDay
    };
  }, [stats, monthlyBudget]);

  // 4. SUBSCRIPTION INTELLIGENCE FORECASTER
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

    const annualComm = monthlyComm * 12;
    return {
      monthlyComm,
      annualComm,
      activeCount: activeRules.length
    };
  }, [expenses]); // recalculate when expenses shift

  // 5. SAVINGS OPPORTUNITY FINDER
  const savingsOpportunities = useMemo(() => {
    const list: string[] = [];
    const spent = stats.curMonthSpent;
    
    // Aggregation
    const categoryTotals = stats.curMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const [topCat, topAmt] = sortedCategories[0];
      const tenPercent = Math.round(topAmt * 0.1);
      list.push(`• Trimming spending on **${topCat}** by just 10% next month would put **${formatCurrency(tenPercent)}** back into your wallet.`);
    }

    // High level other category warning
    const otherSum = categoryTotals['Other'] || 0;
    if (spent > 0 && (otherSum / spent) > 0.15) {
      list.push(`• **Other** expenses are unusually high (${formatCurrency(otherSum)}). Categorizing these items will identify hidden leakage points.`);
    }

    if (subscriptionTotals.monthlyComm > 0) {
      list.push(`• Auditing your ${subscriptionTotals.activeCount} active subscriptions and cancelling one unused app could trim up to **${formatCurrency(subscriptionTotals.monthlyComm * 0.15)}** monthly.`);
    }

    if (list.length === 0) {
      list.push('• Maintain discretionary spend as is. Review categories manually for tiny adjustments.');
    }

    return list;
  }, [stats, subscriptionTotals]);

  // 6. SMART CATEGORY TREND ANALYZER
  const categoryTrends = useMemo(() => {
    const categoryTotalsCur = stats.curMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryTotalsPrev = stats.prevMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCur = Object.entries(categoryTotalsCur).sort((a, b) => b[1] - a[1]);
    const highestSpender = sortedCur.length > 0 ? sortedCur[0][0] : 'None';
    
    const sortedCurAsc = Object.entries(categoryTotalsCur).filter(c => c[1] > 0).sort((a, b) => a[1] - b[1]);
    const lowestSpender = sortedCurAsc.length > 0 ? sortedCurAsc[0][0] : 'None';

    // Highlight growing category
    let fastestGrowing = 'None';
    let maxIncrease = 0;
    Object.entries(categoryTotalsCur).forEach(([catName, curAmt]) => {
      const prevAmt = categoryTotalsPrev[catName] || 0;
      const increase = curAmt - prevAmt;
      if (increase > maxIncrease) {
        maxIncrease = increase;
        fastestGrowing = catName;
      }
    });

    return {
      highestSpender,
      lowestSpender,
      fastestGrowing,
      maxIncrease
    };
  }, [stats]);

  // 7. GOAL TRACKING CONTROLLERS
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget || !newGoalDate) return;

    const targetVal = parseFloat(newGoalTarget);
    if (isNaN(targetVal) || targetVal <= 0) return;

    const newGoal: FinancialGoal = {
      id: Math.random().toString(36).substring(2, 9),
      name: newGoalName,
      targetAmount: targetVal,
      currentAmount: 0,
      targetDate: newGoalDate
    };

    setGoals(prev => [...prev, newGoal]);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDate('');
    setShowGoalForm(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdateGoalProgress = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextAmt = Math.max(0, g.currentAmount + amount);
        return { ...g, currentAmount: Math.min(g.targetAmount, nextAmt) };
      }
      return g;
    }));
  };

  // 8. WEEKLY ACTIVITY SUMMARY
  const weeklySummary = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
    
    const weeklyTotal = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const catAgg = weeklyExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
    const topWeeklyCat = Object.entries(catAgg).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    const highestTrans = Math.max(...weeklyExpenses.map(e => e.amount), 0);
    const budgetStatus = weeklyTotal <= (monthlyBudget / 4) ? 'On Track' : 'Elevated Burn';

    return {
      weeklyTotal,
      topWeeklyCat,
      highestTrans,
      budgetStatus,
      potentialSavings: Math.round(weeklyTotal * 0.15)
    };
  }, [expenses, monthlyBudget]);

  // 9. LOCAL QUERY LEXICAL INTELLIGENCE SEARCH ENGINE & FALLBACK PROMPT RUNNER
  const handleQueryAssistant = async (customText?: string) => {
    const queryToCheck = customText || chatInput;
    if (!queryToCheck.trim()) return;

    // Append user message
    setChatHistory(prev => [...prev, { role: 'user', content: queryToCheck }]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    // Normalize
    const normalizedQuery = queryToCheck.toLowerCase().trim();

    // Direct lexical checks first for zero-cost immediate answer!
    const localAnswer = answerQuestionLocally(normalizedQuery);
    if (localAnswer) {
      // Simulate micro typing lag for high visual presence
      setTimeout(() => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: localAnswer }]);
        setChatLoading(false);
      }, 350);
      return;
    }

    // Local checks fail, proceed on OpenRouter sequential fallbacks
    if (!openRouterApiKey) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: '💡 Your query requires deep inference! Please insert an OpenRouter API key inside settings to let the cloud financial model process complex queries.' 
        }]);
        setChatLoading(false);
      }, 400);
      return;
    }

    try {
      const summaryContext = `
        User local budget is ${formatCurrency(monthlyBudget)}.
        Spent current month: ${formatCurrency(stats.curMonthSpent)} out of ${formatCurrency(monthlyBudget)}.
        Total entries: ${expenses.length}.
        Weekly Spend: ${formatCurrency(weeklySummary.weeklyTotal)}.
        Active subscriptions counts: ${subscriptionTotals.activeCount} totaling ${formatCurrency(subscriptionTotals.monthlyComm)} monthly.
        Categories distribution: ${JSON.stringify(Object.fromEntries(stats.curMonthExpenses.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>)))}.
      `;

      // Prompt optimization: restrict token usage forcefully
      const systemPrompt = `You are a strict, ultra-compact financial AI advisor inside SpendWise.
      Format: Output EXACTLY 3 bullet points maximum.
      Limit: Strictly keep response below 90 words.
      Tone: Absolute professional, highly tactical advice. No words of high encouragement, greeting, or decorative fluff.`;

      const prompt = `Context: ${summaryContext}
      Question: "${queryToCheck}"
      Provide a highly focused analytical response satisfying the system limits.`;

      const MODELS_TO_TRY = [
        'google/gemini-2.5-flash',
        'google/gemini-2.5-flash:free',
        'google/gemini-2.5-flash-lite',
        'google/gemini-2.5-flash-lite:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-chat'
      ];

      let responseText = '';
      let success = false;

      for (const modelId of MODELS_TO_TRY) {
        try {
          const apiCall = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'SpendWise',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ]
            })
          });

          if (apiCall.ok) {
            const data = await apiCall.json();
            if (data.choices?.[0]?.message?.content) {
              responseText = data.choices[0].message.content;
              success = true;
              break;
            }
          }
        } catch (_) {}
      }

      if (success) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: '📡 Financial model is saturated currently. Please retry in a few moments, or ask key quantitative points that I resolve instantly offline.' }]);
      }
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection failed. Please check your network context.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const answerQuestionLocally = (norm: string): string | null => {
    // 1. Food query
    if (norm.includes('food') || norm.includes('dining') || norm.includes('swiggy') || norm.includes('zomato')) {
      const foodSpent = stats.curMonthExpenses
        .filter(e => e.category.toLowerCase().includes('food') || e.category.toLowerCase().includes('dining'))
        .reduce((sum, e) => sum + e.amount, 0);
      return `📊 **Food Spend Index**: You have laid out **${formatCurrency(foodSpent)}** on Food & Dining so far this month, which represents about **${stats.curMonthSpent > 0 ? Math.round((foodSpent / stats.curMonthSpent) * 100) : 0}%** of this month's spending.`;
    }

    // 2. Highest expense query
    if (norm.includes('most money') || norm.includes('highest spend') || norm.includes('top category') || norm.includes('where did i spend the most')) {
      if (stats.curMonthExpenses.length === 0) {
        return "You have not recorded any expenditures for this billing cycle yet!";
      }
      return `📊 **Sector Cap**: Your highest expenditure sector is **${categoryTrends.highestSpender}**, consuming a total load of **${formatCurrency(stats.curMonthSpent > 0 ? stats.curMonthExpenses.filter(e => e.category === categoryTrends.highestSpender).reduce((s, e) => s + e.amount, 0) : 0)}** this period.`;
    }

    // 3. Upcoming bills
    if (norm.includes('upcoming emi') || norm.includes('upcoming bills') || norm.includes('due soon') || norm.includes('recurring') || norm.includes('obligations')) {
      const savedRulesRaw = localStorage.getItem('spendwise-recurring');
      const rules: RecurringExpense[] = savedRulesRaw ? JSON.parse(savedRulesRaw) : [];
      const activeRules = rules.filter(r => r.isActive);
      if (activeRules.length === 0) {
        return "You do not have any active recurring obligations configured.";
      }
      const entries = activeRules.map(r => `• **${r.description}**: ${formatCurrency(r.amount)} is scheduled next on ${r.nextOccurrenceDate} (${r.frequency})`);
      return `📅 **Upcoming Obligations Forecast**:\n${entries.join('\n')}`;
    }

    // 4. Budget progress
    if (norm.includes('budget') || norm.includes('remaining') || norm.includes('where i stand') || norm.includes('balance') || norm.includes('how much can i spend')) {
      const rem = monthlyBudget - stats.curMonthSpent;
      const pct = Math.round((stats.curMonthSpent / (monthlyBudget || 1)) * 100);
      if (rem < 0) {
        return `🚨 **Budget Alert**: You have exceeded your budget by **${formatCurrency(Math.abs(rem))}**! You are at **${pct}%** consumption.`;
      }
      return `📊 **Budget Progress**: You have **${formatCurrency(rem)}** remaining in your allocation of **${formatCurrency(monthlyBudget)}** (${pct}% used).`;
    }

    // 5. Comparison
    if (norm.includes('growth') || norm.includes('increase') || norm.includes('compared to last month') || norm.includes('growing')) {
      const difference = stats.curMonthSpent - stats.prevMonthSpent;
      if (stats.prevMonthSpent === 0) {
        return "Not enough data from last month to form a comparative layout.";
      }
      if (difference > 0) {
        return `📈 **Trend Spike**: You have spent **${formatCurrency(difference)}** (+${Math.round((difference / stats.prevMonthSpent) * 100)}%) more than last month's matching cycle. Consider deferring luxury transactions.`;
      } else {
        return `📉 **Trend Curvature**: Splendid! You are spent **${formatCurrency(Math.abs(difference))}** (-${Math.round((Math.abs(difference) / stats.prevMonthSpent) * 100)}%) below previous month's thresholds. Keep it up!`;
      }
    }

    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-[580px]">
      {/* Title & Refresh */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight">Financial Intelligence</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tactical savings & performance models</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">Offline Active</span>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl my-4 shrink-0">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'health' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          Health
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg relative transition-all ${activeTab === 'alerts' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          Alerts
          {smartAlerts.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'goals' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          Goals
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          Ask Bot
        </button>
      </div>

      {/* Tab Panels with Scroll constraint */}
      <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin scrollbar-thumb-purple-100 dark:scrollbar-thumb-purple-900/40">
        
        {/* PANEL A: HEALTH SCORE & STATS */}
        {activeTab === 'health' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Health Score Gauge */}
            <div className={`p-4 rounded-2xl border ${healthScoreDetails.colorClass} shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Monthly Health Score</span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-3xl font-black font-mono">{healthScoreDetails.totalScore}</span>
                    <span className="text-sm font-semibold opacity-70">/ 100</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/70 dark:bg-black/30 rounded-full border border-current text-xs font-black uppercase tracking-wider">
                  {healthScoreDetails.status}
                </div>
              </div>
              
              {/* Linear Gauge */}
              <div className="w-full h-2.5 bg-slate-200/50 dark:bg-slate-800/40 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full ${healthScoreDetails.progressColor} transition-all duration-500`}
                  style={{ width: `${healthScoreDetails.totalScore}%` }}
                />
              </div>

              {/* Tagline */}
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {healthScoreDetails.tagline}
              </p>

              {/* Expandable detailed factor listing */}
              <button 
                onClick={() => setIsHealthDetailExpanded(!isHealthDetailExpanded)}
                className="w-full flex items-center justify-center space-x-1 mt-3 pt-2.5 border-t border-dashed border-slate-300/30 text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <span>{isHealthDetailExpanded ? 'Hide Factors' : 'Reveal Factor Values'}</span>
                {isHealthDetailExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {isHealthDetailExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 space-y-2 pt-2 border-t border-slate-200/30 font-medium"
                  >
                    {Object.entries(healthScoreDetails.breakdown).map(([key, item]) => (
                      <div key={key} className="flex justify-between items-center text-xs py-0.5">
                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-200">{item.score} / {item.max}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* predictions and month-end projection */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150-custom dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Month-End Expenditure Forecast
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase leading-none">Expected Spend</p>
                  <p className={`text-lg font-black font-mono mt-1 ${predictionDetails.predictedTotal > monthlyBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {formatCurrency(predictionDetails.predictedTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase leading-none">Surplus Target</p>
                  <p className="text-lg font-black font-mono mt-1 text-slate-700 dark:text-slate-300">
                    {formatCurrency(predictionDetails.predictedSurplus)}
                  </p>
                </div>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400 uppercase tracking-wide">Forecast State</span>
                <span className={predictionDetails.statusColor}>{predictionDetails.budgetStatus}</span>
              </div>
            </div>

            {/* Weekly activity report card */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150-custom dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                Weekly Activity Rollup
              </span>
              <div className="space-y-2 mt-1 font-medium text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Spend (Last 7 Days)</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(weeklySummary.weeklyTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Main Spender Category</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">{weeklySummary.topWeeklyCat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Transaction cost</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(weeklySummary.highestTrans)}</span>
                </div>
              </div>
            </div>

            {/* Savings Opportunity display */}
            <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100/60 dark:border-purple-900/35 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
                Target Opportunities Locator
              </span>
              <div className="space-y-1.5 mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {savingsOpportunities.map((op, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: op.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-800 dark:text-slate-200">$1</strong>') }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PANEL B: ALERTS & DUPLICATES AND SUBSCRIPTIONS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Real-time alerts queue */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5 pl-1">
                <Bell className="w-3.5 h-3.5 text-slate-400 animate-bounce" />
                Durable Signals & Warning Log
              </span>
              
              {smartAlerts.length === 0 ? (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/25 border border-emerald-100/60 dark:border-emerald-900/40 p-4 rounded-xl flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold leading-normal">Outstanding status! No critical budget threshold overrides or duplicates detected.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {smartAlerts.map((alt, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 text-xs font-semibold leading-relaxed rounded-xl border flex items-start space-x-2.5 ${alt.includes('🚨') || alt.includes('Critical') ? 'bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border-rose-100/50 dark:border-rose-900/40' : alt.includes('👥') ? 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border-amber-100/50 dark:border-amber-900/40' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-650 dark:text-slate-350 border-slate-100 dark:border-slate-800'}`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{alt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subscription Foresights */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150-custom dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5 mb-3">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Subscription Load Analyzer
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">Monthly Load</span>
                  <p className="text-lg font-black font-mono mt-1 text-slate-800 dark:text-slate-200">
                    {formatCurrency(subscriptionTotals.monthlyComm)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">Yearly Projection</span>
                  <p className="text-lg font-black font-mono mt-1 text-slate-800 dark:text-slate-200">
                    {formatCurrency(subscriptionTotals.annualComm)}
                  </p>
                </div>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-dashed border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 flex justify-between items-center">
                <span>Active commitments</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{subscriptionTotals.activeCount} rules</span>
              </div>
            </div>

            {/* Sector Growth trends */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150-custom dark:border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                Sector Displacement Rate
              </span>
              <div className="space-y-2 mt-1 font-medium text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450 text-slate-500">Fastest Rising Cost</span>
                  <span className="font-bold text-rose-500">{categoryTrends.fastestGrowing}</span>
                </div>
                {categoryTrends.maxIncrease > 0 && (
                  <div className="flex justify-between text-[11px] pl-2 border-l border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Increase Margin</span>
                    <span className="font-bold text-rose-450 font-mono">+{formatCurrency(categoryTrends.maxIncrease)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-450 text-slate-500">Restrained Cost Sector</span>
                  <span className="font-bold text-emerald-500">{categoryTrends.lowestSpender}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL C: FINANCIAL SAVINGS GOAL TRACKER */}
        {activeTab === 'goals' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pl-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-400" />
                Durable Wealth Objectives
              </span>
              {!showGoalForm && (
                <button
                  onClick={() => setShowGoalForm(true)}
                  className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/80 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Goal
                </button>
              )}
            </div>

            {/* Quick Create form */}
            {showGoalForm && (
              <form onSubmit={handleAddGoal} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-normal">New Objective</p>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Laptop Purchase"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Target Amount (₹)"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                  />
                  <input
                    type="date"
                    required
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1.5">
                  <submit
                    type="submit"
                    onClick={(e) => {
                      handleAddGoal(e);
                    }}
                    className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2.5 text-xs font-bold cursor-pointer"
                  >
                    Confirm Goal
                  </submit>
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="flex-1 text-center border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {goals.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <PiggyBank className="w-8 h-8 text-slate-405 text-slate-450 mx-auto opacity-70 mb-2" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Active Financial Goals</p>
                <p className="text-[11px] text-slate-400 mt-1 dark:text-slate-500">Track and target emergency ratios dynamically.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((g) => {
                  const pct = Math.round((g.currentAmount / g.targetAmount) * 100) || 0;
                  return (
                    <div key={g.id} className="p-4 border border-slate-150-custom dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 rounded-2xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-150 leading-tight">{g.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">Due Date: {g.targetDate}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Trash Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Cash Progress indicator */}
                      <div className="flex justify-between items-baseline text-[11px] font-bold font-mono mt-3">
                        <span className="text-slate-500">{formatCurrency(g.currentAmount)}</span>
                        <span className="text-slate-400">of {formatCurrency(g.targetAmount)} ({pct}%)</span>
                      </div>

                      {/* Goal progression gauge */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Increment / Decrement actions */}
                      <div className="flex items-center justify-end space-x-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/50">
                        <button
                          onClick={() => handleUpdateGoalProgress(g.id, -1000)}
                          className="px-2 py-1 border border-slate-250 dark:border-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          -₹1,000
                        </button>
                        <button
                          onClick={() => handleUpdateGoalProgress(g.id, 1000)}
                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100/40 dark:border-purple-900/30 text-[10px] font-black rounded-md hover:bg-purple-105 transition-all"
                        >
                          +₹1,000
                        </button>
                        <button
                          onClick={() => handleUpdateGoalProgress(g.id, 5000)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-705 text-white text-[10px] font-black rounded-md transition-all"
                        >
                          +₹5,000
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL D: COMPACT "ASK YOUR DATA" AI CHAT ASSISTANT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full min-h-[380px] pt-1 animate-in fade-in duration-200">
            {/* Quick Queries Suggestion chips */}
            <div className="mb-3 shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-[#CBD5E1] block mb-1.5 pl-1">
                ⚡ Popular Data Queries
              </span>
              <div className="flex flex-wrap gap-1.5 pr-1">
                <button
                  type="button"
                  onClick={() => handleQueryAssistant('Where did I spend the most money?')}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-[#CBD5E1] rounded-full transition-all cursor-pointer"
                >
                  🔍 Where did I spend the most?
                </button>
                <button
                  type="button"
                  onClick={() => handleQueryAssistant('How much did I spend on Food this month?')}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-[#CBD5E1] rounded-full transition-all cursor-pointer"
                >
                  🍔 spent on Food?
                </button>
                <button
                  type="button"
                  onClick={() => handleQueryAssistant('What are my upcoming EMIs?')}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-[#CBD5E1] rounded-full transition-all cursor-pointer"
                >
                  📅 upcoming due dates?
                </button>
                <button
                  type="button"
                  onClick={() => handleQueryAssistant('Which category increased compared to last month?')}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-[#CBD5E1] rounded-full transition-all cursor-pointer"
                >
                  📈 rising trends?
                </button>
              </div>
            </div>

            {/* Chats stream container */}
            <div className="flex-1 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 overflow-y-auto max-h-[220px] mb-3 space-y-3 font-medium text-xs shadow-inner">
              {chatHistory.map((ch, idx) => {
                const isWelcome = idx === 0 && ch.role === 'assistant';
                
                if (isWelcome) {
                  return (
                    <div key={idx} className="flex justify-start">
                      <div className="p-5 rounded-2xl max-w-[95%] bg-slate-100/50 dark:bg-[#1E293B] text-slate-900 dark:text-[#FFFFFF] border border-slate-200/50 dark:border-slate-800 shadow-sm rounded-tl-none">
                        <div className="flex items-center space-x-2 text-indigo-600 dark:text-purple-400 mb-2 font-black shrink-0">
                          <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                          <span className="text-[11px] tracking-widest uppercase font-bold">SpendWise Hub</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-[14px] font-semibold text-slate-800 dark:text-[#FFFFFF]">
                          {ch.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`p-3.5 md:p-4 rounded-2xl max-w-[85%] shadow-sm border ${
                        ch.role === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-tr-none border-transparent' 
                          : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-[#FFFFFF] border-slate-200/85 dark:border-slate-800 rounded-tl-none font-medium'
                      }`}
                    >
                      <p className={`whitespace-pre-wrap leading-relaxed text-[13px] ${ch.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-[#CBD5E1]'}`}>
                        {ch.content}
                      </p>
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

            {/* Input form */}
            <div className="flex items-center space-x-2 pb-1 shrink-0">
              <input
                type="text"
                placeholder="Ask about spending or forecast trends..."
                className="flex-1 px-4 py-3 text-xs bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-[#FFFFFF] placeholder-[#94A3B8] placeholder:text-[#94A3B8] caret-purple-600 dark:caret-purple-400 outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQueryAssistant();
                }}
              />
              <button
                type="button"
                onClick={() => handleQueryAssistant()}
                disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-sm transform active:scale-95 cursor-pointer"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
