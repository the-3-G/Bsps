import type { Metadata } from 'next';
import './globals.css';
import { AdminShell } from '../components/AdminShell';

import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'Cryptocurrency Administration Dashboard',
  description: 'Authorized administrative management portal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col m-0 p-0 overflow-hidden">
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </body>
    </html>
  );
}
