import React, { useState } from 'react';
import { Download, FileText, Calendar, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ExportReportModal = ({ isOpen, onClose }) => {
  const { transactions, categories, budgets, debts } = useApp();
  const [reportType, setReportType] = useState('transactions'); // 'transactions' | 'monthly_summary'
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'this_month' | 'ytd'

  if (!isOpen) return null;

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (reportType === 'transactions') {
      const headers = ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount ($)'];
      const rows = transactions.map(t => {
        const catName = categories.find(c => c.id === t.category_id)?.name || 'Uncategorized';
        return [t.id, t.date, `"${t.description || ''}"`, `"${catName}"`, t.type, t.amount];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csvContent, `budget_app_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      // Monthly Summary Export
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      const netSavings = totalIncome - totalExpense;

      const summaryRows = [
        ['FINANCIAL SUMMARY REPORT'],
        ['Generated Date', new Date().toLocaleDateString()],
        [''],
        ['METRIC', 'VALUE ($)'],
        ['Total Income', totalIncome.toFixed(2)],
        ['Total Expenses', totalExpense.toFixed(2)],
        ['Net Savings', netSavings.toFixed(2)],
        [''],
        ['CATEGORY BREAKDOWN'],
        ['Category', 'Budget Limit ($)', 'Type']
      ];

      categories.forEach(c => {
        const b = budgets.find(b => b.category_id === c.id);
        summaryRows.push([`"${c.name}"`, b ? b.amount : '0.00', c.type]);
      });

      const csvContent = summaryRows.map(r => r.join(',')).join('\n');
      downloadCSV(csvContent, `budget_app_financial_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Download size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Export Financial Report</h3>
        </div>

        <div className="mb-4">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Report Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn ${reportType === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('transactions')}
              style={{ fontSize: '0.85rem', padding: '0.6rem' }}
            >
              Transactions Log (CSV)
            </button>
            <button
              className={`btn ${reportType === 'monthly_summary' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('monthly_summary')}
              style={{ fontSize: '0.85rem', padding: '0.6rem' }}
            >
              Financial Summary (CSV)
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Time Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Available History</option>
            <option value="this_month">Current Month</option>
            <option value="ytd">Year to Date (2026)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex items-center gap-2" onClick={handleExport}>
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
