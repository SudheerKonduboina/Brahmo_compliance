'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { DemoUser } from '@/lib/types';

interface UserSwitcherProps {
  onUserChange: (user: DemoUser) => void;
  currentUser: DemoUser;
}

export function UserSwitcher({ onUserChange, currentUser }: UserSwitcherProps) {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabaseBrowser
          .from('users')
          .select('id, name, role')
          .order('name');

        if (error) {
          console.error('Failed to fetch users:', error);
          return;
        }

        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-sm text-slate-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
      <label htmlFor="user-select" className="text-sm font-medium text-slate-700">Demo User:</label>
      <select
        id="user-select"
        value={currentUser.id}
        onChange={(e) => {
          const user = users.find(u => u.id === e.target.value);
          if (user) {
            onUserChange(user);
          }
        }}
        className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Select demo user"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
      <div className="ml-auto text-xs text-slate-600">
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full" aria-label={`Current role: ${currentUser.role}`}>
          {currentUser.role}
        </span>
      </div>
    </div>
  );
}
