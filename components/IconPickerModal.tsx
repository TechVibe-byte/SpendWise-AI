import React, { useState, useMemo } from 'react';
import { CATEGORY_ICON_LIBRARY, IconPreset } from '../constants';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (emoji: string) => void;
  selectedIcon?: string;
}

const CATEGORY_GROUPS = [
  'All',
  'Pets',
  'Food & Dining',
  'Groceries',
  'Transport',
  'Housing',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Family',
  'Finance',
  'Misc'
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  selectedIcon
}) => {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const filteredIcons = useMemo(() => {
    return CATEGORY_ICON_LIBRARY.filter(item => {
      const matchesSearch = search.trim() === '' || 
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.categoryGroup.toLowerCase().includes(search.toLowerCase()) ||
        item.emoji.includes(search);
      
      const matchesGroup = activeGroup === 'All' || item.categoryGroup === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [search, activeGroup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[160] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>✨</span> Choose Category Symbol
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              100+ Icons & Symbols for your custom categories
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search & Group Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search icons (e.g. pet, dog, pizza, fuel, salary)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Group Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {CATEGORY_GROUPS.map(group => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  activeGroup === group
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-5 sm:grid-cols-6 gap-2.5">
          {filteredIcons.map((item, idx) => {
            const isSelected = selectedIcon === item.emoji;
            return (
              <button
                key={`${item.emoji}_${idx}`}
                type="button"
                onClick={() => {
                  onSelectIcon(item.emoji);
                  onClose();
                }}
                title={item.label}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all group relative cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/15 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 scale-105 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <span className="text-2xl transition-transform group-hover:scale-125 select-none">
                  {item.emoji}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center mt-1 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                  {item.label.split('/')[0].trim()}
                </span>
              </button>
            );
          })}

          {filteredIcons.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">
              <span className="text-3xl block mb-2">🔍</span>
              No matching symbols found for "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Showing {filteredIcons.length} of {CATEGORY_ICON_LIBRARY.length} symbols</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
