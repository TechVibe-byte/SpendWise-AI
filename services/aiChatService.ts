import { GoogleGenAI } from '@google/genai';
import { Expense, RecurringExpense, EMITrackerItem, SalaryTrackerItem, BorrowMoneyItem, LendMoneyItem, AISettings } from '../types';
import { formatCurrency } from '../utils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Builds an ultra-compact summary of user's financial state
 * Designed specifically to consume minimal prompt tokens (< 150 tokens)
 */
export const buildCompactFinancialContext = (
  expenses: Expense[],
  monthlyBudget: number,
  emis: EMITrackerItem[] = [],
  salaries: SalaryTrackerItem[] = [],
  borrowed: BorrowMoneyItem[] = [],
  lent: LendMoneyItem[] = []
): string => {
  const now = new Date();
  const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  const monthExpenses = expenses.filter(e => e.date.startsWith(curMonthPrefix));
  const monthSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const todaySpent = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);

  // Top 3 categories
  const catMap: Record<string, number> = {};
  monthExpenses.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, amt]) => `${c}:${amt}`)
    .join(', ');

  // Active EMIs
  const activeEmis = emis.filter(e => e.status === 'active');
  const monthlyEmiTotal = activeEmis.reduce((s, e) => s + e.emiAmount, 0);

  // Pending Lent to Friends/Relatives
  const pendingLent = lent.filter(l => l.status !== 'returned');
  const lentTotal = pendingLent.reduce((s, l) => s + (l.amount - l.returnedAmount), 0);

  // Pending Borrowed
  const pendingBorrow = borrowed.filter(b => b.status !== 'settled');
  const borrowTotal = pendingBorrow.reduce((s, b) => s + (b.amount - b.repaidAmount), 0);

  // Last 3 expenses (short)
  const last3 = expenses
    .slice(0, 3)
    .map(e => `${e.date.slice(5)} ${e.description.slice(0, 15)} ${e.amount}`)
    .join('; ');

  return `Current Financial Snapshot:
Today Spent: ${todaySpent}
Month Spent: ${monthSpent} (Budget: ${monthlyBudget})
Top Categories: ${topCats || 'None'}
Active EMIs: ${activeEmis.length} (${monthlyEmiTotal}/mo)
Money Lent Pending: ${lentTotal} across ${pendingLent.length} people
Money Borrowed Pending: ${borrowTotal}
Recent: ${last3 || 'None'}`;
};

const SYSTEM_INSTRUCTION = `You are SpendWise AI, an ultra-concise financial assistant. Answer questions directly using the provided financial snapshot. Keep answers short, factual, and strictly under 3 sentences or quick bullet points. Do not give financial lectures.`;

/**
 * Sends a chat query using Google Gemini API or OpenRouter API
 */
export const queryAI = async (
  prompt: string,
  history: ChatMessage[],
  aiSettings: AISettings,
  contextData: string
): Promise<string> => {
  const provider = aiSettings.provider;

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const key = aiSettings.geminiApiKey?.trim();
    if (!key) {
      throw new Error('Please enter your Google Gemini API Key in Settings to use Google AI.');
    }

    try {
      const recentHistory = history.slice(-4).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const payload = {
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          ...recentHistory,
          {
            role: 'user',
            parts: [{ text: `${contextData}\n\nUser Question: ${prompt}` }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.3
        }
      };

      // Try official Gemini 2.5 Flash endpoint, fallback to 2.0 Flash if needed
      let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok && res.status === 404) {
        // Fallback to gemini-2.0-flash
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Google API returned status ${res.status}`);
      }

      const resData = await res.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || 'No response generated from Gemini.';
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      throw new Error(`Google Gemini Error: ${err.message || 'Failed to generate response'}`);
    }
  }

  // 2. OpenRouter Provider (Claude or Free models)
  if (provider === 'openrouter') {
    const key = aiSettings.openRouterApiKey?.trim();
    if (!key) {
      throw new Error('Please enter your OpenRouter API Key in Settings.');
    }

    const model = aiSettings.openRouterModel || 'google/gemini-2.0-flash-lite-001';

    try {
      const recentHistory = history.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SpendWise'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...recentHistory,
            { role: 'user', content: `${contextData}\n\nUser Question: ${prompt}` }
          ],
          max_tokens: 250,
          temperature: 0.3
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter returned status ${res.status}`);
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content;
      return answer || 'No response received from OpenRouter model.';
    } catch (err: any) {
      console.error('OpenRouter Error:', err);
      throw new Error(`OpenRouter Error: ${err.message || 'Failed to call model'}`);
    }
  }

  throw new Error('Unknown AI provider selected.');
};
