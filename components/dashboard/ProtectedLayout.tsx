"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedLayout({
  children,
  allowedRoles = ["patient", "doctor", "admin"],
}: ProtectedLayoutProps) {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!profile || !allowedRoles.includes(profile.role)) {
      router.replace("/login");
    }
  }, [allowedRoles, isLoading, profile, router]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  if (!allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
