import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Edit2, Trash2 } from 'lucide-react';

const TransactionList = ({ transactions, onEdit, onDelete }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted" style={{ padding: '2rem 0' }}>
        <p>No transactions found.</p>
        <p style={{ fontSize: '0.875rem' }}>Add a transaction to see it here.</p>
      </div>
    );
  }

  // Sort by date descending
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="flex flex-col gap-4">
      {sortedTransactions.slice(0, visibleCount).map((transaction) => {
        const isIncome = transaction.type === 'income';
        const date = new Date(transaction.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC'
        });

        return (
          <div 
            key={transaction.id} 
            className="flex justify-between items-center" 
            style={{ 
              padding: '1rem', 
              background: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid transparent',
              transition: 'border-color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div className="flex items-center gap-4">
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)', 
                background: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isIncome ? 'var(--success)' : 'var(--danger)'
              }}>
                {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
              <div>
                <p style={{ fontWeight: '600', margin: 0 }}>{transaction.category_name || 'Uncategorized'}</p>
                <p style={{ fontSize: '0.875rem', margin: 0 }} className="text-secondary">
                  {transaction.description ? `${transaction.description} • ` : ''}{date}
                </p>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => onEdit && onEdit(transaction)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  title="Edit Transaction"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDelete && onDelete(transaction.id || transaction._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                  title="Delete Transaction"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <p style={{ 
                fontWeight: '600', 
                fontSize: '1.125rem',
                margin: 0,
                color: isIncome ? 'var(--success)' : 'var(--text-primary)'
              }}>
                {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
      
      {sortedTransactions.length > visibleCount && (
        <div className="flex justify-center mt-2">
          <button 
            className="btn btn-secondary" 
            onClick={() => setVisibleCount(prev => prev + 15)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.5rem',
              width: '100%',
              maxWidth: '300px',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            Load More ({sortedTransactions.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
