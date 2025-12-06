import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X, Terminal, DollarSign, Heart, FileText } from 'lucide-react';
import { Tab, Expense, PrayerDay, PRAYER_NAMES, PrayerName, EXPENSE_CATEGORIES, Account, ACCOUNT_ICONS } from './types';
import { ExpenseCharts } from './components/ExpenseCharts';
import { PrayerHeatmap } from './components/PrayerHeatmap';

// --- Local Storage Helper ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error); return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);
  return [storedValue, setStoredValue];
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const Modal: React.FC<{ title: string; isOpen: boolean; onClose: () => void; children: React.ReactNode; }> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#24283b] border border-[#414868] w-full max-w-sm rounded-lg shadow-xl animate-fade-in">
        <header className="flex items-center justify-between p-3 border-b border-[#414868]">
          <p className="font-mono text-sm text-[#7aa2f7]">
            <span className="text-[#9ece6a]">~</span>/{title}
          </p>
          <button onClick={onClose} className="p-1 rounded-full text-[#c0caf5] hover:bg-[#414868] transition-colors">
            <X size={16} />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('lb_expenses_v2', []);
  const [prayerHistory, setPrayerHistory] = useLocalStorage<PrayerDay[]>('lb_prayers_v2', []);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('lb_accounts_v2', []);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountIcon, setAccountIcon] = useState(ACCOUNT_ICONS[0]);
  
  const [adjustingAccountId, setAdjustingAccountId] = useState<string | null>(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');

  useEffect(() => {
    if (accounts.length === 0) {
      setAccounts([{ id: `acc-${Date.now()}`, name: 'Cash', balance: 0, icon: '💵' }]);
    }
  }, [accounts, setAccounts]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const todaysPrayers = useMemo(() => {
    const todayStr = getTodayDateString();
    return prayerHistory.find(p => p.date === todayStr) || { date: todayStr, completed: [] };
  }, [prayerHistory]);

  const handleTogglePrayer = (prayerName: PrayerName) => {
    setPrayerHistory(prev => {
      const todayStr = getTodayDateString();
      const historyCopy = [...prev];
      let todayRecord = historyCopy.find(p => p.date === todayStr);
      if (todayRecord) {
        todayRecord.completed = todayRecord.completed.includes(prayerName)
          ? todayRecord.completed.filter(p => p !== prayerName)
          : [...todayRecord.completed, prayerName];
      } else {
        historyCopy.push({ date: todayStr, completed: [prayerName] });
      }
      return historyCopy;
    });
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseAmount('');
    setExpenseCategory(EXPENSE_CATEGORIES[0]);
    setExpenseDescription('');
    setSelectedAccountId(accounts[0]?.id || null);
    setIsExpenseModalOpen(true);
  };
  
  const openEditExpenseModal = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseAmount(String(expense.amount));
    setExpenseCategory(expense.category);
    setExpenseDescription(expense.description);
    setSelectedAccountId(expense.accountId);
    setIsExpenseModalOpen(true);
  };

  const openAddBalanceModal = (accountId: string) => {
    setAdjustingAccountId(accountId);
    setAddBalanceAmount('');
    setIsAddBalanceModalOpen(true);
  };

  const handleAddOrUpdateExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0 || !selectedAccountId) return;

    if (editingExpense) {
      const originalAmount = editingExpense.amount;
      setAccounts(current => current.map(acc => {
        if (acc.id === editingExpense.accountId) acc.balance += originalAmount;
        if (acc.id === selectedAccountId) acc.balance -= amount;
        return acc;
      }));
      setExpenses(current => current.map(e => e.id === editingExpense.id
        ? { ...e, amount, category: expenseCategory, description: expenseDescription, accountId: selectedAccountId } : e
      ));
    } else {
      const newExpense: Expense = {
        id: `exp-${Date.now()}`, amount, category: expenseCategory, description: expenseDescription,
        date: getTodayDateString(), timestamp: Date.now(), accountId: selectedAccountId,
      };
      setExpenses(prev => [newExpense, ...prev].sort((a,b) => b.timestamp - a.timestamp));
      setAccounts(prev => prev.map(acc => acc.id === selectedAccountId ? { ...acc, balance: acc.balance - amount } : acc));
    }
    setIsExpenseModalOpen(false);
  };
  
  const handleDeleteExpense = (expense: Expense) => {
    setAccounts(prev => prev.map(acc => acc.id === expense.accountId ? { ...acc, balance: acc.balance + expense.amount } : acc));
    setExpenses(prev => prev.filter(e => e.id !== expense.id));
  };
  
  const handleAddAccount = () => {
    if (!accountName) return;
    const newAccount: Account = {
      id: `acc-${Date.now()}`, name: accountName, balance: parseFloat(initialBalance) || 0, icon: accountIcon
    };
    setAccounts(prev => [...prev, newAccount]);
    setAccountName(''); setInitialBalance(''); setAccountIcon(ACCOUNT_ICONS[0]);
    setIsAccountModalOpen(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (expenses.some(e => e.accountId === accountId)) {
      alert("Error: Cannot delete account with associated expenses."); return;
    }
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  const handleAddBalance = () => {
    const amount = parseFloat(addBalanceAmount);
    if(isNaN(amount) || amount <= 0 || !adjustingAccountId) return;
    setAccounts(prev => prev.map(acc => acc.id === adjustingAccountId ? {...acc, balance: acc.balance + amount} : acc));
    setIsAddBalanceModalOpen(false);
  };

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  const todaysTotalExpenses = useMemo(() => {
    const todayStr = getTodayDateString();
    return expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);
  
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'N/A';

  const renderContent = () => {
    const panelClass = "bg-[#1e1e1e]/50 border border-gray-700/50 rounded-lg p-4";
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={panelClass}>
                <p className="font-mono text-xs text-blue-300">Total Balance</p>
                <p className="text-2xl font-bold text-green-400 font-mono">৳{totalBalance.toFixed(2)}</p>
              </div>
              <div className={panelClass}>
                <p className="font-mono text-xs text-blue-300">Today's Expenses</p>
                <p className="text-2xl font-bold text-red-400 font-mono">৳{todaysTotalExpenses.toFixed(2)}</p>
              </div>
            </div>
            <ExpenseCharts expenses={expenses} />
          </div>
        );
      case 'expenses':
        return (
          <div className={`${panelClass} font-mono text-sm`}>
             <h2 className="text-blue-300 mb-3"><span className="text-green-400">$</span> ls -l /transactions</h2>
            {expenses.length === 0 ? <p className="text-gray-500">No transactions found.</p> : (
              <div className="space-y-1">
                {expenses.map(exp => (
                  <div key={exp.id} onClick={() => openEditExpenseModal(exp)} className="flex items-center justify-between p-2 rounded hover:bg-blue-500/10 cursor-pointer">
                    <div className="flex-1">
                      <span className="text-purple-300">{exp.category}</span>
                      <p className="text-xs text-gray-400">{getAccountName(exp.accountId)} on {new Date(exp.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className="text-red-400 w-24 text-right">-৳{exp.amount.toFixed(2)}</span>
                    <button onClick={e => { e.stopPropagation(); handleDeleteExpense(exp); }} className="ml-2 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'prayers':
        return (
          <div className="space-y-4">
            <div className={panelClass}>
              <h3 className="font-mono text-sm font-semibold text-blue-300 mb-4"><span className="text-green-400">$</span> check_prayers --today</h3>
              <div className="space-y-2">
                {PRAYER_NAMES.map(name => (
                  <div key={name} onClick={() => handleTogglePrayer(name)} className="flex items-center justify-between p-3 rounded bg-gray-800/50 cursor-pointer">
                    <span className="font-mono text-purple-300">{name}</span>
                    <span className="font-mono text-lg">{todaysPrayers.completed.includes(name) ? 
                      <span className="text-green-400">[x]</span> : 
                      <span className="text-gray-500">[ ]</span>
                    }</span>
                  </div>
                ))}
              </div>
            </div>
            <PrayerHeatmap history={prayerHistory} />
          </div>
        );
       case 'accounts':
        return (
          <div className={panelClass}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-blue-300 font-mono"><span className="text-green-400">$</span> ls /accounts</h2>
              <button onClick={() => setIsAccountModalOpen(true)} className="font-mono text-xs bg-green-400/20 text-green-300 py-1 px-3 rounded flex items-center gap-1">
                <Plus size={14} /> add_account
              </button>
            </div>
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-3 p-2 rounded hover:bg-blue-500/10">
                <div className="text-2xl">{acc.icon}</div>
                <div className="flex-grow">
                  <p className="font-semibold text-sm text-purple-300 font-mono">{acc.name}</p>
                  <p className="font-bold text-gray-300 font-mono">৳{acc.balance.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => openAddBalanceModal(acc.id)} className="text-green-400 hover:text-green-300 p-1 font-mono text-xs">[+balance]</button>
                  <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };
  
  const renderInput = (props) => <input {...props} className={`w-full p-3 bg-[#2c2f3b] border border-[#414868] rounded text-[#c0caf5] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${props.className}`} />;
  // Fix: Changed renderSelect to accept children as a second argument to match its usage.
  const renderSelect = (props, children) => <select {...props} className={`w-full p-3 bg-[#2c2f3b] border border-[#414868] rounded text-[#c0caf5] focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${props.className}`}>{children}</select>;
  // Fix: Changed renderButton signature to accept props and children separately, matching its usage.
  const renderButton = (props, children) => {
    const { onClick, variant = 'primary', ...rest } = props;
    const styles = {
      primary: 'bg-[#7aa2f7] text-[#1a1b26] hover:bg-blue-300',
      secondary: 'bg-[#414868] text-[#c0caf5] hover:bg-gray-600',
      success: 'bg-[#9ece6a] text-[#1a1b26] hover:bg-green-300'
    };
    return <button onClick={onClick} className={`w-full p-3 rounded font-bold transition-colors ${styles[variant]}`} {...rest}>{children}</button>
  }

  return (
    <div className="h-screen w-screen bg-[#1a1b26] flex flex-col no-scrollbar">
      <header className="bg-[#1e1e1e]/80 backdrop-blur-sm p-3 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-200 font-mono">LifeBalance OS</h1>
        <div className="flex items-center gap-2">
          {[{ tab: 'dashboard', icon: Terminal }, { tab: 'expenses', icon: DollarSign },
           { tab: 'prayers', icon: Heart }, { tab: 'accounts', icon: FileText }
          ].map(({ tab, icon: Icon }) => (
            <button key={tab} onClick={() => setActiveTab(tab as Tab)}
              className={`p-2 rounded transition-colors ${activeTab === tab ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700/50'}`}>
              <Icon size={18} />
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto no-scrollbar">
        {renderContent()}
      </main>

      {/* --- MODALS --- */}
      <Modal title="add_expense" isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
        <div className="space-y-3">
          {renderInput({ type: "number", placeholder: "Amount (৳)", value: expenseAmount, onChange: e => setExpenseAmount(e.target.value) })}
          {renderSelect({ value: expenseCategory, onChange: e => setExpenseCategory(e.target.value) },
            EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
          )}
          {renderSelect({ value: selectedAccountId || '', onChange: e => setSelectedAccountId(e.target.value) },
            accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.icon})</option>)
          )}
          {renderInput({ type: "text", placeholder: "Note (optional)", value: expenseDescription, onChange: e => setExpenseDescription(e.target.value) })}
          {renderButton({ onClick: handleAddOrUpdateExpense }, editingExpense ? 'Save Changes' : 'Execute')}
        </div>
      </Modal>

      <Modal title="add_account" isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)}>
        <div className="space-y-3">
          {renderInput({ type: "text", placeholder: "Account Name (e.g., Bank)", value: accountName, onChange: e => setAccountName(e.target.value) })}
          {renderInput({ type: "number", placeholder: "Initial Balance (optional)", value: initialBalance, onChange: e => setInitialBalance(e.target.value) })}
          <div className="flex justify-around bg-[#2c2f3b] p-2 rounded border border-[#414868]">
            {ACCOUNT_ICONS.map(icon => <button key={icon} onClick={() => setAccountIcon(icon)} className={`p-2 text-2xl rounded-md ${accountIcon === icon ? 'bg-blue-500/30' : ''}`}>{icon}</button>)}
          </div>
          <div className="flex gap-2">
            {renderButton({ onClick: () => setIsAccountModalOpen(false), variant: 'secondary'}, 'Cancel')}
            {renderButton({ onClick: handleAddAccount }, 'Create')}
          </div>
        </div>
      </Modal>

      <Modal title="add_balance" isOpen={isAddBalanceModalOpen} onClose={() => setIsAddBalanceModalOpen(false)}>
        <div className="space-y-3">
            <h3 className="text-center font-mono text-purple-300">{accounts.find(a=>a.id === adjustingAccountId)?.name}</h3>
            {renderInput({ type: "number", placeholder: "Amount to Add (৳)", value: addBalanceAmount, onChange: e => setAddBalanceAmount(e.target.value) })}
            <div className="flex gap-2">
              {renderButton({ onClick: () => setIsAddBalanceModalOpen(false), variant: 'secondary'}, 'Cancel')}
              {renderButton({ onClick: handleAddBalance, variant: 'success'}, 'Add Funds')}
            </div>
        </div>
      </Modal>
      
      <style jsx global>{`
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}