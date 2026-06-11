import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import './App.css';

function App() {
  // A simple auth check (can be improved with Context/State)
  const isAuthenticated = !!localStorage.getItem('token');
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

  return (
    <Router>
      <div className="app-container">
        {/* Simple Top Navigation for premium feel */}
        {isAuthenticated && (
          <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>B</div>
              BudgetApp
            </div>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </nav>
        )}

        <main className="page-wrapper container">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            
            <Route 
              path="/onboarding" 
              element={isAuthenticated && !onboardingCompleted ? <Onboarding /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  onboardingCompleted ? <Dashboard /> : <Navigate to="/onboarding" />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
