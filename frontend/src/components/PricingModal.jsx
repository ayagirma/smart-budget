import React, { useState } from 'react';
import { Check, Zap, ShieldCheck, X, Crown, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const PricingModal = ({ isOpen, onClose }) => {
  const { planTier, isPro, token, fetchDashboardData } = useApp();
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggleDemoTier = async (targetTier) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE_URL}/api/payments/toggle-tier`, { targetPlan: targetTier }, config);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error toggling plan tier:', err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const freeFeatures = [
    'Manual Income & Expense Tracking',
    'Standard 50/30/20 Budgeting',
    'CSV Statement File Uploads',
    'Basic Bill Calendar',
    'Up to 1 Linked Account'
  ];

  const proFeatures = [
    'Everything in Free Plan',
    '⚡ Unlimited Live Plaid Bank Syncing',
    '🎯 Interactive Debt Payoff Acceleration Engine',
    '🔄 Subscription Audit & One-Click Cancellation Flags',
    '🧠 Smart Advisor & Predictive Forecasting',
    '📄 Unlimited PDF & Custom CSV Exports',
    '💬 Priority Premium Support'
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
      padding: '2rem 1rem', overflowY: 'auto'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '750px', padding: '2rem', position: 'relative', margin: 'auto' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <Crown size={16} style={{ marginRight: '6px' }} /> Upgrade Your Financial Experience
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>Simple, Transparent Pricing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Choose the plan that fits your personal finance goals.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              className={`btn ${billingInterval === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBillingInterval('monthly')}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
            >
              Monthly Billing
            </button>
            <button
              className={`btn ${billingInterval === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBillingInterval('yearly')}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
            >
              Annual (Save 18%)
            </button>
          </div>
        </div>

        {/* Pricing Cards Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* FREE TIER CARD */}
          <div style={{
            background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Free Tier</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Perfect for basic manual budgeting</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                $0 <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/ forever</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {freeFeatures.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>
                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0 }} /> {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="btn btn-secondary w-full mt-4"
              disabled={planTier === 'free' || loading}
              onClick={() => handleToggleDemoTier('free')}
            >
              {planTier === 'free' ? 'Current Active Plan' : 'Switch to Free Plan'}
            </button>
          </div>

          {/* PRO TIER CARD */}
          <div style={{
            background: 'var(--bg-card)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <div style={{ position: 'absolute', top: '-12px', right: '1.5rem', background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
              MOST POPULAR
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Pro Subscriber <Crown size={18} />
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Complete automation & smart planning</p>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {billingInterval === 'monthly' ? '$4.99' : '$49.00'}
                <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                  {billingInterval === 'monthly' ? ' / month' : ' / year'}
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {proFeatures.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.6rem', fontWeight: idx > 0 ? 600 : 400, color: 'var(--text-primary)' }}>
                    <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} /> {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="btn btn-primary w-full mt-4"
              disabled={planTier === 'pro' || loading}
              onClick={() => handleToggleDemoTier('pro')}
            >
              {planTier === 'pro' ? 'Pro Plan Active ✓' : 'Upgrade to Pro ($4.99)'}
            </button>
          </div>
        </div>

        {/* Demo Fast Switcher Footer */}
        <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 <strong>Testing Mode Active:</strong> Clicking "Upgrade to Pro" or "Switch to Free" instantly toggles your tier live in the database so you can test all features.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
