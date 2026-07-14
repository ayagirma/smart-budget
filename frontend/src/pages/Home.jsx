import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

const Home = () => {
  const { categories, transactions, bills, user, token, updateUser, bankAccounts } = useApp();
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const budgetRule = user?.budgetRule || '50-30-20';
  const monthlyIncome = user?.monthlyIncome || 0;

  // Initialize with helper function to find default month/year from transactions
  const getDefaultMonthAndYear = () => {
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();
    
    if (!transactions || transactions.length === 0) {
      return { month: currentM.toString(), year: currentY.toString() };
    }
    
    const hasCurrent = transactions.some(t => {
      const d = new Date(t.date);
      return (d.getUTCMonth() + 1) === currentM && d.getUTCFullYear() === currentY;
    });
    
    if (hasCurrent) {
      return { month: currentM.toString(), year: currentY.toString() };
    }
    
    // Sort transactions by date descending to find the latest
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestDate = new Date(sorted[0].date);
    return {
      month: (latestDate.getUTCMonth() + 1).toString(),
      year: latestDate.getUTCFullYear().toString()
    };
  };

  const defaults = getDefaultMonthAndYear();
  const [selectedMonth, setSelectedMonth] = useState(defaults.month);
  const [selectedYear, setSelectedYear] = useState(defaults.year);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (transactions.length > 0 && !hasChanged) {
      const now = new Date();
      const currentM = now.getMonth() + 1;
      const currentY = now.getFullYear();
      
      const hasCurrent = transactions.some(t => {
        const d = new Date(t.date);
        return (d.getUTCMonth() + 1) === currentM && d.getUTCFullYear() === currentY;
      });
      
      if (!hasCurrent) {
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestDate = new Date(sorted[0].date);
        setSelectedMonth((latestDate.getUTCMonth() + 1).toString());
        setSelectedYear(latestDate.getUTCFullYear().toString());
      }
      setHasChanged(true);
    }
  }, [transactions, hasChanged]);

  const months = [
    { value: '1', name: 'January' },
    { value: '2', name: 'February' },
    { value: '3', name: 'March' },
    { value: '4', name: 'April' },
    { value: '5', name: 'May' },
    { value: '6', name: 'June' },
    { value: '7', name: 'July' },
    { value: '8', name: 'August' },
    { value: '9', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (!transactions || transactions.length === 0) {
      return [currentYear.toString()];
    }
    
    const yearsSet = new Set();
    yearsSet.add(currentYear);
    
    transactions.forEach(t => {
      if (t.date) {
        const d = new Date(t.date);
        const y = d.getUTCFullYear();
        if (!isNaN(y)) {
          yearsSet.add(y);
        }
      }
    });
    
    return Array.from(yearsSet).sort((a, b) => a - b).map(y => y.toString());
  }, [transactions]);

  // Filter selected month transactions
  const selectedMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return (d.getUTCMonth() + 1) === Number(selectedMonth) && d.getUTCFullYear() === Number(selectedYear);
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate expenses dynamically to check for budget depletion
  const totalIncome = useMemo(() => {
    return selectedMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  }, [selectedMonthTransactions]);

  const totalExpense = useMemo(() => {
    return selectedMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  }, [selectedMonthTransactions]);

  // Overall total balance (cumulative all-time net worth)
  const balance = useMemo(() => {
    const overallIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const overallExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    return overallIncome - overallExpense;
  }, [transactions]);

  const bankExpenses = useMemo(() => {
    const groups = {};
    selectedMonthTransactions.forEach(t => {
      if (t.type === 'expense') {
        const bank = t.institution_name || 'Manual';
        groups[bank] = (groups[bank] || 0) + Number(t.amount);
      }
    });
    return Object.keys(groups).map(bank => ({
      bank,
      amount: groups[bank]
    })).sort((a, b) => b.amount - a.amount);
  }, [selectedMonthTransactions]);

  const computedBankBalances = useMemo(() => {
    if (bankAccounts && bankAccounts.length > 0) {
      return bankAccounts
        .filter(acc => {
          const nameLower = (acc.name || '').toLowerCase();
          const subtypeLower = (acc.subtype || '').toLowerCase();
          return nameLower.includes('checking') || subtypeLower === 'checking';
        })
        .map(acc => ({
          name: acc.name,
          institutionName: acc.institutionName,
          balance: acc.balance
        }));
    }
    
    // Fallback: calculate balance from transaction history
    const balances = {};
    transactions.forEach(t => {
      const bank = t.institution_name || 'Manual';
      const amount = Number(t.amount);
      if (t.type === 'income') {
        balances[bank] = (balances[bank] || 0) + amount;
      } else {
        balances[bank] = (balances[bank] || 0) - amount;
      }
    });
    return Object.keys(balances).map(bank => ({
      name: 'Checking',
      institutionName: bank,
      balance: balances[bank]
    }));
  }, [bankAccounts, transactions]);

  let needsGoalPct = 0.5;
  let wantsGoalPct = 0.3;
  let savingsGoalPct = 0.2;
  
  if (budgetRule === '40-20-40') {
    needsGoalPct = 0.4;
    wantsGoalPct = 0.2;
    savingsGoalPct = 0.4;
  }
  
  const needsLimit = monthlyIncome * needsGoalPct;

  useEffect(() => {
    if (budgetRule === '50-30-20' || budgetRule === '40-20-40') {
      const hasSeenWarning = sessionStorage.getItem('hasSeenBudgetWarning');
      if (totalExpense >= needsLimit && !hasSeenWarning && needsLimit > 0) {
        setShowBudgetWarning(true);
      }
    }
  }, [totalExpense, needsLimit, budgetRule]);

  const dismissWarning = () => {
    setShowBudgetWarning(false);
    sessionStorage.setItem('hasSeenBudgetWarning', 'true');
  };
  
  const toggleBudgetRule = async () => {
    let newRule = '50-30-20';
    if (budgetRule === '50-30-20') {
      newRule = '40-20-40';
    } else if (budgetRule === '40-20-40') {
      newRule = 'custom';
    }
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put('http://localhost:5000/api/users/onboarding', {
        monthlyIncome,
        budgetRule: newRule
      }, config);
      updateUser({ budgetRule: newRule });
    } catch (err) {
      console.error('Error toggling budget rule', err);
    }
  };

  const needsTotal = useMemo(() => {
    return selectedMonthTransactions
      .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'need')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [selectedMonthTransactions, categories]);
    
  const wantsTotal = useMemo(() => {
    return selectedMonthTransactions
      .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'want')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [selectedMonthTransactions, categories]);
    
  const savingsTotal = useMemo(() => {
    return selectedMonthTransactions
      .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'saving')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [selectedMonthTransactions, categories]);
    
  const needsPercent = monthlyIncome > 0 ? (needsTotal / monthlyIncome) * 100 : 0;
  const wantsPercent = monthlyIncome > 0 ? (wantsTotal / monthlyIncome) * 100 : 0;
  const savingsPercent = monthlyIncome > 0 ? (savingsTotal / monthlyIncome) * 100 : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueBills = bills.filter(b => !b.is_paid && new Date(b.due_date) < today);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Welcome, {localStorage.getItem('firstName') || 'User'}!</h1>
          <p>Here's an overview of your finances.</p>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Mode: <strong>{budgetRule === '50-30-20' ? '50/30/20 Rule Active' : budgetRule === '40-20-40' ? '40/20/40 Rule Active' : 'Custom Budget Active'}</strong>
            </span>
            <button 
              onClick={toggleBudgetRule}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Toggle
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '0.4rem 1.5rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
          </select>
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '0.4rem 1.5rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {overdueBills.length > 0 && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle color="var(--danger)" size={24} />
          <div>
            <h4 style={{ color: 'var(--danger)', margin: 0 }}>Warning: Overdue Bills!</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>You have {overdueBills.length} scheduled bill(s) that are past their due date.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card flex items-center gap-4">
          <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent)' }}>
            <Wallet size={32} />
          </div>
          <div>
            <p className="form-label">Total Balance</p>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>${balance.toFixed(2)}</h2>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
            <ArrowUpRight size={32} />
          </div>
          <div>
            <p className="form-label">Total Income</p>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>${totalIncome.toFixed(2)}</h2>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
            <ArrowDownRight size={32} />
          </div>
          <div>
            <p className="form-label">Total Expenses</p>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>${totalExpense.toFixed(2)}</h2>
          </div>
        </div>
      </div>

      {/* Smart Analysis & Bank Balances Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Smart Analysis Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Smart Analysis: Needs vs Wants</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Based on your {budgetRule === 'custom' ? 'budget' : budgetRule === '40-20-40' ? '40/20/40 goals' : '50/30/20 goals'}, here is how your expenses are classified:
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Needs ({needsGoalPct * 100}%)</strong>
              <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--success)' }}>{needsPercent.toFixed(1)}%</div>
              <div style={{ fontSize: '0.725rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Spent: ${needsTotal.toFixed(2)} / ${needsLimit.toFixed(2)}</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f59e0b' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Wants ({wantsGoalPct * 100}%)</strong>
              <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#f59e0b' }}>{wantsPercent.toFixed(1)}%</div>
              <div style={{ fontSize: '0.725rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Spent: ${wantsTotal.toFixed(2)} / ${(monthlyIncome * wantsGoalPct).toFixed(2)}</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #3b82f6' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Savings ({savingsGoalPct * 100}%)</strong>
              <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#3b82f6' }}>{savingsPercent.toFixed(1)}%</div>
              <div style={{ fontSize: '0.725rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Spent: ${savingsTotal.toFixed(2)} / ${(monthlyIncome * savingsGoalPct).toFixed(2)}</div>
            </div>
          </div>

          {/* Recommendation Engine */}
          <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginTop: 'auto' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Recommendation:</strong>
            {needsPercent > (needsGoalPct * 100) ? (
              <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.825rem', lineHeight: '1.4' }}>
                Your "Needs" are exceeding {needsGoalPct * 100}% of your income. Since needs are essential, you should drastically cut back on your "Wants" (currently {wantsPercent.toFixed(1)}%) to ensure you can still build your Emergency Fund and Savings.
              </p>
            ) : wantsPercent > (wantsGoalPct * 100) ? (
              <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.825rem', lineHeight: '1.4' }}>
                You are overspending on "Wants". Consider reducing discretionary spending to improve your saving rate.
              </p>
            ) : savingsPercent < (savingsGoalPct * 100) && (needsPercent + wantsPercent) > 0 ? (
              <p style={{ margin: 0, color: 'var(--accent)', fontSize: '0.825rem', lineHeight: '1.4' }}>
                You haven't hit your {savingsGoalPct * 100}% savings goal yet. Try to allocate the remaining balance towards your emergency fund!
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.825rem', lineHeight: '1.4' }}>
                Great job! Your spending is well-balanced and you are on track with your saving goals.
              </p>
            )}
          </div>
        </div>

        {/* Bank accounts & expenses dashboard */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem', color: 'var(--primary)' }}>My Connected Banks</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Real-time balance of your linked bank accounts.
            </p>
            {computedBankBalances.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>No bank accounts connected yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {computedBankBalances.map((acc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.875rem' }}>{acc.institutionName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{acc.name}</span>
                    </div>
                    <strong style={{ fontSize: '1rem', color: acc.balance >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}>
                      ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
            <h3 style={{ marginBottom: '0.25rem', color: 'var(--primary)' }}>Monthly Expenses by Bank</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              How much you spent from each bank this month.
            </p>
            {bankExpenses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>No expenses recorded this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bankExpenses.map((be, idx) => {
                  const percent = totalExpense > 0 ? (be.amount / totalExpense) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.825rem' }}>
                        <span><strong>{be.bank}</strong></span>
                        <span style={{ color: 'var(--text-secondary)' }}>${be.amount.toFixed(2)} ({percent.toFixed(1)}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: idx % 3 === 0 ? 'var(--danger)' : idx % 3 === 1 ? 'var(--accent)' : 'var(--success)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBudgetWarning && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ padding: '1.5rem', width: '95%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', borderTop: '4px solid var(--danger)' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>
              <AlertTriangle size={32} />
              <h2 style={{ margin: 0 }}>Budget Warning!</h2>
            </div>
            
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              Your total expenses (<strong>${totalExpense.toFixed(2)}</strong>) have reached or exceeded {needsGoalPct * 100}% of your estimated monthly income (<strong>${needsLimit.toFixed(2)}</strong>).
            </p>

            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Needs vs Wants: A Philosophical Guide</h4>
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                It can be hard to separate Needs from Wants on a personal level. Here is how most households define them:
              </p>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Needs ({needsGoalPct * 100}%):</strong> The essentials for basic survival. These include <em>Rent/Mortgage, Groceries, Utilities, Basic Transportation, and Minimum Debt Payments.</em> If you lost your job today, you would still need to pay these.
                </li>
                <li>
                  <strong>Wants ({wantsGoalPct * 100}%):</strong> The "extras" that make life enjoyable but aren't strictly necessary. These include <em>Dining Out, Entertainment, Subscriptions, Vacations, and Hobbies.</em>
                </li>
              </ul>
              <p style={{ fontSize: '0.95rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                <strong>Tip:</strong> If your expenses are hitting this {needsGoalPct * 100}% mark fast, double-check that you aren't categorizing "Wants" as "Needs". Consider cutting back on Wants to ensure you can still hit your <strong>{savingsGoalPct * 100}% Savings</strong> goal!
              </p>
            </div>

            <button 
              onClick={dismissWarning}
              className="btn btn-primary w-full" 
              style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '1rem' }}
            >
              I Understand, Dismiss
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Home;
