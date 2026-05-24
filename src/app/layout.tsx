import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/lib/toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGate } from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'BRAHMO Compliance Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}