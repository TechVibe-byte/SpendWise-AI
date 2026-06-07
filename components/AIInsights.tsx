import React, { useState, useEffect } from 'react';
import { Expense, CategoryItem } from '../types';
import { formatCurrency } from '../utils';

interface AIInsightsProps {
  expenses: Expense[];
  categories: CategoryItem[];
  openRouterApiKey: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ expenses, categories, openRouterApiKey }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!openRouterApiKey) {
      setError('Please set your OpenRouter API Key in Settings to use AI Insights.');
      return;
    }

    if (expenses.length === 0) {
      setError('Not enough expense data to generate insights. Add some expenses first!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare data summary for the AI
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const categoryTotals = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

      const prompt = `
        I am a user of an expense tracking app. Here is a summary of my recent expenses:
        Total Spent: ${formatCurrency(totalSpent)}
        
        Spending by Category:
        ${Object.entries(categoryTotals).map(([cat, amount]) => `- ${cat}: ${formatCurrency(amount)}`).join('\n')}
        
        Please provide a brief, helpful financial analysis. Include:
        1. A short summary of my spending habits.
        2. 2-3 actionable suggestions to save money based on the categories where I spend the most.
        3. A positive, encouraging closing thought.
        
        Keep the response concise, friendly, and formatted in Markdown.
      `;

      const MODELS_TO_TRY = [
        'google/gemini-2.5-flash',
        'google/gemini-2.5-flash:free',
        'google/gemini-2.5-flash-lite',
        'google/gemini-2.5-flash-lite:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-chat',
        'nvidia/llama-3.1-nemotron-70b-instruct:free'
      ];

      let lastErrorMsg = '';
      let success = false;
      let chosenModel = '';

      for (let i = 0; i < MODELS_TO_TRY.length; i++) {
        const currentModel = MODELS_TO_TRY[i];
        try {
          console.log(`Attempting to fetch AI insights with model: ${currentModel}`);
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'SpendWise',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: currentModel,
              messages: [
                { role: 'system', content: 'You are a helpful and encouraging financial advisor.' },
                { role: 'user', content: prompt }
              ]
            })
          });

          if (!response.ok) {
            let errMessage = `HTTP error ${response.status}`;
            try {
              const errData = await response.json();
              errMessage = errData.error?.message || errMessage;
            } catch (_) {
              // JSON parse failed
            }
            throw new Error(errMessage);
          }

          const data = await response.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            setInsights(data.choices[0].message.content);
            success = true;
            chosenModel = currentModel;
            break; // Success! Exit the fallback loop.
          } else {
            throw new Error('Invalid response structure from OpenRouter.');
          }
        } catch (err: any) {
          console.warn(`Model ${currentModel} failed:`, err.message);
          lastErrorMsg = err.message || 'Unknown model error.';
          // Proceed to next model in sequential fallback
        }
      }

      if (!success) {
        // Build a user-friendly error message instead of showing raw payload errors
        let friendlyError = 'Our AI Financial Advisor is currently experiencing high traffic. Please try again in a few moments.';
        
        const lowerError = lastErrorMsg.toLowerCase();
        if (lowerError.includes('api key') || lowerError.includes('unauthorized') || lowerError.includes('401') || lowerError.includes('key not found')) {
          friendlyError = 'Invalid API key or key not found. Please verify your OpenRouter credentials in Settings.';
        } else if (lowerError.includes('rate limit') || lowerError.includes('429') || lowerError.includes('too many requests')) {
          friendlyError = 'Rate limit exceeded. Please wait a moment and click the refresh button to try again.';
        } else if (lowerError.includes('balance') || lowerError.includes('credits') || lowerError.includes('insufficient') || lowerError.includes('402')) {
          friendlyError = 'Your OpenRouter account has insufficient credits. Please top up your OpenRouter balance or check your credit limit.';
        } else if (lowerError.includes('model') || lowerError.includes('unavailable') || lowerError.includes('not a valid model id')) {
          friendlyError = 'The configured AI models are currently offline or unavailable. Please try again or verify your OpenRouter key covers these models.';
        } else {
          friendlyError = `Could not generate insights: "${lastErrorMsg}". Please verify your internet connection or OpenRouter account status and try again.`;
        }
        throw new Error(friendlyError);
      } else {
        console.info(`Successfully generated insights using model: ${chosenModel}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (openRouterApiKey && expenses.length > 0 && !insights && !loading && !error) {
      fetchInsights();
    }
  }, [openRouterApiKey, expenses]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Insights</h2>
      
      {!openRouterApiKey ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">API Key Required</h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm mt-1 mb-4">
                To use AI Insights, you need to provide an OpenRouter API key. OpenRouter provides free access to many AI models.
              </p>
              <a href="#/settings" className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
                Go to Settings
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Financial Advisor</h3>
            </div>
            <button 
              onClick={fetchInsights}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
              title="Refresh Insights"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            </div>
          ) : insights ? (
            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              {/* Simple markdown rendering for the insights */}
              {insights.split('\n').map((line, i) => {
                if (line.startsWith('### ')) return <h4 key={i} className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white">{line.replace('### ', '')}</h4>;
                if (line.startsWith('## ')) return <h3 key={i} className="text-xl font-bold mt-5 mb-3 text-slate-900 dark:text-white">{line.replace('## ', '')}</h3>;
                if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-white">{line.replace('# ', '')}</h2>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1">{line.substring(2)}</li>;
                if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                if (line.trim() === '') return <br key={i} />;
                
                // Handle bold text
                let formattedLine = line;
                const boldRegex = /\*\*(.*?)\*\*/g;
                if (boldRegex.test(line)) {
                  const parts = line.split(boldRegex);
                  return (
                    <p key={i} className="mb-2">
                      {parts.map((part, index) => 
                        index % 2 === 1 ? <strong key={index} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part
                      )}
                    </p>
                  );
                }
                
                return <p key={i} className="mb-2">{line}</p>;
              })}
            </div>
          ) : !error && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Click the refresh button to generate insights.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
