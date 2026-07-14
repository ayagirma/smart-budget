import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const onboarding = localStorage.getItem('onboardingCompleted') === 'true';
    const income = localStorage.getItem('monthlyIncome') || '0';
    const rule = localStorage.getItem('budgetRule') || '50-30-20';
    const firstName = localStorage.getItem('firstName') || '';
    
    return token ? {
      firstName,
      onboardingCompleted: onboarding,
      monthlyIncome: Number(income),
      budgetRule: rule
    } : null;
  });

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async (authToken) => {
    const activeToken = authToken || token;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${activeToken}` }
      };
      const [catRes, transRes, budgetRes, billRes, bankAccountsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/categories', config),
        axios.get('http://localhost:5000/api/transactions', config),
        axios.get('http://localhost:5000/api/budgets', config),
        axios.get('http://localhost:5000/api/bills', config),
        axios.get('http://localhost:5000/api/plaid/accounts', config).catch(() => ({ data: [] }))
      ]);
      
      setCategories(catRes.data);
      setTransactions(transRes.data);
      setBudgets(budgetRes.data);
      setBills(billRes.data);
      setBankAccounts(bankAccountsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 401) {
        logout();
      }
      setLoading(false);
    }
  }, [token]);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('firstName', userData.firstName);
    localStorage.setItem('onboardingCompleted', userData.onboardingCompleted ? 'true' : 'false');
    localStorage.setItem('monthlyIncome', userData.monthlyIncome || '0');
    localStorage.setItem('budgetRule', userData.budgetRule || '50-30-20');

    setToken(userData.token);
    setUser({
      firstName: userData.firstName,
      onboardingCompleted: userData.onboardingCompleted,
      monthlyIncome: Number(userData.monthlyIncome || 0),
      budgetRule: userData.budgetRule || '50-30-20'
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('monthlyIncome');
    localStorage.removeItem('budgetRule');

    setToken(null);
    setUser(null);
    setCategories([]);
    setTransactions([]);
    setBudgets([]);
    setBills([]);
    setBankAccounts([]);
  };

  const updateUser = (updates) => {
    if (updates.monthlyIncome !== undefined) {
      localStorage.setItem('monthlyIncome', updates.monthlyIncome);
    }
    if (updates.budgetRule !== undefined) {
      localStorage.setItem('budgetRule', updates.budgetRule);
    }
    if (updates.onboardingCompleted !== undefined) {
      localStorage.setItem('onboardingCompleted', updates.onboardingCompleted ? 'true' : 'false');
    }
    if (updates.firstName !== undefined) {
      localStorage.setItem('firstName', updates.firstName);
    }

    setUser(prev => ({
      ...prev,
      ...updates
    }));
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchDashboardData]);

  const isAuthenticated = !!token;

  return (
    <AppContext.Provider value={{
      token,
      user,
      isAuthenticated,
      categories,
      transactions,
      budgets,
      bills,
      bankAccounts,
      loading,
      login,
      logout,
      updateUser,
      fetchDashboardData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
