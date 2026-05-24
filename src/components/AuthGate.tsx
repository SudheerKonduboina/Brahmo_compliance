'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '4px solid #ddd',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, authInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authInitialized) return;

    if (!user && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    if (user && (pathname === '/' || pathname === '/login')) {
      router.replace('/dashboard');
      return;
    }
  }, [authInitialized, user, pathname, router]);

  if (!authInitialized) {
    return <Loading message="Initializing..." />;
  }

  return <>{children}</>;
}