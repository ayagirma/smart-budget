import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, ListOrdered, PieChart, Target, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const { categories, transactions, budgets, bills, loading, logout, fetchDashboardData, bankAccounts } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={24} /> },
    { path: '/transactions', label: 'Transactions', icon: <ListOrdered size={24} /> },
    { path: '/budgets', label: 'Budgets', icon: <Target size={24} /> },
    { path: '/analytics', label: 'Analytics', icon: <PieChart size={24} /> },
  ];

  return (
    <div className="layout-container">
      {/* Desktop Top Navigation */}
      <nav className="desktop-nav">
        <div className="nav-brand">
          <div className="brand-logo">B</div>
          <span className="brand-name">BudgetApp</span>
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

        <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

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
