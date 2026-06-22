import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Plus, RefreshCw, Settings, Menu, X } from 'lucide-react';
import TransactionList from '../components/TransactionList';
import PlaidLinkButton from '../components/PlaidLinkButton';
import CsvUpload from '../components/CsvUpload';
import RulesManager from '../components/RulesManager';

const Transactions = () => {
  const { transactions, categories, fetchDashboardData } = useOutletContext();
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryClassification, setNewCategoryClassification] = useState('want');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalNotification, setModalNotification] = useState(null); // { type: 'success' | 'error' | 'confirm', message: string, onConfirm?: () => void }

  const showModalAlert = (message, type = 'success') => {
    setModalNotification({ message, type });
  };

  const showModalConfirm = (message, onConfirm) => {
    setModalNotification({ message, type: 'confirm', onConfirm });
  };

  const handleSyncPlaid = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:5000/api/plaid/sync', {}, config);
      fetchDashboardData();
      showModalAlert('Transactions synced successfully!');
    } catch (err) {
      console.error(err);
      showModalAlert('Failed to sync transactions or no account linked.', 'error');
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setNewTransaction({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
    setNewCategoryName('');
    setNewCategoryClassification('want');
    setShowAddTransaction(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category_id || '',
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setNewCategoryName('');
    setNewCategoryClassification('want');
    setShowAddTransaction(true);
  };

  const handleDeleteTransaction = (id) => {
    showModalConfirm('Are you sure you want to delete this transaction?', async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
        fetchDashboardData();
        showModalAlert('Transaction deleted successfully!');
      } catch (err) {
        console.error(err);
        showModalAlert('Error deleting transaction', 'error');
      }
    });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      let categoryId = newTransaction.category;

      if (categoryId === 'new_category') {
        const catRes = await axios.post('http://localhost:5000/api/categories', {
          name: newCategoryName,
          type: newTransaction.type,
          icon: 'tag',
          color: 'var(--primary)',
          classification: newCategoryClassification
        }, config);
        categoryId = catRes.data.id;
      }

      const transactionPayload = {
        ...newTransaction,
        category_id: categoryId,
        amount: Number(newTransaction.amount)
      };

      if (editingTransaction) {
        await axios.put(`http://localhost:5000/api/transactions/${editingTransaction.id}`, transactionPayload, config);
      } else {
        await axios.post('http://localhost:5000/api/transactions', transactionPayload, config);
      }
      
      setShowAddTransaction(false);
      setEditingTransaction(null);
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
      setNewCategoryName('');
      setNewCategoryClassification('want');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showModalAlert('Error saving transaction', 'error');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Search term match (description)
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // 2. Type match
      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }
      // 3. Category match
      if (filterCategory !== 'all' && t.category_id?.toString() !== filterCategory) {
        return false;
      }
      // 4. Date range match
      if (startDate) {
        const tDate = new Date(t.date).toISOString().split('T')[0];
        if (tDate < startDate) return false;
      }
      if (endDate) {
        const tDate = new Date(t.date).toISOString().split('T')[0];
        if (tDate > endDate) return false;
      }
      return true;
    });
  }, [transactions, searchTerm, filterType, filterCategory, startDate, endDate]);

  const availableCategoriesForFilter = useMemo(() => {
    return categories.filter(c => filterType === 'all' || c.type === filterType);
  }, [categories, filterType]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4" style={{ position: 'relative' }}>
        <h2>Transactions</h2>
        <div className="actions-menu-container">
          <button 
            type="button"
            className="btn btn-secondary actions-menu-trigger" 
            style={{ width: '42px', height: '42px', padding: 0 }}
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            aria-label="Toggle actions menu"
          >
            {showActionsMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {showActionsMenu && (
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'transparent' }} 
              onClick={() => setShowActionsMenu(false)}
            />
          )}

          <div className={`transactions-actions ${showActionsMenu ? 'show' : ''}`} style={{ zIndex: 50 }}>
            <PlaidLinkButton onSuccessCallback={() => { fetchDashboardData(); setShowActionsMenu(false); }} />
            <button 
              className="btn btn-secondary flex items-center gap-2" 
              onClick={() => { handleSyncPlaid(); setShowActionsMenu(false); }}
            >
              <RefreshCw size={18} /> Sync
            </button>
            <CsvUpload onUploadSuccess={() => { fetchDashboardData(); setShowActionsMenu(false); }} />
            <button 
              className="btn btn-secondary flex items-center gap-2" 
              onClick={() => { setShowRulesModal(true); setShowActionsMenu(false); }}
            >
              <Settings size={18} /> Rules
            </button>
            <button 
              className="btn btn-primary flex items-center gap-2" 
              onClick={() => { openAddModal(); setShowActionsMenu(false); }}
            >
              <Plus size={18} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search description..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Type</label>
            <select 
              className="form-input" 
              value={filterType} 
              onChange={e => {
                setFilterType(e.target.value);
                setFilterCategory('all');
              }}
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Category</label>
            <select 
              className="form-input" 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {availableCategoriesForFilter.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>From Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>To Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
        </div>
        {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || startDate || endDate) && (
          <div className="flex justify-end mt-3">
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <TransactionList 
          transactions={filteredTransactions} 
          onEdit={openEditModal} 
          onDelete={handleDeleteTransaction} 
        />
      </div>

      {showRulesModal && (
        <RulesManager onClose={() => setShowRulesModal(false)} categories={categories} onRulesApplied={fetchDashboardData} />
      )}

      {showAddTransaction && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ padding: '1.5rem', width: '95%', maxWidth: '450px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input type="number" step="0.01" className="form-input" required value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" required value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}>
                  <option value="" disabled>Select category</option>
                  {categories.filter(c => c.type === newTransaction.type).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  <option value="new_category" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add New Category...</option>
                </select>
              </div>

              {newTransaction.category === 'new_category' && (
                <div className="animate-fade-in" style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label className="form-label">New Category Name</label>
                    <input type="text" className="form-input" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Travel, Entertainment..." />
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Classification</label>
                    <select className="form-input" value={newCategoryClassification} onChange={e => setNewCategoryClassification(e.target.value)}>
                      <option value="need">Need (Essential for living)</option>
                      <option value="want">Want (Lifestyle choices)</option>
                      <option value="saving">Saving (Future security / Emergency)</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" required value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} placeholder="What was this for?" />
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddTransaction(false); setEditingTransaction(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {modalNotification && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ padding: '1.5rem', width: '95%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: modalNotification.type === 'error' ? 'var(--danger)' : modalNotification.type === 'confirm' ? 'var(--primary)' : 'var(--success)' }}>
              {modalNotification.type === 'error' ? 'Error' : modalNotification.type === 'confirm' ? 'Confirm Action' : 'Success'}
            </h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{modalNotification.message}</p>
            <div className="flex justify-center gap-4">
              {modalNotification.type === 'confirm' ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setModalNotification(null)}>Cancel</button>
                  <button className="btn btn-primary" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => { modalNotification.onConfirm(); setModalNotification(null); }}>Delete</button>
                </>
              ) : (
                <button className="btn btn-primary" style={{ minWidth: '100px' }} onClick={() => setModalNotification(null)}>OK</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Transactions;
