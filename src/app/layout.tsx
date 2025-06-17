// src/app/layout.tsx
'use client';

import { AppHeader } from '@/app/components/header';
import SessionProviderWrapper from '@/app/components/SessionProviderWrapper';
import { LanguageProvider } from '@/context/languageContext';
import { usePathname } from 'next/navigation';
import React from 'react';
import './styles/globals.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ['/pages/login', '/pages/register'];
  const isAuthPage = publicRoutes.includes(pathname);

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <LanguageProvider>
  <SessionProviderWrapper>
    {!isAuthPage && <AppHeader />}
    <main className="min-h-screen">{children}</main>
  </SessionProviderWrapper>
</LanguageProvider>
      </body>
    </html>
  );
}