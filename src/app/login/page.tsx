'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

const DEMO_USERS = [
  { email: 'partner@brahmo.ai', password: 'Partner123!', name: 'Sarah (Partner)', role: 'partner' },
  { email: 'priya@brahmo.ai', password: 'Associate123!', name: 'Priya (Associate)', role: 'associate' },
  { email: 'rahul@brahmo.ai', password: 'Associate123!', name: 'Rahul (Associate)', role: 'associate' },
  { email: 'sonia@brahmo.ai', password: 'Associate123!', name: 'Sonia (Associate)', role: 'associate' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      console.log('[LOGIN] Login success - AuthContext will handle routing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(demoEmail, demoPassword);
      console.log('[LOGIN] Demo login success - AuthContext will handle routing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(68,68,68,.05)_25%,rgba(68,68,68,.05)_26%,transparent_27%,transparent_74%,rgba(68,68,68,.05)_75%,rgba(68,68,68,.05)_76%,transparent_77%,transparent)] bg-[length:60px_60px]" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo and branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 mx-auto">
            <span className="text-white font-bold text-lg">⚖️</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">BRAHMO</h1>
          <p className="text-slate-400 text-sm font-medium">Compliance Engine</p>
          <p className="text-slate-500 text-xs mt-2">Legal AI Governance & Risk Management</p>
        </div>

        {/* Main login card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl mb-6">
          {/* Error message */}
          {error && (
            <div className="mb-6 flex items-gap-3 p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@firm.com"
                disabled={isLoading}
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-slate-800 text-slate-400">Demo Users</span>
            </div>
          </div>

          {/* Demo user buttons */}
          <div className="space-y-2">
            {DEMO_USERS.map((demoUser) => (
              <button
                key={demoUser.email}
                onClick={() => handleDemoLogin(demoUser.email, demoUser.password)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-100 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
              >
                <span>{demoUser.name}</span>
                <span className="text-xs text-slate-400 group-hover:text-slate-300">
                  {demoUser.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-emerald-400">🔒 Secured by:</span> Supabase Auth + PostgreSQL RLS
          </p>
        </div>
      </div>
    </div>
  );
}
