
import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'removed'>('idle');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setStatus('removed');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Configuration</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Configure your Google Gemini API key to enable smart categorization and financial insights.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={isVisible ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API Key"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {isVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Don't have a key?</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center"
              >
                Get one from Google AI Studio
                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Save Key
            </button>
            
            {localStorage.getItem('gemini_api_key') && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-6 py-3 bg-white dark:bg-slate-800 text-red-500 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                Remove Key
              </button>
            )}
          </div>

          {status === 'saved' && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              API Key saved successfully! AI features are now enabled.
            </div>
          )}
          
          {status === 'removed' && (
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              API Key removed. AI features are disabled.
            </div>
          )}
        </form>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800/50">
        <h3 className="text-lg font-bold text-indigo-900 dark:text-white mb-2">Privacy Note</h3>
        <p className="text-indigo-700 dark:text-indigo-300 text-sm leading-relaxed">
          Your API key is stored locally in your browser's storage (`localStorage`) and is never sent to any server other than Google's Gemini API directly for processing your requests. 
        </p>
      </div>
    </div>
  );
};

export default Settings;
