import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredOrgType?: string;
  requiredRole?: string[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredOrgType,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { session, organization, orgUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading..." />;
  }

  if (!session) {
    return fallback || null;
  }

  if (requiredOrgType && organization?.type !== requiredOrgType) {
    return fallback || null;
  }

  if (requiredRole && orgUser && !requiredRole.includes(orgUser.role)) {
    return fallback || null;
  }

  return <>{children}</>;
}
