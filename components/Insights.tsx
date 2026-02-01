
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Expense, SpendingInsight } from '../types';
import { getFinancialInsights, getApiKey } from '../services/geminiService';

interface InsightsProps {
  expenses: Expense[];
}

const Insights: React.FC<InsightsProps> = ({ expenses }) => {
  const [insight, setInsight] = useState<SpendingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  const fetchInsights = async () => {
    if (expenses.length === 0) return;
    
    // Check key before making request
    if (!getApiKey()) {
      setMissingKey(true);
      return;
    }

    setLoading(true);
    setError(null);
    setMissingKey(false);
    
    try {
      const data = await getFinancialInsights(expenses);
      setInsight(data);
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING') {
        setMissingKey(true);
      } else {
        setError("Failed to generate insights. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if key exists on mount to update UI state immediately
    const hasKey = !!getApiKey();
    setMissingKey(!hasKey);

    if (expenses.length > 0 && !insight && hasKey) {
      fetchInsights();
    }
  }, [expenses]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center">
              <span className="mr-2">✨</span> SpendWise Insights
            </h2>
            <p className="text-indigo-100 dark:text-indigo-200/70 text-sm opacity-80">AI-powered analysis of your spending</p>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading || missingKey}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {missingKey ? (
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Enable AI Expense Analysis</h3>
            <p className="text-indigo-100 text-sm mb-4 max-w-sm mx-auto">
              Please add your Gemini API Key in Settings to unlock personalized spending insights and suggestions.
            </p>
            <Link 
              to="/settings" 
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
            >
              Go to Settings
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-full"></div>
            <div className="h-4 bg-white/20 rounded w-2/3"></div>
          </div>
        ) : error ? (
           <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30 text-sm text-red-100">
             {error}
           </div>
        ) : insight ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <p className="text-lg leading-relaxed text-indigo-50 dark:text-slate-200">{insight.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center text-indigo-100 dark:text-indigo-300">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Suggestions
                </h4>
                <ul className="space-y-2 text-sm text-indigo-50 dark:text-slate-300">
                  {insight.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-indigo-300 dark:text-indigo-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/10 dark:bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <h4 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center text-indigo-100 dark:text-indigo-300">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Saving Tips
                </h4>
                <ul className="space-y-2 text-sm text-indigo-50 dark:text-slate-300">
                  {insight.savingTips.map((t, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-indigo-300 dark:text-indigo-400">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-indigo-200 dark:text-slate-400">Start adding expenses to see personalized AI insights!</p>
        )}
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-indigo-500/30 dark:bg-indigo-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-violet-400/20 dark:bg-slate-800/20 rounded-full blur-3xl"></div>
    </div>
  );
};

export default Insights;
