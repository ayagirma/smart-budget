import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { Calendar as CalendarIcon, CheckCircle, Circle, Trash2 } from 'lucide-react';
import './BillsCalendar.css'; 

const BillsCalendar = ({ bills, fetchBills }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleMarkPaid = async (bill) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put(`http://localhost:5000/api/bills/${bill.id}/paid`, { is_paid: !bill.is_paid }, config);
      fetchBills();
    } catch (err) {
      console.error(err);
      alert('Error updating bill');
    }
  };

  const handleDelete = async (billId) => {
    if (!window.confirm("Delete this bill?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`http://localhost:5000/api/bills/${billId}`, config);
      fetchBills();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to check if a bill falls on a specific date (local timezone)
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Content for calendar tiles
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      // Due dates from db are stored as UTC string at midnight, need to parse correctly
      const dayBills = bills.filter(b => isSameDay(new Date(b.due_date), date));
      if (dayBills.length > 0) {
        const hasUnpaid = dayBills.some(b => !b.is_paid);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
            <div style={{ 
              width: '6px', height: '6px', borderRadius: '50%', 
              backgroundColor: hasUnpaid ? 'var(--danger)' : 'var(--success)' 
            }} />
          </div>
        );
      }
    }
    return null;
  };

  const selectedBills = bills.filter(b => isSameDay(new Date(b.due_date), selectedDate));

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CalendarIcon size={20} className="text-primary" />
        Scheduled Bills Calendar
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div>
          <Calendar 
            onChange={setSelectedDate} 
            value={selectedDate}
            tileContent={tileContent}
            className="custom-calendar"
          />
        </div>
        
        <div>
          <h4 style={{ marginBottom: '1rem' }}>
            Bills for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </h4>
          {selectedBills.length === 0 ? (
            <p className="text-secondary text-sm">No bills due on this date.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedBills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center" style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-surface)', 
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid ${bill.is_paid ? 'var(--success)' : 'var(--danger)'}`
                }}>
                  <div>
                    <p style={{ fontWeight: '600', margin: 0, textDecoration: bill.is_paid ? 'line-through' : 'none', color: bill.is_paid ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {bill.title}
                    </p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>
                      ${Number(bill.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleMarkPaid(bill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bill.is_paid ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {bill.is_paid ? <CheckCircle size={24} /> : <Circle size={24} />}
                    </button>
                    <button onClick={() => handleDelete(bill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillsCalendar;
