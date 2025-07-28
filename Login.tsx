import React, { useState } from 'react';
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src="/logo-skillup.png" alt="Skillup Center Logo" className="h-28 w-auto object-contain" />
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-[#307637] focus:border-[#307637] focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-[#307637] focus:border-[#307637] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center pt-2" role="alert">{error}</p>}
          {failedAttempts >= MAX_ATTEMPTS ? (
            <div className="text-red-600 text-center font-semibold py-4">
              Too many failed login attempts. Please contact the administrator for help.<br/>
              <button className="mt-4 bg-[#307637] text-white px-4 py-2 rounded" onClick={() => setFailedAttempts(0)}>Try Again</button>
            </div>
          ) : (
            <button type="submit" disabled={isLoading || failedAttempts >= MAX_ATTEMPTS} className="group relative w-full flex justify-center py-3 px-4 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#307637] hover:bg-[#245929] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#307637] disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
              {isLoading ? 'Processing...' : 'Sign In'}
            </button>
          )}
        </form>
        {(import.meta as any).env?.DEV && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Admin:</strong> skillup-admin@teacher.skillup / Skillup@123</div>
              <div><strong>Teacher:</strong> teacher-jenny@teacher.skillup / Skillup@123</div>
              <div><strong>Student 1:</strong> student-alice@student.skillup / Skillup123</div>
              <div><strong>Student 2:</strong> student-bob@student.skillup / Skillup123</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;