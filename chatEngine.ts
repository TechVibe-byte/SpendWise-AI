import { Expense, RecurringExpense } from './types';
import { formatCurrency } from './utils';

export interface ChatResult {
  text: string;
  ui?: 'budget-progress' | 'top-categories' | 'upcoming-bills';
  data?: any;
}

export const processChatQuery = (
  query: string,
  expenses: Expense[],
  monthlyBudget: number
): ChatResult => {
  const norm = query.toLowerCase().trim();

  // Helper to parse dates
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // 1. Time-based extraction
  let filteredExpenses = expenses;
  let timeContext = 'total';
  
  if (norm.includes('yesterday')) {
    const yesterday = new Date(todayStart - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    filteredExpenses = expenses.filter(e => e.date.startsWith(yesterdayStr));
    timeContext = 'yesterday';
  } else if (norm.includes('today')) {
    const todayStr = new Date(todayStart).toISOString().split('T')[0];
    filteredExpenses = expenses.filter(e => e.date.startsWith(todayStr));
    timeContext = 'today';
  } else if (norm.includes('this week')) {
    const lastWeek = new Date(todayStart - 7 * 86400000);
    filteredExpenses = expenses.filter(e => new Date(e.date).getTime() >= lastWeek.getTime());
    timeContext = 'this week';
  } else if (norm.includes('this month')) {
    const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filteredExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix));
    timeContext = 'this month';
  } else if (norm.includes('last month')) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPrefix = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    filteredExpenses = expenses.filter(e => e.date.startsWith(prevMonthPrefix));
    timeContext = 'last month';
  } else {
    // Default to this month for general queries unless asking for everything
    if (!norm.includes('all time') && !norm.includes('total')) {
      const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filteredExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix));
      timeContext = 'this month';
    }
  }

  // 2. Intent matching

  // Spend Intent
  if (norm.includes('how much') && (norm.includes('spend') || norm.includes('spent') || norm.includes('cost'))) {
    // Check for specific merchant/category
    const words = norm.replace(/[?.,]/g, '').split(' ');
    const merchantIndex = words.indexOf('on');
    
    if (merchantIndex !== -1 && merchantIndex + 1 < words.length) {
      const target = words.slice(merchantIndex + 1).filter(w => !['yesterday', 'today', 'this', 'last', 'week', 'month'].includes(w)).join(' ');
      if (target) {
        const specificExpenses = filteredExpenses.filter(e => 
          e.description.toLowerCase().includes(target) || e.category.toLowerCase().includes(target)
        );
        const total = specificExpenses.reduce((sum, e) => sum + e.amount, 0);
        if (total === 0) return { text: `You haven't spent anything on "${target}" ${timeContext}.` };
        return { text: `You spent **${formatCurrency(total)}** on ${target} ${timeContext}.` };
      }
    }
    
    // General total spend
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { text: `You have spent **${formatCurrency(total)}** ${timeContext}.` };
  }

  // Top/Highest Expense Intent
  if (norm.includes('most money') || norm.includes('highest') || norm.includes('top')) {
    if (filteredExpenses.length === 0) return { text: `You have no recorded expenses ${timeContext}.` };
    
    // Check if category or individual
    if (norm.includes('category') || norm.includes('where')) {
      const catTotals = filteredExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
      return {
        text: `Your highest spending category ${timeContext} is **${sorted[0][0]}** at **${formatCurrency(sorted[0][1])}**.`,
        ui: 'top-categories',
        data: sorted.slice(0, 3)
      };
    } else {
      const sorted = [...filteredExpenses].sort((a, b) => b.amount - a.amount);
      const top = sorted[0];
      return { text: `Your highest individual transaction ${timeContext} was **${top.description}** for **${formatCurrency(top.amount)}** on ${top.date}.` };
    }
  }

  // Upcoming Bills Intent
  if (norm.includes('upcoming') || norm.includes('due') || norm.includes('emi') || norm.includes('bill')) {
    const savedRulesRaw = localStorage.getItem('spendwise-recurring');
    const rules: RecurringExpense[] = savedRulesRaw ? JSON.parse(savedRulesRaw) : [];
    const activeRules = rules.filter(r => r.isActive);
    if (activeRules.length === 0) return { text: "You do not have any active recurring obligations configured." };
    
    const entries = activeRules.slice(0, 3).map(r => `• **${r.description}**: ${formatCurrency(r.amount)} (Next: ${r.nextOccurrenceDate})`);
    return {
      text: `📅 **Upcoming Obligations**:\n${entries.join('\n')}${activeRules.length > 3 ? '\n...and more.' : ''}`,
      ui: 'upcoming-bills',
      data: activeRules.slice(0, 3)
    };
  }

  // Budget / Remaining Intent
  if (norm.includes('budget') || norm.includes('remaining') || norm.includes('left')) {
    const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curMonthExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix));
    const curMonthSpent = curMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const rem = monthlyBudget - curMonthSpent;
    const pct = Math.round((curMonthSpent / (monthlyBudget || 1)) * 100);
    
    let textStr = '';
    if (rem < 0) textStr = `🚨 **Budget Alert**: You have exceeded your monthly budget by **${formatCurrency(Math.abs(rem))}**! You are at **${pct}%** consumption.`;
    else textStr = `📊 **Budget Progress**: You have **${formatCurrency(rem)}** remaining in your allocation of **${formatCurrency(monthlyBudget)}** (${pct}% used).`;
    
    return {
      text: textStr,
      ui: 'budget-progress',
      data: { spent: curMonthSpent, budget: monthlyBudget, percentage: pct }
    };
  }

  // Trend / Forecasting Intent
  if (norm.includes('trend') || norm.includes('forecast') || norm.includes('predict') || norm.includes('will i')) {
    const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curMonthExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix));
    const curMonthSpent = curMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyBurnRate = curMonthSpent / dayOfMonth;
    const projectedSpend = dailyBurnRate * daysInMonth;
    
    if (projectedSpend > monthlyBudget) {
      return { text: `📉 **Forecast Alert**: You are spending ~${formatCurrency(dailyBurnRate)}/day. At this rate, you will spend **${formatCurrency(projectedSpend)}** by month-end, exceeding your budget by **${formatCurrency(projectedSpend - monthlyBudget)}**.` };
    } else {
      return { text: `📈 **Forecast**: Excellent! You are spending ~${formatCurrency(dailyBurnRate)}/day. You are on track to finish the month at **${formatCurrency(projectedSpend)}**, safely under your budget!` };
    }
  }

  // Fallback for unrecognized queries
  return { text: "I'm currently operating offline. I can answer questions about your recent spending, highest expenses, upcoming bills, budget status, and end-of-month forecasts. Try asking: 'How much did I spend yesterday?' or 'Will I exceed my budget?'" };
};
