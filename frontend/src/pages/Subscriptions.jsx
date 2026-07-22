import React, { useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Repeat, Calendar, DollarSign, Plus, Trash2, AlertCircle, CheckCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Subscriptions = () => {
  const { subscriptions: initialSubs, token, fetchDashboardData } = useApp();
  const [subsList, setSubsList] = useState(initialSubs && initialSubs.length > 0 ? initialSubs : [
    { id: 'sub-1', name: 'Netflix Premium', amount: 22.99, billing_cycle: 'monthly', category: 'Entertainment', next_billing_date: '2026-08-01', is_flagged_for_cancellation: false },
    { id: 'sub-2', name: 'Spotify Family', amount: 16.99, billing_cycle: 'monthly', category: 'Entertainment', next_billing_date: '2026-08-05', is_flagged_for_cancellation: false },
    { id: 'sub-3', name: 'Gym Membership (Equinox)', amount: 185.00, billing_cycle: 'monthly', category: 'Health & Fitness', next_billing_date: '2026-08-15', is_flagged_for_cancellation: true },
    { id: 'sub-4', name: 'Amazon Prime Annual', amount: 139.00, billing_cycle: 'yearly', category: 'Shopping', next_billing_date: '2026-11-20', is_flagged_for_cancellation: false },
    { id: 'sub-5', name: 'Cloud Storage (Google One)', amount: 9.99, billing_cycle: 'monthly', category: 'Tech & Tools', next_billing_date: '2026-08-10', is_flagged_for_cancellation: false }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({
    name: '',
    amount: '',
    billing_cycle: 'monthly',
    category: 'Entertainment',
    next_billing_date: ''
  });

  // Calculations
  const monthlyTotal = subsList.reduce((acc, sub) => {
    const cost = Number(sub.amount);
    return acc + (sub.billing_cycle === 'yearly' ? cost / 12 : cost);
  }, 0);

  const yearlyTotal = monthlyTotal * 12;
  const flaggedCount = subsList.filter(s => s.is_flagged_for_cancellation).length;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newSub.name || !newSub.amount) return;

    if (token) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.post(`${API_BASE_URL}/api/subscriptions`, newSub, config);
        setSubsList(prev => [...prev, res.data]);
        fetchDashboardData();
      } catch (err) {
        console.error('Error adding subscription:', err);
      }
    } else {
      setSubsList(prev => [...prev, { ...newSub, id: `local-${Date.now()}`, is_flagged_for_cancellation: false }]);
    }

    setNewSub({ name: '', amount: '', billing_cycle: 'monthly', category: 'Entertainment', next_billing_date: '' });
    setShowAddModal(false);
  };

  const handleToggleFlag = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    if (token && typeof id === 'number') {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(`${API_BASE_URL}/api/subscriptions/${id}/flag`, { is_flagged_for_cancellation: nextStatus }, config);
        fetchDashboardData();
      } catch (err) {
        console.error('Error updating flag:', err);
      }
    }

    setSubsList(prev => prev.map(s => s.id === id ? { ...s, is_flagged_for_cancellation: nextStatus } : s));
  };

  const handleDelete = async (id) => {
    if (token && typeof id === 'number') {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API_BASE_URL}/api/subscriptions/${id}`, config);
        fetchDashboardData();
      } catch (err) {
        console.error('Error deleting subscription:', err);
      }
    }
    setSubsList(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="subscriptions-page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Subscriptions & Recurring Spend</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Audit your active recurring subscriptions, detect cost leaks, and flag unused services.
          </p>
        </div>

        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Subscription
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center p-4">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monthly Subscription Spend</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
            ${monthlyTotal.toFixed(2)}/mo
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normalized across cycles</span>
        </div>

        <div className="card text-center p-4">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Annualized Cost</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
            ${yearlyTotal.toFixed(2)}/yr
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Spent each year</span>
        </div>

        <div className="card text-center p-4">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Subscriptions</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
            {subsList.length}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tracked recurring services</span>
        </div>

        <div className="card text-center p-4" style={{ borderColor: flaggedCount > 0 ? '#ef4444' : 'var(--border-color)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Flagged for Cancellation</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: flaggedCount > 0 ? '#ef4444' : '#10b981', marginTop: '0.25rem' }}>
            {flaggedCount}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready to cancel</span>
        </div>
      </div>

      {/* Flagged Subscriptions Alert Banner */}
      {flaggedCount > 0 && (
        <div className="card mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} style={{ color: '#ef4444' }} />
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#ef4444' }}>
                Potential Savings Alert: ${subsList.filter(s => s.is_flagged_for_cancellation).reduce((acc, s) => acc + (s.billing_cycle === 'yearly' ? s.amount / 12 : Number(s.amount)), 0).toFixed(2)}/month
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                You have {flaggedCount} subscription(s) marked for cancellation. Canceling these will save you up to ${(subsList.filter(s => s.is_flagged_for_cancellation).reduce((acc, s) => acc + (s.billing_cycle === 'yearly' ? s.amount : Number(s.amount) * 12), 0)).toFixed(2)} per year.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Tracked Subscriptions</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>SUBSCRIPTION NAME</th>
                <th style={{ padding: '0.75rem' }}>CATEGORY</th>
                <th style={{ padding: '0.75rem' }}>COST</th>
                <th style={{ padding: '0.75rem' }}>CYCLE</th>
                <th style={{ padding: '0.75rem' }}>NEXT BILLING</th>
                <th style={{ padding: '0.75rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {subsList.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{sub.name}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 500
                    }}>
                      {sub.category || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                    ${Number(sub.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontSize: '0.875rem' }}>
                    {sub.billing_cycle}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {sub.next_billing_date ? sub.next_billing_date : 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => handleToggleFlag(sub.id, sub.is_flagged_for_cancellation)}
                      style={{
                        padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                        border: 'none', cursor: 'pointer',
                        background: sub.is_flagged_for_cancellation ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                        color: sub.is_flagged_for_cancellation ? '#ef4444' : '#10b981'
                      }}
                    >
                      {sub.is_flagged_for_cancellation ? 'Flagged to Cancel' : 'Active'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Delete Subscription"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Add Subscription</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix, Disney+, Gym"
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.99"
                    value={newSub.amount}
                    onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Billing Cycle</label>
                  <select
                    value={newSub.billing_cycle}
                    onChange={(e) => setNewSub({ ...newSub, billing_cycle: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Category</label>
                  <select
                    value={newSub.category}
                    onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Software & SaaS">Software & SaaS</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Next Billing Date</label>
                  <input
                    type="date"
                    value={newSub.next_billing_date}
                    onChange={(e) => setNewSub({ ...newSub, next_billing_date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
