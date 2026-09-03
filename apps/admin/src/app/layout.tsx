import type { Metadata } from 'next';
import './globals.css';
import { AdminShell } from '../components/AdminShell';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Authorized administrative management portal.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col m-0 p-0 overflow-hidden">
        <AuthProvider>
          <ErrorBoundary>
            <AdminShell>{children}</AdminShell>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
