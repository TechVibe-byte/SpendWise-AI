import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearData = () => {
    localStorage.removeItem('spendwise-expenses');
    localStorage.removeItem('spendwise-recurring');
    localStorage.removeItem('spendwise-custom-categories');
    localStorage.removeItem('spendwise-onboarded');
    localStorage.removeItem('spendwise-theme');
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Data Management</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your local data. All expenses are stored in your browser's local storage.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full md:w-auto px-6 py-3 bg-white dark:bg-slate-800 text-red-500 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear All Data
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">
                Are you sure? This will delete all your expenses and cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800/50">
        <h3 className="text-lg font-bold text-indigo-900 dark:text-white mb-2">About SpendWise</h3>
        <p className="text-indigo-700 dark:text-indigo-300 text-sm leading-relaxed mb-4">
          SpendWise helps you track daily expenses efficiently.
          Your financial data stays on your device.
        </p>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Settings;