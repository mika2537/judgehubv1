// src/app/DashboardRedirect.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardRedirectProps {
  status: string;
}

const DashboardRedirect: React.FC<DashboardRedirectProps> = ({ status }) => {
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/pages/login');
    }
  }, [status, router]);

  return null;
};

export default DashboardRedirect;