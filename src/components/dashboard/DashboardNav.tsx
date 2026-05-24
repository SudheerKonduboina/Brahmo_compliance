'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ChevronDown, User } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'partner' | 'associate' | 'admin';
  name?: string;
}

interface DashboardNavProps {
  profile: UserProfile | null;
}

const DEMO_USERS = [
  { email: 'partner@brahmo.ai', password: 'Partner123!', name: 'Sarah (Partner)' },
  { email: 'priya@brahmo.ai', password: 'Associate123!', name: 'Priya (Associate)' },
  { email: 'rahul@brahmo.ai', password: 'Associate123!', name: 'Rahul (Associate)' },
  { email: 'sonia@brahmo.ai', password: 'Associate123!', name: 'Sonia (Associate)' },
];

export function DashboardNav({ profile }: DashboardNavProps) {
  const { signOut, switchUser } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      // AuthGate will handle redirect to /login
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSwitchUser = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await switchUser(email, password);
      setIsUserMenuOpen(false);
    } catch (err) {
      console.error('User switch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'partner':
        return 'bg-emerald-100 text-emerald-800';
      case 'associate':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and branding */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <span className="text-white font-bold">⚖️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">BRAHMO</h1>
              <p className="text-xs text-slate-500">Compliance Engine</p>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-6">
            {/* User info */}
            {profile && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {profile.name || profile.email}
                  </p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(profile.role)}`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>
            )}

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
              >
                <User className="w-5 h-5" />
                <ChevronDown className="w-4 h-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                      Switch User (Demo)
                    </p>
                    <div className="space-y-2">
                      {DEMO_USERS.map((user) => (
                        <button
                          key={user.email}
                          onClick={() => handleSwitchUser(user.email, user.password)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 text-left text-sm rounded hover:bg-slate-100 text-slate-700 transition disabled:opacity-50"
                        >
                          {user.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
