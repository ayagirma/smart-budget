import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

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
  const [debts, setDebts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [planTier, setPlanTier] = useState('free');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      const [catRes, transRes, budgetRes, billRes, bankAccountsRes, debtsRes, subsRes, planRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/categories`, config),
        axios.get(`${API_BASE_URL}/api/transactions`, config),
        axios.get(`${API_BASE_URL}/api/budgets`, config),
        axios.get(`${API_BASE_URL}/api/bills`, config),
        axios.get(`${API_BASE_URL}/api/plaid/accounts`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/debts`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/subscriptions`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/payments/status`, config).catch(() => ({ data: { planTier: 'free' } }))
      ]);
      
      setCategories(catRes.data);
      setTransactions(transRes.data);
      setBudgets(budgetRes.data);
      setBills(billRes.data);
      setBankAccounts(bankAccountsRes.data);
      setDebts(debtsRes.data);
      setSubscriptions(subsRes.data);
      setPlanTier(planRes.data.planTier || 'free');
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
    setDebts([]);
    setSubscriptions([]);
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
      debts,
      subscriptions,
      planTier,
      isPro: planTier === 'pro' || user?.email?.toLowerCase() === 'ayagirma@gmail.com',
      isAdmin: user?.email?.toLowerCase() === 'ayagirma@gmail.com',
      themeMode,
      toggleTheme,
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
