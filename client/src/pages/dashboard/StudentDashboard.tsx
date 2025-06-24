import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import StudentWidgets from '@/components/dashboard/StudentWidgets';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch tests
  const { data: tests } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });
  
  // Fetch attempts
  const { data: attempts } = useQuery<any[]>({
    queryKey: ['/api/student/attempts'],
  });
  
  // Fetch lessons
  const { data: lessons } = useQuery<any[]>({
    queryKey: ['/api/lessons'],
  });

  // Dashboard sections for bottom navigation - only 4 main items
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/student',
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/student/tests',
      badge: tests?.length || 0
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/student/lessons',
      badge: lessons?.length || 0
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole="student" 
      sections={dashboardSections}
      currentPage="O'quvchi paneli"
    >
      <StudentWidgets />
    </ResponsiveDashboard>
  );
};

export default StudentDashboard;