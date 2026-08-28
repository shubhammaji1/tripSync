import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/auth-context';
import { ApiAuthBridge } from '@/components/ApiAuthBridge';

export const metadata: Metadata = {
  title: 'TripSync — Collaborative Group Travel Platform',
  description: 'Plan together. Travel smarter. Stay connected. The modern operating system for group trips.',
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
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}