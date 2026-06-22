import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { CalendarPlus, Landmark, Car, LineChart, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import ChartsPanel from '../components/ChartsPanel';
import BillsCalendar from '../components/BillsCalendar';

const Analytics = () => {
  const { transactions, categories, budgets, bills, fetchDashboardData } = useOutletContext();
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [newBill, setNewBill] = useState({ title: '', amount: '', due_date: '' });

  // Forecast state
  const [forecasts, setForecasts] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);

  useEffect(() => {
    const fetchForecasts = async () => {
      setLoadingForecast(true);
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get('http://localhost:5000/api/transactions/forecast', config);
        setForecasts(data);
      } catch (err) {
        console.error('Error fetching forecasts:', err);
      } finally {
        setLoadingForecast(false);
      }
    };
    fetchForecasts();
  }, [transactions]);

  // Month & Year state filters (default to current month/year)
  const currentMonthVal = new Date().getMonth() + 1;
  const currentYearVal = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthVal.toString());
  const [selectedYear, setSelectedYear] = useState(currentYearVal.toString());

  // Advisor Tab State
  const [advisorTab, setAdvisorTab] = useState('house');

  // 1. Mortgage Calculator State
  const [homePrice, setHomePrice] = useState(300000);
  const [homeDownPayment, setHomeDownPayment] = useState(60000);
  const [homeInterestRate, setHomeInterestRate] = useState(6.5);
  const [homeTerm, setHomeTerm] = useState(30);

  // 2. Car Loan Calculator State
  const [carPrice, setCarPrice] = useState(25000);
  const [carDownPayment, setCarDownPayment] = useState(5000);
  const [carInterestRate, setCarInterestRate] = useState(5.0);
  const [carTerm, setCarTerm] = useState(48);

  // 3. Investment Calculator State
  const [startingBalance, setStartingBalance] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(8.0);
  const [investmentYears, setInvestmentYears] = useState(10);

  const budgetRule = localStorage.getItem('budgetRule') || '50-30-20';
  const monthlyIncome = Number(localStorage.getItem('monthlyIncome') || 0);

  const months = [
    { value: '1', name: 'January' },
    { value: '2', name: 'February' },
    { value: '3', name: 'March' },
    { value: '4', name: 'April' },
    { value: '5', name: 'May' },
    { value: '6', name: 'June' },
    { value: '7', name: 'July' },
    { value: '8', name: 'August' },
    { value: '9', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (!transactions || transactions.length === 0) {
      return [currentYear.toString()];
    }
    
    const yearsSet = new Set();
    yearsSet.add(currentYear);
    
    transactions.forEach(t => {
      if (t.date) {
        const d = new Date(t.date);
        const y = d.getUTCFullYear();
        if (!isNaN(y)) {
          yearsSet.add(y);
        }
      }
    });
    
    return Array.from(yearsSet).sort((a, b) => a - b).map(y => y.toString());
  }, [transactions]);

  // Filter lists based on selected Month & Year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return (d.getUTCMonth() + 1) === Number(selectedMonth) && d.getUTCFullYear() === Number(selectedYear);
    });
  }, [transactions, selectedMonth, selectedYear]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => b.month === Number(selectedMonth) && b.year === Number(selectedYear));
  }, [budgets, selectedMonth, selectedYear]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const d = new Date(b.due_date);
      return (d.getUTCMonth() + 1) === Number(selectedMonth) && d.getUTCFullYear() === Number(selectedYear);
    });
  }, [bills, selectedMonth, selectedYear]);

  // Calculate actual spending metrics
  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [filteredTransactions]);

  const monthlySavings = Math.max(0, monthlyIncome - totalExpenses);
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // Investment state contribution is pre-seeded with current savings surplus
  const [monthlyContribution, setMonthlyContribution] = useState(Math.round(monthlySavings) || 500);

  // Top category spending habits
  const topCategories = useMemo(() => {
    const categorySpent = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'expense' && t.category_id) {
        categorySpent[t.category_id] = (categorySpent[t.category_id] || 0) + Math.abs(Number(t.amount));
      }
    });
    const totalPeriodExpenses = Object.values(categorySpent).reduce((sum, amt) => sum + amt, 0);
    return Object.keys(categorySpent)
      .map(catId => {
        const cat = categories.find(c => c.id === Number(catId));
        const amt = categorySpent[catId];
        const pct = totalPeriodExpenses > 0 ? (amt / totalPeriodExpenses) * 100 : 0;
        return { 
          id: catId,
          name: cat ? cat.name : 'Uncategorized', 
          amount: amt, 
          percent: pct, 
          color: cat ? cat.color : 'var(--primary)' 
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [filteredTransactions, categories]);

  // Handle Add Scheduled Bill
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

  // 1. Mortgage calculation logic
  const mortgageResult = useMemo(() => {
    const principal = Math.max(0, homePrice - homeDownPayment);
    if (principal === 0) return { payment: 0, isAffordable: true };
    const r = (homeInterestRate / 100) / 12;
    const n = homeTerm * 12;
    
    let payment = 0;
    if (r === 0) {
      payment = principal / n;
    } else {
      payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    
    // Affordable rule: Housing principal + interest should be <= 28% of gross monthly income
    const maxAffordable = monthlyIncome * 0.28;
    const isAffordable = payment <= maxAffordable;
    
    // Timeline to save down payment
    const monthlyRate = Math.max(1, monthlySavings);
    const monthsToSave = Math.ceil(homeDownPayment / monthlyRate);
    
    return {
      payment,
      maxAffordable,
      isAffordable,
      monthsToSave: isNaN(monthsToSave) || monthsToSave === Infinity ? 0 : monthsToSave
    };
  }, [homePrice, homeDownPayment, homeInterestRate, homeTerm, monthlyIncome, monthlySavings]);

  // 2. Car Loan calculation logic
  const carLoanResult = useMemo(() => {
    const principal = Math.max(0, carPrice - carDownPayment);
    if (principal === 0) return { payment: 0, isAffordable: true };
    const r = (carInterestRate / 100) / 12;
    const n = carTerm;
    
    let payment = 0;
    if (r === 0) {
      payment = principal / n;
    } else {
      payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    
    // Affordability: car payment under 10% of monthly net income
    const maxAffordable = monthlyIncome * 0.10;
    const isAffordable = payment <= maxAffordable;
    
    return {
      payment,
      maxAffordable,
      isAffordable
    };
  }, [carPrice, carDownPayment, carInterestRate, carTerm, monthlyIncome]);

  // 3. Investment compound interest calculation logic
  const investmentResult = useMemo(() => {
    const r = (expectedReturn / 100) / 12;
    const n = investmentYears * 12;
    const PMT = Number(monthlyContribution);
    
    let futureValue = 0;
    if (r === 0) {
      futureValue = startingBalance + PMT * n;
    } else {
      futureValue = startingBalance * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r);
    }
    
    const totalContributed = startingBalance + PMT * n;
    const interestEarned = Math.max(0, futureValue - totalContributed);
    
    return {
      futureValue,
      totalContributed,
      interestEarned
    };
  }, [startingBalance, monthlyContribution, expectedReturn, investmentYears]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2>Analytics & Planning</h2>
          <div className="flex gap-2 mt-2">
            <select 
              className="form-input" 
              style={{ width: 'auto', padding: '0.4rem 1.5rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>
            <select 
              className="form-input" 
              style={{ width: 'auto', padding: '0.4rem 1.5rem 0.4rem 0.75rem', fontSize: '0.875rem' }}
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        
        <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowAddBillModal(true)}>
          <CalendarPlus size={18} /> Schedule Bill
        </button>
      </div>

      <div className="analytics-layout">
        
        {/* Left Side: Charts & Bills Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <ChartsPanel 
            transactions={filteredTransactions} 
            categories={categories} 
            budgets={filteredBudgets} 
            budgetRule={budgetRule} 
          />

          <div>
            <BillsCalendar bills={filteredBills} fetchBills={fetchDashboardData} />
          </div>
        </div>

        {/* Right Side: Smart Financial Advisor Sidebar */}
        <div className="advisor-card flex flex-col gap-4">
          <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Sparkles size={22} className="text-gradient" />
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Smart Advisor</h3>
          </div>

          {/* Habit Insights */}
          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              Period Spending Habits:
            </h4>
            {topCategories.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No expenses recorded for this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topCategories.map(cat => (
                  <div key={cat.id} className="insight-habit-row">
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>{cat.percent.toFixed(0)}%</strong> (${cat.amount.toFixed(0)})
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Monthly Surplus:</span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--success)' }}>
                ${monthlySavings.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Savings Rate:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Goal Advisory Panel */}
          <div>
            <div className="advisor-tab-container">
              <button className={`advisor-tab ${advisorTab === 'house' ? 'active' : ''}`} onClick={() => setAdvisorTab('house')}>
                House
              </button>
              <button className={`advisor-tab ${advisorTab === 'car' ? 'active' : ''}`} onClick={() => setAdvisorTab('car')}>
                Car
              </button>
              <button className={`advisor-tab ${advisorTab === 'invest' ? 'active' : ''}`} onClick={() => setAdvisorTab('invest')}>
                Invest
              </button>
              <button className={`advisor-tab ${advisorTab === 'forecast' ? 'active' : ''}`} onClick={() => setAdvisorTab('forecast')}>
                Forecast
              </button>
            </div>

            {/* House tab content */}
            {advisorTab === 'house' && (
              <div className="animate-fade-in" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Landmark size={18} color="var(--primary)" /> Planning a House Purchase
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  With your current surplus of <strong>${monthlySavings.toFixed(0)}/mo</strong>, it will take you <strong>{mortgageResult.monthsToSave} months</strong> to save your target down payment of <strong>${Number(homeDownPayment).toLocaleString()}</strong>.
                </p>

                <div className="calc-form">
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    Mortgage Calculator
                  </h5>
                  <div className="calc-grid">
                    <div className="calc-input-group">
                      <label className="calc-label">Home Price ($)</label>
                      <input type="number" step="1000" className="calc-input" value={homePrice} onChange={e => setHomePrice(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Down Payment ($)</label>
                      <input type="number" step="1000" className="calc-input" value={homeDownPayment} onChange={e => setHomeDownPayment(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Interest Rate (%)</label>
                      <input type="number" step="0.1" className="calc-input" value={homeInterestRate} onChange={e => setHomeInterestRate(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Term (years)</label>
                      <input type="number" className="calc-input" value={homeTerm} onChange={e => setHomeTerm(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className={`calc-result ${!mortgageResult.isAffordable ? 'warn' : ''}`}>
                    <div className="calc-result-title">Monthly P&I Payment</div>
                    <div className="calc-result-value">${mortgageResult.payment.toFixed(2)}</div>
                    <div className="calc-result-hint">
                      {mortgageResult.isAffordable ? (
                        <span style={{ color: 'var(--success)' }}>✓ Affordable (under 28% limit of ${mortgageResult.maxAffordable.toFixed(0)}/mo)</span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <AlertTriangle size={14} /> Exceeds 28% rule of ${mortgageResult.maxAffordable.toFixed(0)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Car tab content */}
            {advisorTab === 'car' && (
              <div className="animate-fade-in" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Car size={18} color="var(--primary)" /> Buying a Vehicle
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  We recommend the <strong>20/4/10 rule</strong>: put down at least 20%, finance for no more than 4 years (48 months), and ensure total vehicle payments are under 10% of your take-home pay (<strong>${(monthlyIncome * 0.10).toFixed(0)}/mo</strong>).
                </p>

                <div className="calc-form">
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    Car Loan Calculator
                  </h5>
                  <div className="calc-grid">
                    <div className="calc-input-group">
                      <label className="calc-label">Car Price ($)</label>
                      <input type="number" step="500" className="calc-input" value={carPrice} onChange={e => setCarPrice(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Down Payment ($)</label>
                      <input type="number" step="500" className="calc-input" value={carDownPayment} onChange={e => setCarDownPayment(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Interest Rate (%)</label>
                      <input type="number" step="0.1" className="calc-input" value={carInterestRate} onChange={e => setCarInterestRate(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Term (months)</label>
                      <input type="number" className="calc-input" value={carTerm} onChange={e => setCarTerm(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className={`calc-result ${!carLoanResult.isAffordable ? 'warn' : ''}`}>
                    <div className="calc-result-title">Monthly Car Payment</div>
                    <div className="calc-result-value">${carLoanResult.payment.toFixed(2)}</div>
                    <div className="calc-result-hint">
                      {carLoanResult.isAffordable ? (
                        <span style={{ color: 'var(--success)' }}>✓ Safe limit (under 10% limit of ${carLoanResult.maxAffordable.toFixed(0)}/mo)</span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <AlertTriangle size={14} /> Exceeds 10% target limit of ${carLoanResult.maxAffordable.toFixed(0)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Investment tab content */}
            {advisorTab === 'invest' && (
              <div className="animate-fade-in" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--primary)" /> Wealth & Investments
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Grow your monthly surplus. Index funds average ~8% annually. High-yield savings accounts (HYSA) are safer options for short-term goals.
                </p>

                <div className="calc-form">
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    Compound Savings Calculator
                  </h5>
                  <div className="calc-grid">
                    <div className="calc-input-group">
                      <label className="calc-label">Starting Cash ($)</label>
                      <input type="number" step="500" className="calc-input" value={startingBalance} onChange={e => setStartingBalance(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Monthly Add ($)</label>
                      <input type="number" step="50" className="calc-input" value={monthlyContribution} onChange={e => setMonthlyContribution(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Return Rate (%)</label>
                      <input type="number" step="0.5" className="calc-input" value={expectedReturn} onChange={e => setExpectedReturn(Number(e.target.value))} />
                    </div>
                    <div className="calc-input-group">
                      <label className="calc-label">Years</label>
                      <input type="number" className="calc-input" value={investmentYears} onChange={e => setInvestmentYears(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="calc-result">
                    <div className="calc-result-title">Projected Portfolio Value</div>
                    <div className="calc-result-value">${Math.round(investmentResult.futureValue).toLocaleString()}</div>
                    <div className="calc-result-hint">
                      Earned <strong style={{ color: 'var(--success)' }}>${Math.round(investmentResult.interestEarned).toLocaleString()}</strong> in interest compound
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forecast tab content */}
            {advisorTab === 'forecast' && (
              <div className="animate-fade-in" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--primary)" /> Spending Forecast (Next Month)
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Predictive spending analysis calculated using historical moving averages and category trends.
                </p>

                {loadingForecast ? (
                  <p className="text-secondary text-sm">Loading forecast data...</p>
                ) : forecasts.length === 0 ? (
                  <p className="text-secondary text-sm">No historical data to generate predictions.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                    {forecasts.map(f => {
                      if (f.forecastedNextMonth === 0 && f.currentSpent === 0) return null;
                      
                      const forecastVal = f.forecastedNextMonth;
                      const averageVal = f.averageMonthlySpent;
                      const limit = f.budgetLimit;
                      
                      return (
                        <div key={f.categoryId} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                          <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.categoryColor || 'var(--primary)' }} />
                              {f.categoryName}
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: f.trendDescription === 'Increasing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: f.trendDescription === 'Increasing' ? 'var(--danger)' : 'var(--success)', borderRadius: '4px', fontWeight: 'bold' }}>
                              {f.trendDescription}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs text-secondary" style={{ marginBottom: '0.25rem' }}>
                            <span>Avg Month: ${averageVal.toFixed(0)}</span>
                            <span>Projected Next: <strong>${forecastVal.toFixed(0)}</strong></span>
                          </div>

                          {limit > 0 && (
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                              <div className="flex justify-between text-xs" style={{ color: f.isForecastOverBudget ? 'var(--danger)' : 'var(--success)' }}>
                                <span>Limit: ${limit.toFixed(0)}</span>
                                <span>
                                  {f.isForecastOverBudget ? `Forecast overruns by $${(forecastVal - limit).toFixed(0)}` : `✓ Forecast fits limit`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddBillModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ padding: '1.5rem', width: '95%', maxWidth: '450px', maxHeight: '85vh', overflowY: 'auto' }}>
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default Analytics;
