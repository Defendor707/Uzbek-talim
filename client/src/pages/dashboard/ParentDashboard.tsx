import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import ParentWidgets from '@/components/dashboard/ParentWidgets';

const ParentDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch children data
  const { data: children } = useQuery<any[]>({
    queryKey: ['/api/parent/children'],
  });
  
  // Fetch test results
  const { data: testResults } = useQuery<any[]>({
    queryKey: ['/api/parent/test-results'],
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
      href: '/dashboard/parent',
    },
    {
      id: 'children',
      title: 'Farzandlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/parent/children',
      badge: children?.length || 0
    },
    {
      id: 'results',
      title: 'Natijalar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/parent/test-results',
      badge: testResults?.length || 0
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole="parent" 
      sections={dashboardSections}
      currentPage="Ota-ona paneli"
    >
      <ParentWidgets />
    </ResponsiveDashboard>
  );
};

export default ParentDashboard;