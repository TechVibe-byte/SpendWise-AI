import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Expense, EMITrackerItem, SalaryTrackerItem, BorrowMoneyItem, LendMoneyItem, AISettings } from '../types';
import { formatCurrency } from '../utils';
import { Send, Sparkles, X, Settings2, Key, Bot, ChevronDown, Check } from 'lucide-react';
import { processChatQuery } from '../chatEngine';
import { queryAI, buildCompactFinancialContext } from '../services/aiChatService';

interface ChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  monthlyBudget: number;
  emis?: EMITrackerItem[];
  salaries?: SalaryTrackerItem[];
  borrowed?: BorrowMoneyItem[];
  lent?: LendMoneyItem[];
  aiSettings: AISettings;
  onUpdateAiSettings: (settings: AISettings) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ui?: 'budget-progress' | 'top-categories' | 'upcoming-bills';
  data?: any;
}

export const ChatBotModal: React.FC<ChatBotModalProps> = ({
  isOpen,
  onClose,
  expenses,
  monthlyBudget,
  emis = [],
  salaries = [],
  borrowed = [],
  lent = [],
  aiSettings,
  onUpdateAiSettings
}) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I am SpendWise AI. Ask me about your daily/monthly spending, upcoming EMIs, money lent to friends, or budget forecast!'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Local config edits
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openrouter'>(aiSettings.provider || 'gemini');
  const [geminiKeyInput, setGeminiKeyInput] = useState(aiSettings.geminiApiKey || '');
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState(aiSettings.openRouterApiKey || '');
  const [openRouterModelInput, setOpenRouterModelInput] = useState(aiSettings.openRouterModel || 'google/gemini-2.0-flash-lite-001');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading, isOpen]);

  useEffect(() => {
    setSelectedProvider(aiSettings.provider || 'gemini');
    setGeminiKeyInput(aiSettings.geminiApiKey || '');
    setOpenRouterKeyInput(aiSettings.openRouterApiKey || '');
    setOpenRouterModelInput(aiSettings.openRouterModel || 'google/gemini-2.0-flash-lite-001');
  }, [aiSettings]);

  const saveAiConfig = () => {
    onUpdateAiSettings({
      provider: selectedProvider,
      geminiApiKey: geminiKeyInput.trim(),
      openRouterApiKey: openRouterKeyInput.trim(),
      openRouterModel: openRouterModelInput
    });
    setShowConfig(false);
  };

  const handleQueryAssistant = async (customText?: string) => {
    const queryToCheck = customText || chatInput;
    if (!queryToCheck.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: queryToCheck };
    setChatHistory(prev => [...prev, userMessage]);
    if (!customText) setChatInput('');
    setChatLoading(true);

    const hasGemini = selectedProvider === 'gemini' && !!geminiKeyInput.trim();
    const hasOpenRouter = selectedProvider === 'openrouter' && !!openRouterKeyInput.trim();

    if (hasGemini || hasOpenRouter) {
      try {
        // Build ultra-compact financial snapshot (< 150 prompt tokens)
        const compactContext = buildCompactFinancialContext(
          expenses,
          monthlyBudget,
          emis,
          salaries,
          borrowed,
          lent
        );

        const currentSettings: AISettings = {
          provider: selectedProvider,
          geminiApiKey: geminiKeyInput.trim(),
          openRouterApiKey: openRouterKeyInput.trim(),
          openRouterModel: openRouterModelInput
        };

        const aiResponse = await queryAI(
          queryToCheck,
          chatHistory.map(h => ({ role: h.role, content: h.content })),
          currentSettings,
          compactContext
        );

        setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      } catch (err: any) {
        console.warn('AI API Error, falling back to local engine:', err);
        // Fallback to offline rule engine
        const localAnswer = processChatQuery(queryToCheck, expenses, monthlyBudget);
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Note: (${err.message || 'AI request failed'})\n\nUsing instant local answer:\n${localAnswer.text}`,
            ui: localAnswer.ui,
            data: localAnswer.data
          }
        ]);
      } finally {
        setChatLoading(false);
      }
    } else {
      // Deterministic Offline Rule Engine (Zero Tokens Consumed)
      setTimeout(() => {
        const localAnswer = processChatQuery(queryToCheck, expenses, monthlyBudget);
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: localAnswer.text,
            ui: localAnswer.ui,
            data: localAnswer.data
          }
        ]);
        setChatLoading(false);
      }, 300);
    }
  };

  if (!isOpen) return null;

  const isConfigured = (selectedProvider === 'gemini' && !!geminiKeyInput.trim()) ||
                       (selectedProvider === 'openrouter' && !!openRouterKeyInput.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B1220] w-full max-w-lg sm:rounded-3xl rounded-t-3xl sm:border border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] sm:h-[620px] animate-in slide-in-from-bottom-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">SpendWise Assistant</h3>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isConfigured 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}>
                  {isConfigured ? (selectedProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter AI') : 'Offline / Free Mode'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Low token consumption AI intelligence</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Configure Google Gemini or OpenRouter API"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Config Slide-down Drawer */}
        {showConfig && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                AI Provider Settings
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Token Saver Active (Max 250 Tokens)
              </span>
            </div>

            {/* Provider Switcher */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedProvider('gemini')}
                className={`py-2 px-3 rounded-xl font-bold border text-left flex items-center justify-between transition-all ${
                  selectedProvider === 'gemini'
                    ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-500 text-violet-700 dark:text-violet-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Google Gemini</span>
                {selectedProvider === 'gemini' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('openrouter')}
                className={`py-2 px-3 rounded-xl font-bold border text-left flex items-center justify-between transition-all ${
                  selectedProvider === 'openrouter'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>OpenRouter (Claude/Free)</span>
                {selectedProvider === 'openrouter' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Fields based on provider */}
            {selectedProvider === 'gemini' ? (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Uses lightweight Gemini 3.1 Flash Lite. Extremely fast and consumes minimal tokens.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={openRouterKeyInput}
                    onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Select Model
                  </label>
                  <select
                    value={openRouterModelInput}
                    onChange={(e) => setOpenRouterModelInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="google/gemini-2.0-flash-lite-001">Gemini 2.0 Flash Lite (Free & Low Token)</option>
                    <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku (Fast & Precise)</option>
                    <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Economical)</option>
                    <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Free Tier)</option>
                    <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free Tier)</option>
                    <option value="qwen/qwen-2.5-7b-instruct:free">Qwen 2.5 7B (Free Tier)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAiConfig}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-col flex-1 p-4 overflow-hidden">
          {/* Quick Query Pills */}
          <div className="mb-2 shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1 pl-1">
              ⚡ Quick Questions
            </span>
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => handleQueryAssistant('How much did I spend today?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full transition-all"
              >
                📅 Today's spend?
              </button>
              <button
                onClick={() => handleQueryAssistant('What are my upcoming EMIs?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full transition-all"
              >
                💳 Upcoming EMIs?
              </button>
              <button
                onClick={() => handleQueryAssistant('How much money did I give to friends/relatives?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full transition-all"
              >
                🤝 Money lent status?
              </button>
              <button
                onClick={() => handleQueryAssistant('Where did I spend the most money this month?')}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-full transition-all"
              >
                🔍 Top expense?
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 bg-slate-50/60 dark:bg-[#080E1A] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 overflow-y-auto mb-3 space-y-3 font-medium text-xs shadow-inner">
            {chatHistory.map((ch, idx) => {
              const isUser = ch.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center space-x-1 text-indigo-600 dark:text-purple-400 mb-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[10px] tracking-wider uppercase">SpendWise AI</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{ch.content}</p>
                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="font-semibold text-[11px] ml-1">Analyzing snapshot...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQueryAssistant();
            }}
            className="flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask anything about expenses, EMIs, or loans..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ChatBotModal;
