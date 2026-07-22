import React, { useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { CreditCard, TrendingDown, DollarSign, Calendar, Plus, Trash2, Award, Zap, ArrowDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '../config';

const Debts = () => {
  const { debts: initialDebts, token, fetchDashboardData } = useApp();
  const [debtsList, setDebtsList] = useState(initialDebts && initialDebts.length > 0 ? initialDebts : [
    { id: 'sample-1', name: 'Chase Freedom Flex Card', balance: 4200, interest_rate: 22.99, minimum_payment: 125, type: 'credit_card' },
    { id: 'sample-2', name: 'Auto Loan (Toyota)', balance: 11500, interest_rate: 5.49, minimum_payment: 260, type: 'car_loan' },
    { id: 'sample-3', name: 'Federal Student Loan', balance: 8400, interest_rate: 4.80, minimum_payment: 110, type: 'student_loan' }
  ]);

  const [strategy, setStrategy] = useState('avalanche'); // 'avalanche' | 'snowball'
  const [extraPayment, setExtraPayment] = useState(250);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: '',
    balance: '',
    interest_rate: '',
    minimum_payment: '',
    type: 'credit_card'
  });

  // Calculate total debt metrics
  const totalBalance = debtsList.reduce((acc, debt) => acc + Number(debt.balance), 0);
  const totalMinPayment = debtsList.reduce((acc, debt) => acc + Number(debt.minimum_payment), 0);
  const avgInterestRate = debtsList.length > 0
    ? (debtsList.reduce((acc, debt) => acc + Number(debt.interest_rate), 0) / debtsList.length).toFixed(2)
    : 0;

  // Payoff Simulation Algorithm
  const calculatePayoff = (method, monthlyExtra) => {
    if (debtsList.length === 0 || totalBalance === 0) return { months: 0, totalInterest: 0, chartData: [] };

    // Clone debts to avoid mutating state
    let debtsCopy = debtsList.map(d => ({
      ...d,
      balance: Number(d.balance),
      apr: Number(d.interest_rate) / 100 / 12,
      minPay: Number(d.minimum_payment)
    }));

    if (method === 'avalanche') {
      debtsCopy.sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate));
    } else {
      debtsCopy.sort((a, b) => a.balance - b.balance);
    }

    let currentMonth = 0;
    let totalInterestPaid = 0;
    let chartData = [{ month: 'Start', totalBalance: Math.round(totalBalance) }];

    while (debtsCopy.some(d => d.balance > 0) && currentMonth < 300) { currentMonth++;
      let extraPool = Number(monthlyExtra);
      let monthInterest = 0;
      let monthTotalBalance = 0;

      // 1. Charge interest for the month
      debtsCopy.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * d.apr;
          d.balance += interest;
          monthInterest += interest;
        }
      });

      totalInterestPaid += monthInterest;

      // 2. Pay minimums first
      debtsCopy.forEach(d => {
        if (d.balance > 0) {
          const payment = Math.min(d.balance, d.minPay);
          d.balance -= payment;
        }
      });

      // 3. Apply extra payment pool to priority debt
      for (let d of debtsCopy) {
        if (d.balance > 0 && extraPool > 0) {
          const extra = Math.min(d.balance, extraPool);
          d.balance -= extra;
          extraPool -= extra;
        }
      }

      monthTotalBalance = debtsCopy.reduce((acc, d) => acc + Math.max(0, d.balance), 0);

      if (currentMonth % 3 === 0 || monthTotalBalance === 0) {
        chartData.push({
          month: `M${currentMonth}`,
          totalBalance: Math.round(monthTotalBalance)
        });
      }
    }

    return { months: currentMonth, totalInterest: Math.round(totalInterestPaid), chartData };
  };

  const currentSimulation = calculatePayoff(strategy, extraPayment);
  const minOnlySimulation = calculatePayoff('avalanche', 0);
  const interestSaved = Math.max(0, minOnlySimulation.totalInterest - currentSimulation.totalInterest);

  const getTargetDate = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleAddDebtSubmit = async (e) => {
    e.preventDefault();
    if (!newDebt.name || !newDebt.balance || !newDebt.interest_rate || !newDebt.minimum_payment) return;

    if (token) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.post(`${API_BASE_URL}/api/debts`, newDebt, config);
        setDebtsList(prev => [...prev, res.data]);
        fetchDashboardData();
      } catch (err) {
        console.error('Error saving debt:', err);
      }
    } else {
      setDebtsList(prev => [...prev, { ...newDebt, id: `local-${Date.now()}` }]);
    }

    setNewDebt({ name: '', balance: '', interest_rate: '', minimum_payment: '', type: 'credit_card' });
    setShowAddModal(false);
  };

  const handleDeleteDebt = async (id) => {
    if (token && typeof id === 'number') {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API_BASE_URL}/api/debts/${id}`, config);
        fetchDashboardData();
      } catch (err) {
        console.error('Error deleting debt:', err);
      }
    }
    setDebtsList(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="debts-page-container animate-fade-in">
      {/* Header Section */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Debt Payoff Planner</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Simulate acceleration strategies to eliminate your debts faster and save interest.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="debts-layout">
        {/* Left Column: Controls & Active Debts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Interactive Controls & Strategy Selector */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Payoff Parameters</h3>
            <div className="flex flex-col gap-4">
              {/* Strategy Toggle Buttons */}
              <div className="flex flex-col gap-2">
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payoff Method:</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className={`btn ${strategy === 'avalanche' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStrategy('avalanche')}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', flex: 1, height: '36px' }}
                  >
                    <Zap size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Avalanche (High APR)
                  </button>
                  <button
                    className={`btn ${strategy === 'snowball' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStrategy('snowball')}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', flex: 1, height: '36px' }}
                  >
                    <Award size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Snowball (Low Balance)
                  </button>
                </div>
              </div>

              {/* Extra Monthly Payment Slider */}
              <div className="flex flex-col gap-2">
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Extra Monthly Payment:</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="25"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '55px', color: 'var(--primary)', textAlign: 'right' }}>
                    +${extraPayment}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Debts List Card */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Active Debts</h3>
              <button 
                className="btn btn-primary flex items-center gap-1.5" 
                onClick={() => setShowAddModal(true)} 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '32px' }}
              >
                <Plus size={15} /> Add Debt
              </button>
            </div>
            
            {debtsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No active debts! Add a debt to start planning.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {debtsList.map((debt) => (
                  <div 
                    key={debt.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem', 
                      padding: '1rem', 
                      background: 'var(--bg-subtle)', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)', 
                      position: 'relative' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{debt.name}</span>
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>
                        {debt.type ? debt.type.replace('_', ' ') : 'Credit Card'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>BALANCE</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)' }}>
                          ${Number(debt.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, letterSpacing: '0.05em' }}>APR / MIN</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {debt.interest_rate}% / ${Number(debt.minimum_payment).toFixed(0)}/mo
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      style={{ 
                        position: 'absolute', 
                        top: '0.75rem', 
                        right: '0.75rem', 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--danger)', 
                        cursor: 'pointer', 
                        opacity: 0.6, 
                        transition: 'opacity 0.2s',
                        padding: '0.25rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                      title="Delete Debt"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metrics Cards & Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card text-center p-4 animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Outstanding Debt</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem', marginBottom: '0.15rem' }}>
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Across {debtsList.length} accounts</span>
            </div>

            <div className="card text-center p-4 animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Estimated Debt-Free Date</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem', marginBottom: '0.15rem' }}>
                {getTargetDate(currentSimulation.months)}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>{currentSimulation.months} months remaining</span>
            </div>

            <div className="card text-center p-4 animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Interest Cost</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem', marginBottom: '0.15rem' }}>
                ${currentSimulation.totalInterest.toLocaleString()}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg APR: {avgInterestRate}%</span>
            </div>

            <div className="card text-center p-4 animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', borderColor: 'var(--primary-light)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Interest Saved vs Minimums</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem', marginBottom: '0.15rem' }}>
                ${interestSaved.toLocaleString()}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>With ${extraPayment}/mo extra</span>
            </div>
          </div>

          {/* Payoff Progress Chart */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Debt Payoff Projection Trajectory ({strategy === 'avalanche' ? 'Avalanche Method' : 'Snowball Method'})
            </h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={currentSimulation.chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `$${val}`} style={{ fontSize: '0.75rem' }} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Total Debt']} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
                  <Area type="monotone" dataKey="totalBalance" stroke="var(--primary)" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Add Debt Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Add New Debt</h3>
            <form onSubmit={handleAddDebtSubmit}>
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Debt Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chase Sapphire Card"
                  value={newDebt.name}
                  onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Current Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    value={newDebt.balance}
                    onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Interest Rate (APR %)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="19.99"
                    value={newDebt.interest_rate}
                    onChange={(e) => setNewDebt({ ...newDebt, interest_rate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Min Payment ($/mo)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150"
                    value={newDebt.minimum_payment}
                    onChange={(e) => setNewDebt({ ...newDebt, minimum_payment: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Debt Type</label>
                  <select
                    value={newDebt.type}
                    onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="car_loan">Car Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="personal_loan">Personal Loan</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Debt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
