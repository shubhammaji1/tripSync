import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { MountainOfflineSentinel } from '@/components/MountainOfflineSentinel';
import { AuthProvider } from '@/lib/auth-context';
import { ApiAuthBridge } from '@/components/ApiAuthBridge';

export const metadata: Metadata = {
  title: 'TripSync — Collaborative Group Travel Platform',
  description: 'Plan together. Travel smarter. Stay connected. The modern platform for group trips.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TripSync',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-brand-500 selection:text-white">
        <ClerkProvider>
          <AuthProvider>
            <ApiAuthBridge />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <PWAInstallPrompt />
            <MountainOfflineSentinel />
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}