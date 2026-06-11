import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'var(--bg-surface)', padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: '5px 0', color: payload[0].color }}>
          Total Expense: ${Number(data.totalExpense).toFixed(2)}
        </p>
        {data.isSpike && (
          <div style={{ marginTop: '10px', color: 'var(--danger)', fontSize: '0.875rem' }}>
            <strong>⚠️ Spike Detected!</strong>
            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
              {data.topTransactions.map((t, idx) => (
                <li key={idx}>{t.description || 'Unknown'}: ${Number(t.amount).toFixed(2)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ChartsPanel = ({ transactions, categories, budgets, budgetRule }) => {
  // 1. Prepare data for Custom Budget Bar Chart
  const barChartData = useMemo(() => {
    if (budgetRule !== 'custom') return [];
    
    const expenseCategories = categories.filter(c => c.type === 'expense');
    return expenseCategories.map(cat => {
      const actualExpense = transactions
        .filter(t => t.category_id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        
      const budgetObj = budgets.find(b => b.category_id === cat.id);
      const budgetLimit = budgetObj ? Number(budgetObj.amount) : 0;
      
      return {
        name: cat.name,
        actualExpense,
        budgetLimit
      };
    }).filter(data => data.actualExpense > 0 || data.budgetLimit > 0);
  }, [transactions, categories, budgets, budgetRule]);

  // 2. Prepare data for Line Chart (Spike Detection)
  const lineChartData = useMemo(() => {
    const expensesByDate = {};
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(t => {
      const dateObj = new Date(t.date);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Use raw date for sorting
      const sortKey = dateObj.getTime();
      
      if (!expensesByDate[dateStr]) {
        expensesByDate[dateStr] = { totalExpense: 0, transactions: [], sortKey };
      }
      expensesByDate[dateStr].totalExpense += Math.abs(Number(t.amount));
      expensesByDate[dateStr].transactions.push(t);
    });

    const sortedDates = Object.values(expensesByDate).sort((a, b) => a.sortKey - b.sortKey);
    
    const dataList = sortedDates.map(dayData => {
      const dayTransactions = dayData.transactions.sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)));
      // reverse mapping to find the date string
      const dateStr = Object.keys(expensesByDate).find(k => expensesByDate[k] === dayData);
      return {
        date: dateStr,
        totalExpense: dayData.totalExpense,
        topTransactions: dayTransactions.slice(0, 2)
      };
    });

    if (dataList.length === 0) return [];

    const totalSum = dataList.reduce((sum, d) => sum + d.totalExpense, 0);
    const average = totalSum / dataList.length;
    const threshold = average * 2;

    return dataList.map(d => ({
      ...d,
      isSpike: d.totalExpense > threshold && d.totalExpense > 20, // Ignore tiny daily sums as spikes
      threshold
    }));
  }, [transactions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
      {/* Line Chart for Bills & Spikes */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Daily Expenses & Anomalies</h3>
        <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          Shows your expenses over time. Spikes (unusually high days) are highlighted. Hover for details.
        </p>
        {lineChartData.length > 0 ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalExpense" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                  name="Total Expense ($)" 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSpike) {
                      return (
                        <circle cx={cx} cy={cy} r={6} fill="var(--danger)" stroke="none" key={`dot-${payload.date}`} />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={4} fill="var(--primary)" stroke="none" key={`dot-${payload.date}`} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-secondary text-center py-4">No expense data available to build the chart.</p>
        )}
      </div>

      {/* Bar Chart for Custom Budgets */}
      {budgetRule === 'custom' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Budget Limits vs Actual Expenses</h3>
          {barChartData.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Legend />
                  <Bar dataKey="budgetLimit" fill="var(--success)" name="Budget Limit ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualExpense" fill="var(--danger)" name="Actual Expense ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-secondary text-center py-4">Add transactions to see your custom budget progress.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartsPanel;
