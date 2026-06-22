import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Trash2, Target, AlertTriangle, Edit2, PlusCircle, CheckCircle } from 'lucide-react';

const Budgets = () => {
  const { categories, transactions, budgets, fetchDashboardData } = useOutletContext();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState({ category_id: '', amount: '' });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[currentMonth - 1];

  // Filter current month transactions
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    // Use UTC methods to prevent timezone shifting issues
    return (d.getUTCMonth() + 1) === currentMonth && d.getUTCFullYear() === currentYear;
  });

  // Calculate actual spending per category in the current month
  const categorySpending = {};
  currentMonthTransactions.forEach(t => {
    if (t.type === 'expense') {
      const catId = t.category_id;
      if (catId) {
        categorySpending[catId] = (categorySpending[catId] || 0) + Math.abs(Number(t.amount));
      }
    }
  });

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

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      
      await axios.post('http://localhost:5000/api/budgets', {
        category_id: Number(editingBudget.category_id),
        amount: Number(editingBudget.amount),
        month: currentMonth,
        year: currentYear
      }, config);
      
      setShowBudgetModal(false);
      setEditingBudget({ category_id: '', amount: '' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error saving budget limit');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to remove this budget limit?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`http://localhost:5000/api/budgets/${id}`, config);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error removing budget limit');
    }
  };

  const openAddBudgetModal = () => {
    setEditingBudget({ category_id: '', amount: '' });
    setShowBudgetModal(true);
  };

  const openEditBudgetModal = (budget) => {
    setEditingBudget({ category_id: budget.category_id.toString(), amount: budget.amount.toString() });
    setShowBudgetModal(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2>Budgets & Categories</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Tracking limits for <strong>{currentMonthName} {currentYear}</strong>
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={openAddBudgetModal}>
          <PlusCircle size={18} /> Set Budget Limit
        </button>
      </div>

      {/* Active Budgets Smart Sheet */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} className="text-gradient" />
          Active Budgets & Progress
        </h3>

        {budgets.length === 0 ? (
          <div className="card text-center" style={{ padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              No budget limits set for this month. Set limit targets below to track spending progress!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {budgets.map(budget => {
              const cat = categories.find(c => c.id === budget.category_id);
              if (!cat) return null;

              const spent = categorySpending[budget.category_id] || 0;
              const limit = Number(budget.amount);
              const percent = limit > 0 ? (spent / limit) * 100 : 0;
              const isOver = spent > limit;
              const diff = Math.abs(limit - spent);

              // Classification colors
              let classColor = 'var(--text-secondary)';
              let classBg = 'rgba(255, 255, 255, 0.05)';
              if (cat.classification === 'need') {
                classColor = 'var(--success)';
                classBg = 'rgba(16, 185, 129, 0.1)';
              } else if (cat.classification === 'want') {
                classColor = '#f59e0b';
                classBg = 'rgba(245, 158, 11, 0.1)';
              } else if (cat.classification === 'saving') {
                classColor = '#3b82f6';
                classBg = 'rgba(59, 130, 246, 0.1)';
              }

              return (
                <div key={budget.id} className="card flex flex-col justify-between" style={{ padding: '1.5rem', position: 'relative', borderTop: `4px solid ${isOver ? 'var(--danger)' : cat.color || 'var(--primary)'}` }}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color || 'var(--primary)' }} />
                          {cat.name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: classBg, color: classColor, borderRadius: '12px', fontWeight: 'bold', textTransform: 'capitalize', display: 'inline-block', marginTop: '0.25rem' }}>
                          {cat.classification}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', display: 'inline-flex' }}
                          onClick={() => openEditBudgetModal(budget)}
                          title="Edit Limit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', display: 'inline-flex', color: 'var(--danger)' }}
                          onClick={() => handleDeleteBudget(budget.id)}
                          title="Delete Limit"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                      <div className="flex justify-between items-baseline" style={{ fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: '500' }}>${spent.toFixed(2)} spent</span>
                        <span className="text-secondary">of ${limit.toFixed(2)}</span>
                      </div>

                      {/* Progress Bar Track */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(percent, 100)}%`, 
                            height: '100%', 
                            background: percent > 100 ? 'var(--danger)' : percent > 85 ? '#f59e0b' : cat.color || 'var(--primary)', 
                            borderRadius: '4px', 
                            transition: 'width 0.3s ease' 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    {isOver ? (
                      <>
                        <AlertTriangle size={16} color="var(--danger)" />
                        <span style={{ color: 'var(--danger)', fontWeight: '600' }}>Exceeded by ${diff.toFixed(2)}</span>
                      </>
                    ) : percent > 85 ? (
                      <>
                        <AlertTriangle size={16} color="#f59e0b" />
                        <span style={{ color: '#f59e0b', fontWeight: '500' }}>Warning: only ${diff.toFixed(2)} left</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} color="var(--success)" />
                        <span style={{ color: 'var(--text-secondary)' }}>${diff.toFixed(2)} remaining</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Categories Breakdown */}
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
              {(showAllCategories ? categories : categories.slice(0, 10)).map(cat => (
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
              {categories.length > 10 && (
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

      {/* Set Budget Modal */}
      {showBudgetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
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
    </div>
  );
};

export default Budgets;
