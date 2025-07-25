import React, { useState } from 'react';
import { auth } from './services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ICONS } from './constants';

const Login: React.FC = () => {
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
      await signInWithEmailAndPassword(auth, email, password);
      setFailedAttempts(0); // Reset on success
      // onAuthStateChanged in App.tsx will handle the rest.
    } catch (err) {
      setFailedAttempts(prev => prev + 1);
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const authError = err as { code: string };
        switch (authError.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
             setError("Invalid credentials. Please check your details and try again.");
            break;
          case 'auth/wrong-password':
            setError("Incorrect password. Please try again.");
            break;
          default:
            setError("An error occurred. Please try again.");
            console.error(err);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error(err);
      }
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
          {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}
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
      </div>
    </div>
  );
};

export default Login;