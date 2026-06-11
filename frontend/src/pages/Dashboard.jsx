import { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionList from '../components/TransactionList';
import ChartsPanel from '../components/ChartsPanel';
import BillsCalendar from '../components/BillsCalendar';
import { PieChart, Wallet, ArrowUpRight, ArrowDownRight, Plus, AlertTriangle, CalendarPlus, Trash2, RefreshCw } from 'lucide-react';
import PlaidLinkButton from '../components/PlaidLinkButton';
import CsvUpload from '../components/CsvUpload';

const Dashboard = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const [editingBudget, setEditingBudget] = useState({ category_id: '', amount: '' });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newBill, setNewBill] = useState({ title: '', amount: '', due_date: '' });
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryClassification, setNewCategoryClassification] = useState('want');
  const [budgetRule, setBudgetRule] = useState(localStorage.getItem('budgetRule') || '50-30-20');

  // Calculate expenses dynamically to check for budget depletion
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const monthlyIncome = Number(localStorage.getItem('monthlyIncome') || 0);
  const needsLimit = monthlyIncome * 0.5;

  // Budget Depletion Effect: Checks if total expenses exceed the 50% "Needs" limit
  useEffect(() => {
    if (!loading && budgetRule === '50-30-20') {
      const hasSeenWarning = sessionStorage.getItem('hasSeenBudgetWarning');
      // If the 50% limit is reached/exceeded and user hasn't seen the warning this session
      if (totalExpense >= needsLimit && !hasSeenWarning && needsLimit > 0) {
        setShowBudgetWarning(true);
      }
    }
  }, [totalExpense, needsLimit, budgetRule, loading]);

  const dismissWarning = () => {
    setShowBudgetWarning(false);
    sessionStorage.setItem('hasSeenBudgetWarning', 'true');
  };
  
  const toggleBudgetRule = async () => {
    const newRule = budgetRule === '50-30-20' ? 'custom' : '50-30-20';
    setBudgetRule(newRule);
    localStorage.setItem('budgetRule', newRule);
    
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put('http://localhost:5000/api/users/onboarding', {
        monthlyIncome: Number(localStorage.getItem('monthlyIncome') || 0),
        budgetRule: newRule
      }, config);
    } catch (err) {
      console.error('Error toggling budget rule', err);
    }
  };

  const handleSyncPlaid = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:5000/api/plaid/sync', {}, config);
      fetchDashboardData();
      alert('Transactions synced successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to sync transactions or no account linked.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      // For simplicity, we just fetch transactions and categories.
      // Assuming backend has these endpoints based on server.js routes.
      const [catRes, transRes, budgetRes, billRes] = await Promise.all([
        axios.get('http://localhost:5000/api/categories', config),
        axios.get('http://localhost:5000/api/transactions', config),
        axios.get('http://localhost:5000/api/budgets', config),
        axios.get('http://localhost:5000/api/bills', config)
      ]);
      
      setCategories(catRes.data);
      setTransactions(transRes.data);
      setBudgets(budgetRes.data);
      setBills(billRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openAddModal = () => {
    setEditingTransaction(null);
    setNewTransaction({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
    setNewCategoryName('');
    setNewCategoryClassification('want');
    setShowAddTransaction(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      await axios.post('http://localhost:5000/api/budgets', {
        category_id: editingBudget.category_id,
        amount: Number(editingBudget.amount),
        month: currentMonth,
        year: currentYear
      }, config);
      
      setShowBudgetModal(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error saving budget limit');
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:5000/api/bills', {
        title: newBill.title,
        amount: Number(newBill.amount),
        due_date: newBill.due_date
      }, config);
      setShowAddBillModal(false);
      setNewBill({ title: '', amount: '', due_date: '' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error scheduling bill');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom category?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`http://localhost:5000/api/categories/${id}`, config);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error deleting category.');
    }
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category_id || '',
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setNewCategoryName('');
    setNewCategoryClassification('want');
    setShowAddTransaction(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error deleting transaction');
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      let categoryId = newTransaction.category;

      // If user chose to create a new category
      if (categoryId === 'new_category') {
        const catRes = await axios.post('http://localhost:5000/api/categories', {
          name: newCategoryName,
          type: newTransaction.type,
          icon: 'tag', // generic default icon
          color: 'var(--primary)', // generic default color
          classification: newCategoryClassification
        }, config);
        categoryId = catRes.data.id;
      }

      const transactionPayload = {
        ...newTransaction,
        category_id: categoryId,
        amount: Number(newTransaction.amount)
      };

      if (editingTransaction) {
        await axios.put(`http://localhost:5000/api/transactions/${editingTransaction.id}`, transactionPayload, config);
      } else {
        await axios.post('http://localhost:5000/api/transactions', transactionPayload, config);
      }
      
      setShowAddTransaction(false);
      setEditingTransaction(null);
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
      setNewCategoryName('');
      setNewCategoryClassification('want');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error adding transaction');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '60vh' }}>Loading...</div>;
  }

  // Stats calculated above

  // Calculate classification totals for Smart Analysis
  const needsTotal = transactions
    .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'need')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const wantsTotal = transactions
    .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'want')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const savingsTotal = transactions
    .filter(t => t.type === 'expense' && categories.find(c => c.id === t.category_id)?.classification === 'saving')
    .reduce((acc, t) => acc + Number(t.amount), 0);
    
  const needsPercent = monthlyIncome > 0 ? (needsTotal / monthlyIncome) * 100 : 0;
  const wantsPercent = monthlyIncome > 0 ? (wantsTotal / monthlyIncome) * 100 : 0;
  const savingsPercent = monthlyIncome > 0 ? (savingsTotal / monthlyIncome) * 100 : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare just the date portion
  const overdueBills = bills.filter(b => !b.is_paid && new Date(b.due_date) < today);

  return (
    <div className="animate-fade-in" style={{ paddingTop: '2rem' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Welcome, {localStorage.getItem('firstName') || 'User'}!</h1>
          <p>Here's an overview of your finances.</p>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Mode: <strong>{budgetRule === '50-30-20' ? '50/30/20 Rule Active' : 'Custom Budget Active'}</strong>
            </span>
            <button 
              onClick={toggleBudgetRule}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Toggle
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <PlaidLinkButton onSuccessCallback={fetchDashboardData} />
          <button className="btn btn-secondary" onClick={handleSyncPlaid}>
            <RefreshCw size={20} /> Sync
          </button>
          <CsvUpload onUploadSuccess={fetchDashboardData} />
          <button className="btn btn-secondary" onClick={() => setShowBudgetModal(true)}>
            Manage Budgets
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddBillModal(true)}>
            <CalendarPlus size={20} /> Schedule Bill
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={20} /> Add Transaction
          </button>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
          Based on your {budgetRule === '50-30-20' ? '50/30/20 goals' : 'budget'}, here is how your expenses are classified:
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)' }}>
            <strong>Needs (Goal: 50%)</strong>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{needsPercent.toFixed(1)}%</div>
            <div style={{ fontSize: '0.875rem' }}>${needsTotal.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f59e0b' }}>
            <strong>Wants (Goal: 30%)</strong>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{wantsPercent.toFixed(1)}%</div>
            <div style={{ fontSize: '0.875rem' }}>${wantsTotal.toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #3b82f6' }}>
            <strong>Savings (Goal: 20%)</strong>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{savingsPercent.toFixed(1)}%</div>
            <div style={{ fontSize: '0.875rem' }}>${savingsTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Recommendation Engine */}
        <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Recommendation:</strong>
          {needsPercent > 50 ? (
            <p style={{ margin: 0, color: 'var(--danger)' }}>
              Your "Needs" are exceeding 50% of your income. Since needs are essential, you should drastically cut back on your "Wants" (currently {wantsPercent.toFixed(1)}%) to ensure you can still build your Emergency Fund and Savings.
            </p>
          ) : wantsPercent > 30 ? (
            <p style={{ margin: 0, color: 'var(--danger)' }}>
              You are overspending on "Wants". Consider reducing discretionary spending to improve your saving rate.
            </p>
          ) : savingsPercent < 20 && (needsPercent + wantsPercent) > 0 ? (
            <p style={{ margin: 0, color: 'var(--accent)' }}>
              You haven't hit your 20% savings goal yet. Try to allocate the remaining balance towards your emergency fund!
            </p>
          ) : (
            <p style={{ margin: 0, color: 'var(--success)' }}>
              Great job! Your spending is well-balanced and you are on track with your saving goals.
            </p>
          )}
        </div>
      </div>

      <ChartsPanel 
        transactions={transactions} 
        categories={categories} 
        budgets={budgets} 
        budgetRule={budgetRule} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Recent Transactions
          </h3>
          <TransactionList 
            transactions={transactions} 
            onEdit={openEditModal} 
            onDelete={handleDeleteTransaction} 
          />
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={20} className="text-accent" />
            Categories Breakdown
          </h3>
          <div className="flex flex-col gap-4">
            {categories.length === 0 ? (
              <p className="text-center py-4">No categories found.</p>
            ) : (
              <>
                {(showAllCategories ? categories : categories.slice(0, 4)).map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="flex items-center gap-3">
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color || 'var(--primary)' }}></span>
                      <span style={{ fontWeight: '500' }}>{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-secondary">{cat.type}</span>
                      {cat.classification && (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {cat.classification}
                        </span>
                      )}
                      {!cat.is_default && (
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}
                          title="Delete Custom Category"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {categories.length > 4 && (
                  <button 
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start', fontSize: '0.875rem' }}
                  >
                    {showAllCategories ? 'See Less' : `See All ${categories.length} Categories...`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <BillsCalendar bills={bills} fetchBills={fetchDashboardData} />

      {/* Add/Edit Transaction Modal */}
      {showAddTransaction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card max-w-md w-full animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input type="number" step="0.01" className="form-input" required value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" required value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}>
                  <option value="" disabled>Select category</option>
                  {categories.filter(c => c.type === newTransaction.type).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  <option value="new_category" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add New Category...</option>
                </select>
              </div>

              {newTransaction.category === 'new_category' && (
                <div className="animate-fade-in" style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label className="form-label">New Category Name</label>
                    <input type="text" className="form-input" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Travel, Entertainment..." />
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Classification</label>
                    <select className="form-input" value={newCategoryClassification} onChange={e => setNewCategoryClassification(e.target.value)}>
                      <option value="need">Need (Essential for living)</option>
                      <option value="want">Want (Lifestyle choices)</option>
                      <option value="saving">Saving (Future security / Emergency)</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" required value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} placeholder="What was this for?" />
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddTransaction(false); setEditingTransaction(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Budget Limit Modal */}
      {showBudgetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card max-w-md w-full animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Set Budget Limit</h2>
            <form onSubmit={handleSaveBudget}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" required value={editingBudget.category_id} onChange={e => setEditingBudget({...editingBudget, category_id: e.target.value})}>
                  <option value="" disabled>Select category</option>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Limit ($)</label>
                <input type="number" step="0.01" className="form-input" required value={editingBudget.amount} onChange={e => setEditingBudget({...editingBudget, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Limit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Scheduled Bill Modal */}
      {showAddBillModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card max-w-md w-full animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Schedule New Bill</h2>
            <form onSubmit={handleAddBill}>
              <div className="form-group">
                <label className="form-label">Bill Title</label>
                <input type="text" className="form-input" required value={newBill.title} onChange={e => setNewBill({...newBill, title: e.target.value})} placeholder="e.g. Electric Bill, Rent" />
              </div>
              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input type="number" step="0.01" className="form-input" required value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" required value={newBill.due_date} onChange={e => setNewBill({...newBill, due_date: e.target.value})} />
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBillModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Budget Depletion Warning Modal */}
      {showBudgetWarning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card max-w-lg w-full animate-fade-in" style={{ padding: '2rem', borderTop: '4px solid var(--danger)' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>
              <AlertTriangle size={32} />
              <h2 style={{ margin: 0 }}>Budget Warning!</h2>
            </div>
            
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              Your total expenses (<strong>${totalExpense.toFixed(2)}</strong>) have reached or exceeded 50% of your estimated monthly income (<strong>${needsLimit.toFixed(2)}</strong>).
            </p>

            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Needs vs Wants: A Philosophical Guide</h4>
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                It can be hard to separate Needs from Wants on a personal level. Here is how most households define them:
              </p>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Needs (50%):</strong> The essentials for basic survival. These include <em>Rent/Mortgage, Groceries, Utilities, Basic Transportation, and Minimum Debt Payments.</em> If you lost your job today, you would still need to pay these.
                </li>
                <li>
                  <strong>Wants (30%):</strong> The "extras" that make life enjoyable but aren't strictly necessary. These include <em>Dining Out, Entertainment, Subscriptions, Vacations, and Hobbies.</em>
                </li>
              </ul>
              <p style={{ fontSize: '0.95rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                <strong>Tip:</strong> If your expenses are hitting this 50% mark fast, double-check that you aren't categorizing "Wants" as "Needs". Consider cutting back on Wants to ensure you can still hit your <strong>20% Savings</strong> goal!
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
        </div>
      )}
    </div>
  );
};

export default Dashboard;
