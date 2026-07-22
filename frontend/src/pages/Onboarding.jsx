import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CheckCircle2, Target, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

const Onboarding = () => {
  const { token, updateUser } = useApp();
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('');
  const [budgetStrategy, setBudgetStrategy] = useState('50-30-20');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = (e) => {
    e?.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      if (income && Number(income) > 0) {
        if (budgetStrategy === 'custom') {
          handleComplete('custom');
        } else {
          setStep(5);
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
    const finalRule = ruleOverride === 'custom' ? 'custom' : budgetStrategy;
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.put(`${API_BASE_URL}/api/users/onboarding`, {
        monthlyIncome: Number(income),
        budgetRule: finalRule
      }, config);
      
      updateUser({
        onboardingCompleted: true,
        monthlyIncome: Number(income),
        budgetRule: finalRule
      });
      
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error saving preferences');
      setLoading(false);
    }
  };

  const valIncome = Number(income) || 0;
  
  // Dynamic percentages based on strategy
  let needsPct = 0.5, wantsPct = 0.3, savingsPct = 0.2;
  if (budgetStrategy === '40-20-40') {
    needsPct = 0.4;
    wantsPct = 0.2;
    savingsPct = 0.4;
  }
  
  const needs = (valIncome * needsPct).toFixed(2);
  const wants = (valIncome * wantsPct).toFixed(2);
  const savings = (valIncome * savingsPct).toFixed(2);

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

            <div className="flex flex-col gap-3 mt-6">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>Choose your budgeting strategy:</label>
              
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${budgetStrategy === '50-30-20' ? 'bg-primary/10 border-primary' : 'bg-surface border-border'}`}
                style={{ border: `1px solid ${budgetStrategy === '50-30-20' ? 'var(--primary)' : 'var(--border-color)'}`, background: budgetStrategy === '50-30-20' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-surface)' }}
                onClick={() => setBudgetStrategy('50-30-20')}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block' }}>The Balanced Approach (50/30/20)</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Standard safety net. Great for most people.</span>
                </div>
                {budgetStrategy === '50-30-20' && <CheckCircle2 color="var(--primary)" />}
              </div>

              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${budgetStrategy === '40-20-40' ? 'bg-primary/10 border-primary' : 'bg-surface border-border'}`}
                style={{ border: `1px solid ${budgetStrategy === '40-20-40' ? 'var(--primary)' : 'var(--border-color)'}`, background: budgetStrategy === '40-20-40' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-surface)' }}
                onClick={() => setBudgetStrategy('40-20-40')}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block' }}>The Aggressive Saver (40/20/40)</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Prioritizes heavy saving (FIRE movement, debt payoff).</span>
                </div>
                {budgetStrategy === '40-20-40' && <CheckCircle2 color="var(--primary)" />}
              </div>

              <div 
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${budgetStrategy === 'custom' ? 'bg-primary/10 border-primary' : 'bg-surface border-border'}`}
                style={{ border: `1px solid ${budgetStrategy === 'custom' ? 'var(--primary)' : 'var(--border-color)'}`, background: budgetStrategy === 'custom' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-surface)' }}
                onClick={() => setBudgetStrategy('custom')}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <strong style={{ display: 'block' }}>Custom / Minimalist</strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No strict percentages. Line-by-line budgeting.</span>
                </div>
                {budgetStrategy === 'custom' && <CheckCircle2 color="var(--primary)" />}
              </div>
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
              <h2 style={{ marginBottom: '1rem' }}>The {budgetStrategy === '40-20-40' ? '40/20/40' : '50/30/20'} Rule</h2>
              <p>Based on your income of <strong>${valIncome.toFixed(2)}</strong>, here is your suggested monthly budget:</p>
            </div>

            <div className="flex flex-col gap-4" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>{needsPct * 100}% Needs</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${needs}</span>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Essentials like rent, groceries, and utilities.</p>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: '600', color: '#f59e0b' }}>{wantsPct * 100}% Wants</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${wants}</span>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Lifestyle choices like restaurants, hobbies, and gifts.</p>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: '600', color: '#3b82f6' }}>{savingsPct * 100}% Savings</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${savings}</span>
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Investments, emergency funds, and debt repayment.</p>
              </div>
            </div>

            <button 
              onClick={() => handleComplete(budgetStrategy)} 
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
