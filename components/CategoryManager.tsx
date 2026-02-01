
import React, { useState } from 'react';
import { CategoryItem } from '../types';
import { getCategoryIcon } from '../constants';

interface CategoryManagerProps {
  categories: CategoryItem[];
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1'); // Default Indigo
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#6366f1');
    }
  };

  const categoryToDelete = categories.find(c => c.id === deleteConfirmId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Category</h2>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Pets, Gym, Subscriptions"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Color
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 h-[50px]">
              <input
                type="color"
                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
              />
              <span className="text-sm font-mono text-slate-500 dark:text-slate-400 uppercase w-16">{newCategoryColor}</span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all h-[50px]"
          >
            Create
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-2">Your Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                  {getCategoryIcon(cat.name)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{cat.name}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${cat.isCustom ? 'text-indigo-500' : 'text-slate-400'}`}>
                    {cat.isCustom ? 'Custom' : 'Default'}
                  </span>
                </div>
              </div>
              
              {cat.isCustom && (
                <button
                  onClick={() => setDeleteConfirmId(cat.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Category"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && categoryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Delete Category?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{categoryToDelete.name}</span>?
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    onDeleteCategory(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="w-full px-4 py-4 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg shadow-red-100 dark:shadow-none"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
