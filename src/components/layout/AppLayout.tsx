import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { UserRole } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export function AppLayout({ children, requiredRoles }: AppLayoutProps) {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasPermission(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-64">
        <div className="p-6 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
