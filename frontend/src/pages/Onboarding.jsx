import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CheckCircle2, Target, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('');
  const [use503020, setUse503020] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = (e) => {
    e?.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      if (income && Number(income) > 0) {
        if (use503020) {
          setStep(5);
        } else {
          handleComplete('custom');
        }
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    setStep(4);
  };

  const handleComplete = async (ruleOverride) => {
    setLoading(true);
    const finalRule = ruleOverride === 'custom' ? 'custom' : '50-30-20';
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      await axios.put('http://localhost:5000/api/users/onboarding', {
        monthlyIncome: Number(income),
        budgetRule: finalRule
      }, config);
      
      // Update local storage
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.setItem('monthlyIncome', income);
      localStorage.setItem('budgetRule', finalRule);
      
      window.location.href = '/'; // Hard reload to update App.jsx state
    } catch (err) {
      console.error(err);
      alert('Error saving preferences');
      setLoading(false);
    }
  };

  const valIncome = Number(income) || 0;
  const needs = (valIncome * 0.5).toFixed(2);
  const wants = (valIncome * 0.3).toFixed(2);
  const savings = (valIncome * 0.2).toFixed(2);

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '80vh', padding: '2rem 0' }}>
      <div className="card max-w-2xl w-full animate-fade-in" style={{ padding: '2.5rem', position: 'relative' }}>
        
        {/* Progress indicator for walkthrough steps */}
        {step <= 3 && (
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                style={{ 
                  height: '6px', 
                  width: '2rem', 
                  borderRadius: '3px', 
                  background: step >= s ? 'var(--primary)' : 'var(--border-color)',
                  transition: 'background 0.3s ease'
                }} 
              />
            ))}
          </div>
        )}

        {/* Walkthrough Slides */}
        {step === 1 && (
          <div className="text-center animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Target size={40} />
              </div>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Welcome to BudgetApp!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Take control of your finances. BudgetApp helps you track your expenses, manage your savings, and achieve your financial goals with ease.
            </p>
            <div className="flex justify-between items-center mt-8">
              <button onClick={handleSkip} className="btn" style={{ color: 'var(--text-muted)', background: 'transparent' }}>Skip</button>
              <button onClick={handleNext} className="btn btn-primary flex items-center gap-2">Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                <TrendingUp size={40} />
              </div>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Track & Categorize</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Log your daily transactions and watch as BudgetApp automatically categorizes them to give you clear insights into where your money is going.
            </p>
            <div className="flex justify-between items-center mt-8">
              <button onClick={handleBack} className="btn" style={{ color: 'var(--text-muted)', background: 'transparent' }}>Back</button>
              <button onClick={handleNext} className="btn btn-primary flex items-center gap-2">Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <ShieldCheck size={40} />
              </div>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>The 50/30/20 Rule</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              We suggest splitting your income: <strong>50%</strong> for Essentials, <strong>30%</strong> for Wants, and <strong>20%</strong> for Savings. This provides a reliable safety net!
            </p>
            <div className="flex justify-between items-center mt-8">
              <button onClick={handleBack} className="btn" style={{ color: 'var(--text-muted)', background: 'transparent' }}>Back</button>
              <button onClick={handleNext} className="btn btn-primary flex items-center gap-2">Get Started <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* Income Setup Form */}
        {step === 4 && (
          <form onSubmit={handleNext} className="animate-fade-in">
            <div className="text-center mb-6">
              <h2>Let's set up your budget!</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Enter your monthly income to get a suggested budget breakdown.
              </p>
            </div>
            
            <div className="form-group mt-6">
              <label className="form-label">What is your estimated total monthly income?</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ paddingLeft: '2.75rem', fontSize: '1.25rem' }}
                  placeholder="5000" 
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required 
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6" style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input 
                type="checkbox" 
                id="toggleRule"
                checked={use503020} 
                onChange={(e) => setUse503020(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="toggleRule" style={{ fontWeight: '500', cursor: 'pointer' }}>Use the 50/30/20 Budgeting Rule</label>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-8" style={{ padding: '1rem' }} disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Review Budget */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="text-center mb-4">
              <h2 style={{ marginBottom: '1rem' }}>The 50-30-20 Rule</h2>
              <p>Based on your income of <strong>${valIncome.toFixed(2)}</strong>, here is your suggested monthly budget:</p>
            </div>

            <div className="flex flex-col gap-4" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>50% Needs</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${needs}</span>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Essentials like rent, groceries, and utilities.</p>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: '600', color: '#f59e0b' }}>30% Wants</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${wants}</span>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Lifestyle choices like restaurants, hobbies, and gifts.</p>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: '600', color: '#3b82f6' }}>20% Savings</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${savings}</span>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Investments, emergency funds, and debt repayment.</p>
              </div>
            </div>

            <button 
              onClick={() => handleComplete('50-30-20')} 
              disabled={loading}
              className="btn btn-primary w-full flex justify-center items-center gap-2" 
              style={{ padding: '1rem' }}
            >
              <CheckCircle2 size={20} />
              {loading ? 'Saving...' : 'Accept & Continue to Dashboard'}
            </button>
            <button 
              onClick={() => setStep(4)} 
              className="btn btn-secondary w-full mt-4" 
            >
              Go Back
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
