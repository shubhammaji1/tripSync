import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
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
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mb-16 md:mb-0">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© {new Date().getFullYear()} TripSync. Open source under Apache-2.0 License.</p>
                <p className="flex items-center gap-3">
                  <span>Next.js 16</span>
                  <span>•</span>
                  <span>NestJS 11</span>
                  <span>•</span>
                  <span>Supabase Postgres</span>
                  <span>•</span>
                  <span>Drizzle ORM</span>
                </p>
              </div>
            </footer>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}