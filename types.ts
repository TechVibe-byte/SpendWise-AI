
export const DefaultCategory = {
  FOOD: 'Food & Dining',
  TRANSPORT: 'Transportation',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  BILLS: 'Bills & Utilities',
  HEALTH: 'Health & Wellness',
  LOAN: 'Loan expenses',
  EMI: 'EMI expenses',
  BORROW: 'Borrow expenses',
  OTHER: 'Other'
} as const;

export type Category = string;

export interface CategoryItem {
  id: string;
  name: string;
  color: string; // Hex code
  isCustom: boolean;
}

export enum RecurringFrequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly'
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
  bankName?: string;
  recurringId?: string;
  receiptImage?: string; // Base64 data URL
}

export interface RecurringExpense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  frequency: RecurringFrequency;
  startDate: string;
  nextOccurrenceDate: string;
  isActive: boolean;
  bankName?: string;
}

export interface SpendingInsight {
  summary: string;
  suggestions: string[];
  savingTips: string[];
}
