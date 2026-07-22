import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Debts from './pages/Debts';
import Subscriptions from './pages/Subscriptions';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';
import { useApp } from './context/AppContext';
import './App.css';

function App() {
  const { isAuthenticated, user, loading } = useApp();

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>Loading application...</div>;
  }

  const onboardingCompleted = user?.onboardingCompleted === true;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route 
          path="/onboarding" 
          element={isAuthenticated && !onboardingCompleted ? <Onboarding /> : <Navigate to="/" />} 
        />
        
        {/* Authenticated Layout Routes */}
        {isAuthenticated && onboardingCompleted ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
          </Route>
        ) : isAuthenticated && !onboardingCompleted ? (
          <Route path="*" element={<Navigate to="/onboarding" />} />
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
