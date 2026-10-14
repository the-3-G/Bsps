import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DAppClientLayout } from '../components/DAppClientLayout';

export const metadata: Metadata = {
  title: 'BSP — Blockchain Savings Portal',
  description: 'BSP is a decentralized digital asset savings and information portal built on Web3 technology.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-section-navy m-0 p-0 text-white flex flex-col antialiased">
        <DAppClientLayout>{children}</DAppClientLayout>
      </body>
    </html>
  );
}
