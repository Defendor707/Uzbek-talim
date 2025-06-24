import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import CenterWidgets from '@/components/dashboard/CenterWidgets';

const CenterDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch teachers data
  const { data: teachers } = useQuery<any[]>({
    queryKey: ['/api/center/teachers'],
    queryFn: () => Promise.resolve([]) // Placeholder
  });
  
  // Fetch students data  
  const { data: students } = useQuery<any[]>({
    queryKey: ['/api/center/students'],
    queryFn: () => Promise.resolve([]) // Placeholder
  });

  // Dashboard sections for bottom navigation - only 3 main items
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/center',
    },
    {
      id: 'teachers',
      title: 'O\'qituvchilar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/center/teachers',
      badge: teachers?.length || 0
    },
    {
      id: 'students',
      title: 'O\'quvchilar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: '/center/students',
      badge: students?.length || 0
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole="center" 
      sections={dashboardSections}
      currentPage="O'quv markaz paneli"
    >
      <CenterWidgets />
    </ResponsiveDashboard>
  );
};

export default CenterDashboard;