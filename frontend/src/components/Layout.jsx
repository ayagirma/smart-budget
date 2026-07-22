import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, ListOrdered, PieChart, Target, LogOut, CreditCard, Repeat, Sun, Moon, Download, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ExportReportModal from './ExportReportModal';
import PricingModal from './PricingModal';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const { categories, transactions, budgets, bills, loading, logout, fetchDashboardData, bankAccounts, themeMode, toggleTheme, planTier, isPro, user, isAdmin } = useApp();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <ListOrdered size={20} /> },
    { path: '/budgets', label: 'Budgets', icon: <Target size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <PieChart size={20} /> },
    { path: '/debts', label: 'Debt Payoff', icon: <CreditCard size={20} /> },
    { path: '/subscriptions', label: 'Subscriptions', icon: <Repeat size={20} /> },
  ];

  return (
    <div className="layout-container">
      {/* Desktop Top Navigation */}
      <nav className="desktop-nav">
        <div className="nav-brand">
          <div className="brand-logo">B</div>
          <span className="brand-name">BudgetApp</span>
          {isAdmin || user?.email?.toLowerCase() === 'ayagirma@gmail.com' ? (
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.6rem', background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ADMIN (ALL FEATURES UNLOCKED)
            </span>
          ) : isPro ? (
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', background: 'var(--primary)', color: '#fff', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PRO
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '10px' }}>
              FREE
            </span>
          )}
        </div>
        
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Plan Tier Upgrade Button */}
          <button
            className={`btn ${isPro ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setShowPricingModal(true)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', height: '36px' }}
          >
            <Crown size={15} />
            <span>{isPro ? 'Pro Active' : 'Upgrade $4.99'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ padding: '0.5rem', borderRadius: '50%', height: '36px', width: '36px' }}
          >
            {themeMode === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
          </button>

          {/* Export Report Button */}
          <button
            className="btn btn-secondary"
            onClick={() => setShowExportModal(true)}
            title="Export Reports"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', height: '36px' }}
          >
            <Download size={15} style={{ display: 'inline', marginRight: '4px' }} />
            Export
          </button>

          <button className="btn btn-secondary logout-btn" onClick={handleLogout} style={{ height: '36px' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <ExportReportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: '60vh' }}>Loading...</div>
          ) : (
            <Outlet context={{ categories, transactions, budgets, bills, fetchDashboardData, bankAccounts }} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
