import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

const Home = () => {
  const { categories, transactions, bills, user, token, updateUser } = useApp();
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const budgetRule = user?.budgetRule || '50-30-20';
  const monthlyIncome = user?.monthlyIncome || 0;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filter current month transactions
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return (d.getUTCMonth() + 1) === currentMonth && d.getUTCFullYear() === currentYear;
  });

  // Calculate expenses dynamically to check for budget depletion
  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

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

  const needsTotal = currentMonthTransactions
    .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'need')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const wantsTotal = currentMonthTransactions
    .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'want')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const savingsTotal = currentMonthTransactions
    .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'saving')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const needsPercent = monthlyIncome > 0 ? (needsTotal / monthlyIncome) * 100 : 0;
  const wantsPercent = monthlyIncome > 0 ? (wantsTotal / monthlyIncome) * 100 : 0;
  const savingsPercent = monthlyIncome > 0 ? (savingsTotal / monthlyIncome) * 100 : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueBills = bills.filter(b => !b.is_paid && new Date(b.due_date) < today);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
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

      {/* Smart Analysis Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Smart Analysis: Needs vs Wants</h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Based on your {budgetRule === 'custom' ? 'budget' : budgetRule === '40-20-40' ? '40/20/40 goals' : '50/30/20 goals'}, here is how your expenses are classified:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
            <strong>Needs (Goal: {needsGoalPct * 100}% - ${needsLimit.toFixed(2)})</strong>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{needsPercent.toFixed(1)}%</div>
            <div style={{ fontSize: '0.875rem' }}>Spent: ${needsTotal.toFixed(2)} of ${needsLimit.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f59e0b' }}>
            <strong>Wants (Goal: {wantsGoalPct * 100}% - ${(monthlyIncome * wantsGoalPct).toFixed(2)})</strong>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{wantsPercent.toFixed(1)}%</div>
            <div style={{ fontSize: '0.875rem' }}>Spent: ${wantsTotal.toFixed(2)} of ${(monthlyIncome * wantsGoalPct).toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #3b82f6' }}>
            <strong>Savings (Goal: {savingsGoalPct * 100}% - ${(monthlyIncome * savingsGoalPct).toFixed(2)})</strong>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{savingsPercent.toFixed(1)}%</div>
            <div style={{ fontSize: '0.875rem' }}>Spent: ${savingsTotal.toFixed(2)} of ${(monthlyIncome * savingsGoalPct).toFixed(2)}</div>
          </div>
        </div>

        {/* Recommendation Engine */}
        <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Recommendation:</strong>
          {needsPercent > (needsGoalPct * 100) ? (
            <p style={{ margin: 0, color: 'var(--danger)' }}>
              Your "Needs" are exceeding {needsGoalPct * 100}% of your income. Since needs are essential, you should drastically cut back on your "Wants" (currently {wantsPercent.toFixed(1)}%) to ensure you can still build your Emergency Fund and Savings.
            </p>
          ) : wantsPercent > (wantsGoalPct * 100) ? (
            <p style={{ margin: 0, color: 'var(--danger)' }}>
              You are overspending on "Wants". Consider reducing discretionary spending to improve your saving rate.
            </p>
          ) : savingsPercent < (savingsGoalPct * 100) && (needsPercent + wantsPercent) > 0 ? (
            <p style={{ margin: 0, color: 'var(--accent)' }}>
              You haven't hit your {savingsGoalPct * 100}% savings goal yet. Try to allocate the remaining balance towards your emergency fund!
            </p>
          ) : (
            <p style={{ margin: 0, color: 'var(--success)' }}>
              Great job! Your spending is well-balanced and you are on track with your saving goals.
            </p>
          )}
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
