import React, { useState } from 'react';
import './LoginPanel.css';
import { authService } from './frontend/services/authService';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.user) {
        setFailedAttempts(0);
        localStorage.setItem('skillup_user', JSON.stringify(response.user));
        onLoginSuccess(response.user);
      } else {
        setFailedAttempts(prev => prev + 1);
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setFailedAttempts(prev => prev + 1);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-panel">
        <div className="login-logo-wrap">
          <img src="/logo-skillup.png" alt="Skillup Center Logo" className="login-logo" />
        </div>
        <form className="login-form" onSubmit={handleAuthAction} autoComplete="on">
          <label htmlFor="email" className="login-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="login-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <label htmlFor="password" className="login-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="login-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="login-error" role="alert">{error}</div>}
          {failedAttempts >= MAX_ATTEMPTS ? (
            <div className="login-error login-lockout">
              Too many failed login attempts.<br />Please contact the administrator.<br />
              <button type="button" className="login-btn" onClick={() => setFailedAttempts(0)} aria-label="Try logging in again after too many failed attempts">Try Again</button>
            </div>
          ) : (
            <button type="submit" className="login-btn" disabled={isLoading || failedAttempts >= MAX_ATTEMPTS} aria-label="Sign in to SkillUp Center">
              {isLoading ? 'Processing...' : 'Sign In'}
            </button>
          )}
        </form>
        <div className="login-footer">SkillUp Center &copy; {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

export default Login;