'use client';

import { AppHeader } from '@/app/components/header';
import SessionProviderWrapper from '@/app/components/SessionProviderWrapper';
import { LanguageProvider } from '@/context/languageContext';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/app/components/ThemeProvider';
import React from 'react';
import './styles/globals.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/pages/login', '/pages/register'];
  const isAuthPage = publicRoutes.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <SessionProviderWrapper>
              {!isAuthPage && <AppHeader />}
              <main className="min-h-screen">{children}</main>
            </SessionProviderWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}