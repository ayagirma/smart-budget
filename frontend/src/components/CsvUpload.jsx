import React, { useState } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { Upload } from 'lucide-react';

const CsvUpload = ({ onUploadSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ date: '', amount: '', description: '' });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (results.data && results.data.length > 0) {
            setHeaders(Object.keys(results.data[0]));
            setCsvData(results.data);
            setShowModal(true);
          }
        }
      });
    }
    // clear input
    e.target.value = null;
  };

  const handleUpload = async () => {
    try {
      const mappedData = csvData.map(row => ({
        date: row[mapping.date],
        amount: row[mapping.amount],
        description: row[mapping.description]
      }));

      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:5000/api/transactions/upload_csv', { transactions: mappedData }, config);
      
      setShowModal(false);
      setCsvData([]);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Error uploading CSV:', err);
      alert('Failed to upload CSV. Ensure all mapped fields are valid.');
    }
  };

  return (
    <>
      <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
        <Upload size={20} /> Upload CSV
        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
      </label>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card max-w-md w-full animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Map CSV Columns</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Please select which column from your CSV corresponds to the required fields.
            </p>
            
            <div className="form-group">
              <label className="form-label">Date Column</label>
              <select className="form-input" value={mapping.date} onChange={e => setMapping({...mapping, date: e.target.value})}>
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Column</label>
              <select className="form-input" value={mapping.amount} onChange={e => setMapping({...mapping, amount: e.target.value})}>
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description Column</label>
              <select className="form-input" value={mapping.description} onChange={e => setMapping({...mapping, description: e.target.value})}>
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className="flex justify-between mt-4">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!mapping.date || !mapping.amount || !mapping.description}>Upload Data</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CsvUpload;
