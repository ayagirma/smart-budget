import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Trash2, CheckCircle } from 'lucide-react';

const RulesManager = ({ onClose, categories, onRulesApplied }) => {
  const [rules, setRules] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [matchType, setMatchType] = useState('contains');
  
  // Preview State
  const [previewMatches, setPreviewMatches] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchRules = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.get('http://localhost:5000/api/rules', config);
      setRules(data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Debounced scan for rule matches
  useEffect(() => {
    if (!keyword.trim()) {
      setPreviewMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const { data } = await axios.get(
          `http://localhost:5000/api/rules/preview?keyword=${encodeURIComponent(keyword)}&match_type=${matchType}`,
          config
        );
        setPreviewMatches(data);
      } catch (err) {
        console.error('Error fetching preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [keyword, matchType]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:5000/api/rules', { keyword, category_id: categoryId, match_type: matchType }, config);
      setKeyword('');
      setCategoryId('');
      fetchRules();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add rule');
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`http://localhost:5000/api/rules/${id}`, config);
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleApplyRules = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const { data } = await axios.post('http://localhost:5000/api/rules/apply', {}, config);
      alert(data.message);
      if (onRulesApplied) {
        onRulesApplied();
      }
    } catch (error) {
      alert('Failed to apply rules');
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="card w-full animate-fade-in" style={{ padding: '1.5rem', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Auto-Categorization Rules</h2>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>

        <form onSubmit={handleAddRule} className="rules-form">
          <div className="rules-form-group">
            <label className="form-label">Keyword</label>
            <input type="text" className="form-input" value={keyword} onChange={e => setKeyword(e.target.value)} required placeholder="e.g. Netflix" />
          </div>
          <div className="rules-form-group" style={{ minWidth: '120px' }}>
            <label className="form-label">Match</label>
            <select className="form-input" value={matchType} onChange={e => setMatchType(e.target.value)}>
              <option value="contains">Contains</option>
              <option value="starts_with">Starts With</option>
              <option value="exact">Exact Match</option>
            </select>
          </div>
          <div className="rules-form-group">
            <label className="form-label">Assign To</label>
            <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">Select Category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '44px', padding: '0 1.5rem', whiteSpace: 'nowrap' }}>Add Rule</button>
        </form>

        {keyword.trim() && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
            {loadingPreview ? (
              <span className="text-secondary">Scanning transactions...</span>
            ) : previewMatches.length === 0 ? (
              <span className="text-secondary">No uncategorized transactions match this pattern.</span>
            ) : (
              <div>
                <span className="text-success" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ✓ Will auto-categorize {previewMatches.length} matching transaction(s):
                </span>
                <div style={{ maxHeight: '100px', overflowY: 'auto', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {previewMatches.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <span>• {t.description} ({new Date(t.date).toLocaleDateString()})</span>
                      <strong style={{ color: 'var(--text-primary)' }}>-${Number(t.amount).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Rules</h3>
          <button className="btn btn-secondary flex items-center gap-2" onClick={handleApplyRules}>
            <CheckCircle size={16} /> Apply to Old Transactions
          </button>
        </div>

        {rules.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No rules yet. Create one above to automatically categorize your imported transactions!</p>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Keyword</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Match Type</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Category</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{rule.keyword}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{rule.match_type}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ backgroundColor: `${rule.category_color}20`, color: rule.category_color }}>
                        {rule.category_name}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center' }} 
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default RulesManager;
