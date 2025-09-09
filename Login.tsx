import type React from 'react';
import { useState } from 'react';
import './LoginPanel.css';
import { authService } from './frontend/services/authService';
import type { UserProfile } from './types';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>(
    'connected' // OPTIMIZATION: Assume connected initially for faster login
  );
  const MAX_ATTEMPTS = 3;

  // OPTIMIZATION: Removed initial backend connection test for faster login
  // Connection will be tested implicitly during login attempt

  const retryConnection = async () => {
    setBackendStatus('checking');
    setError(null);
    try {
      // Clear the connection cache to force a fresh test
      authService.clearConnectionCache();
      const isConnected = await authService.testBackendConnection();
      setBackendStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Retry connection failed:', error);
      setBackendStatus('disconnected');
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      // OPTIMIZATION: Skip preemptive connection test, let login attempt handle connectivity
      const response = await authService.login({ email: email.trim(), password });
      if (response.success && response.user) {
        setFailedAttempts(0);
        setBackendStatus('connected');
        localStorage.setItem('skillup_user', JSON.stringify(response.user));
        onLoginSuccess(response.user);
      } else {
        setFailedAttempts((prev) => prev + 1);
        // Check if error is due to connectivity
        if (response.message.includes('Network error') || response.message.includes('timeout')) {
          setBackendStatus('disconnected');
        }
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: unknown) {
      setFailedAttempts((prev) => prev + 1);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
          setBackendStatus('disconnected');
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
          setBackendStatus('disconnected');
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Backend status indicators and error messages - positioned outside the panel */}
      {backendStatus === 'checking' && (
        <div className="login-status checking">Checking server connection...</div>
      )}
      {backendStatus === 'disconnected' && (
        <div className="login-status disconnected">
          ⚠️ Server connection failed. Please check your internet connection.
          <button
            type="button"
            onClick={retryConnection}
            className="retry-connection-btn"
            aria-label="Retry server connection"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Error message positioned outside the panel */}
      {error && (
        <div className="login-error login-error-outside" role="alert">
          {error}
        </div>
      )}

      <div className="login-panel">
        <div className="login-logo-wrap">
          <img src="/logo-skillup.png" alt="Skillup Center Logo" className="login-logo" />
        </div>

        <form className="login-form" onSubmit={handleAuthAction} autoComplete="on">
          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="login-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password" className="login-label">
            Password
          </label>
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
          {failedAttempts >= MAX_ATTEMPTS ? (
            <div className="login-error login-lockout">
              Too many failed login attempts.
              <br />
              Please contact the administrator.
              <br />
              <button
                type="button"
                className="login-btn"
                onClick={() => setFailedAttempts(0)}
                aria-label="Try logging in again after too many failed attempts"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="login-btn"
              disabled={
                isLoading || failedAttempts >= MAX_ATTEMPTS || backendStatus === 'disconnected'
              }
              aria-label="Sign in to SkillUp Center"
            >
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
