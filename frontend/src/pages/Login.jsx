import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { login } = useApp();
  const [viewMode, setViewMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // for registration
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (viewMode === 'forgot') {
        const { data } = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
        setSuccessMessage(data.message);
        setViewMode('reset');
        return;
      }

      if (viewMode === 'reset') {
        await axios.post('http://localhost:5000/api/auth/reset-password', { email, token: resetToken, newPassword });
        setSuccessMessage('Password reset successfully! You can now sign in.');
        setViewMode('login');
        // Reset inputs
        setResetToken('');
        setNewPassword('');
        setPassword('');
        return;
      }

      const endpoint = viewMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = viewMode === 'login' ? { email, password } : { 
        firstName: name.split(' ')[0] || '', 
        lastName: name.split(' ').slice(1).join(' ') || 'User', 
        email, 
        password 
      };
      
      const { data } = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      const userObj = data.user || data;
      login(userObj);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Something went wrong');
    }
  };

  const getHeaderContent = () => {
    switch (viewMode) {
      case 'register':
        return {
          title: 'Create an account',
          subtitle: 'Start tracking your budget today.'
        };
      case 'forgot':
        return {
          title: 'Reset your password',
          subtitle: "Enter your email address and we'll send a 6-digit code."
        };
      case 'reset':
        return {
          title: 'Enter reset code',
          subtitle: 'Check the terminal or response code to complete the reset.'
        };
      case 'login':
      default:
        return {
          title: 'Welcome back',
          subtitle: 'Enter your details to access your dashboard.'
        };
    }
  };

  const { title, subtitle } = getHeaderContent();

  return (
    <div className="flex items-center justify-center animate-fade-in" style={{ minHeight: '80vh', padding: '1rem' }}>
      <div className="card max-w-md w-full" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
        <div className="text-center mb-4">
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#fff', fontSize: '2rem', fontWeight: 'bold',
            margin: '0 auto 1.5rem auto',
            boxShadow: 'var(--shadow-glow)'
          }}>
            B
          </div>
          <h2>{title}</h2>
          <p className="text-muted">{subtitle}</p>
        </div>

        {error && (
          <div className="text-danger mb-4 text-center animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="text-success mb-4 text-center animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--success)' }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {viewMode === 'register' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserPlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}
          
          {(viewMode === 'login' || viewMode === 'register' || viewMode === 'forgot') && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={viewMode === 'reset'}
                />
              </div>
            </div>
          )}

          {viewMode === 'reset' && (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Reset Code</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="123456" 
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required 
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-input" 
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} style={{ pointerEvents: 'none' }} /> : <Eye size={18} style={{ pointerEvents: 'none' }} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(viewMode === 'login' || viewMode === 'register') && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {viewMode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setViewMode('forgot'); setError(''); setSuccessMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full mt-6" style={{ padding: '1rem' }}>
            {viewMode === 'login' && (
              <>
                <LogIn size={20} /> Sign In
              </>
            )}
            {viewMode === 'register' && (
              <>
                <UserPlus size={20} /> Sign Up
              </>
            )}
            {viewMode === 'forgot' && 'Send Reset Code'}
            {viewMode === 'reset' && 'Reset Password'}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '0.875rem' }}>
            {viewMode === 'login' && (
              <>
                Don't have an account?{' '}
                <button 
                  onClick={() => { setViewMode('register'); setError(''); setSuccessMessage(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
                >
                  Sign up
                </button>
              </>
            )}
            {viewMode === 'register' && (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => { setViewMode('login'); setError(''); setSuccessMessage(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
                >
                  Sign in
                </button>
              </>
            )}
            {viewMode === 'forgot' && (
              <button 
                onClick={() => { setViewMode('login'); setError(''); setSuccessMessage(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
              >
                Back to Login
              </button>
            )}
            {viewMode === 'reset' && (
              <button 
                onClick={() => { setViewMode('login'); setError(''); setSuccessMessage(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel and Login
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
