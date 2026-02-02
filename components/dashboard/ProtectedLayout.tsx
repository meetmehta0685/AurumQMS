'use client';

import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedLayout({ children, allowedRoles = ['patient', 'doctor', 'admin'] }: ProtectedLayoutProps) {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    redirect('/login');
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect('/login');
  }

  return <>{children}</>;
}
