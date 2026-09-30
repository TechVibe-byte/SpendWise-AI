
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
  icon?: string; // Custom icon identifier or emoji
  isCustom: boolean;
}

export enum RecurringFrequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly'
}

export type PaymentType = 'bank' | 'credit_card' | 'credit_card_upi' | 'cash';
export type CreditCardExpenseType = 'credit_card' | 'credit_card_upi';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
  bankName?: string;
  paymentType?: PaymentType;
  creditCardType?: CreditCardExpenseType;
  recurringId?: string;
  receiptImage?: string; // Base64 data URL
  note?: string; // Used for tracking IDs or extra notes
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

export interface Income {
  id: string;
  amount: number;
  category: string; // 'Salary' | 'Bonus' | 'Variable Pay' | 'Incentive' | 'Reimbursement' | 'Freelance Income' | 'Investment Income' | 'Refund' | 'Gift Received' | 'Money Received' | 'Other Income'
  date: string;
  description: string;
  bankName: string; // SBI Salary Account, HDFC Savings, ICICI Savings, Cash, Wallet, UPI Account etc.
  isSalary?: boolean;
  employerName?: string;
  salaryMonth?: string; // e.g. "June 2026"
  bonus?: number;       // Annual Bonus/Performance Bonus
  receivedFrom?: 'Parents' | 'Spouse' | 'Friend' | 'Relative' | 'Personal Transfer' | 'Other';
  previousBalance?: number;
  currentBalance?: number;
}

export type BudgetRuleType = 'manual' | 'income_100' | 'income_percentage';

export type AccountCategory = 'Bank Account' | 'Credit Account' | 'Custom Account';

export type AccountType = 
  | 'savings' | 'salary' | 'current' | 'cash' | 'wallet' | 'upi' // Bank
  | 'credit_card' | 'upi_credit' | 'bnpl' | 'personal_credit' // Credit
  | 'custom'; // Custom

export interface Account {
  id: string;
  name: string; // Account unique name, e.g. "HDFC Salary Account"
  type: AccountType;
  category?: AccountCategory; // Will be optional for backward compatibility
  bankName: string; // e.g. "HDFC Bank", "SBI" or "Issuer Name"
  initialBalance: number; // Starting balance (0 for credit unless they have starting outstanding)
  color: string; // Color code or badge name
  
  // Credit Specific
  isCreditAccount?: boolean;
  creditLimit?: number;
  billingDate?: number; // 1-31
  dueDate?: number; // 1-31
  issuerName?: string;
  
  // Custom
  customTypeName?: string;
}

export interface Repayment {
  id: string;
  fromAccountId: string; // Usually Bank Account ID or Name
  toCreditAccountId: string; // Credit Account ID or Name
  amount: number;
  date: string;
  description: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string; // ID of the source account
  toAccountId: string; // ID of the destination account
  amount: number;
  date: string;
  description: string;
}

export interface SalaryRule {
  id: string;
  employer: string;
  amount: number;
  creditDate: number; // Day of month (1 to 31)
  accountName: string; // Name of receiving account
}

export interface TelegramBackupSettings {
  botToken: string;
  chatId: string;
  autoBackup: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  lastBackupTime?: string;
  nextBackupTime?: string;
  enabled: boolean;
  latestBackupFileId?: string;
}

export interface EMITrackerItem {
  id: string;
  title: string;
  lender: string;
  emiAmount: number;
  totalTenureMonths: number;
  paidTenureMonths: number;
  dueDayOfMonth: number;
  startDate: string;
  totalLoanAmount?: number;
  status: 'active' | 'completed';
  notes?: string;
}

export interface SalaryTrackerItem {
  id: string;
  month: string; // e.g. "September 2026"
  creditDate: string; // YYYY-MM-DD
  employerName: string;
  baseSalary: number;
  bonus?: number;
  deductions?: number;
  netCredited: number;
  paymentMethod?: string;
  status: 'credited' | 'pending';
  payslipSnippet?: string; // Base64
  notes?: string;
}

export interface BorrowMoneyItem {
  id: string;
  lenderName: string; // Person / relative / friend I borrowed from
  relationship?: string;
  amount: number;
  borrowDate: string;
  repaymentDueDate?: string;
  repaidAmount: number;
  status: 'pending' | 'partially_repaid' | 'settled';
  snippetImage?: string; // Base64 image
  notes?: string;
}

export interface LendMoneyItem {
  id: string;
  borrowerName: string; // Friend or relative given money to
  relationship: 'Friend' | 'Relative' | 'Colleague' | 'Family' | 'Other';
  amount: number;
  dateGiven: string;
  promisedReturnDate?: string;
  returnedAmount: number;
  status: 'pending' | 'partially_returned' | 'returned';
  snippetImage?: string; // Snippet / transfer screenshot Base64
  phone?: string;
  notes?: string;
}

export interface AISettings {
  provider: 'gemini' | 'openrouter';
  geminiApiKey: string;
  openRouterApiKey: string;
  openRouterModel: string;
}

export type SplitType = 'equal' | 'exact' | 'percentage';

export interface SplitParticipant {
  id: string;
  name: string;
  shareAmount: number;
  paidAmount?: number;
  percentage?: number;
  settled?: boolean;
}

export interface SplitBillItem {
  id: string;
  title: string;
  totalAmount: number;
  date: string;
  paidBy: string; // e.g. "You" or a friend's name
  splitType: SplitType;
  participants: SplitParticipant[];
  notes?: string;
  category?: string;
  createdAt: string;
}
