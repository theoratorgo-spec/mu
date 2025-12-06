export type Tab = 'dashboard' | 'expenses' | 'prayers' | 'accounts';

export interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string; // For a simple emoji or icon name
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  accountId: string;
}

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerDay {
  date: string; // ISO date string YYYY-MM-DD
  completed: PrayerName[]; // List of completed prayers
}

export interface AppState {
  expenses: Expense[];
  prayerHistory: PrayerDay[];
}

// Fix: Add AIInsightData interface, which was missing.
export interface AIInsightData {
  financialAdvice: string[];
  spiritualEncouragement: string[];
  summary: string;
}

export const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Charity',
  'Other'
];

export const ACCOUNT_ICONS = ['🏦', '💳', '💵', '📱', '🎁'];