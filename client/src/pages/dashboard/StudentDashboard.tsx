import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StatsRow from '@/components/shared/Stats';
import TestCard from '@/components/student/TestCard';
import ProgressStats from '@/components/student/ProgressStats';
import { useToast } from '@/hooks/use-toast';

// Types
interface Test {
  id: number;
  title: string;
  description?: string;
  type: string;
  duration: number;
  totalQuestions: number;
  grade: string;
  classroom?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  teacherId: number;
}

interface Teacher {
  id: number;
  fullName: string;
}

interface TestAttempt {
  id: number;
  testId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  totalCorrect?: number;
  totalQuestions: number;
  status: string;
}

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch tests
  const { data: tests, isLoading: isLoadingTests } = useQuery<Test[]>({
    queryKey: ['/api/tests'],
  });
  
  // Fetch teachers
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['/api/users', { role: 'teacher' }],
  });
  
  // Fetch attempts
  const { data: attempts, isLoading: isLoadingAttempts } = useQuery<TestAttempt[]>({
    queryKey: ['/api/student/attempts'],
  });
  
  // Stats data
  const statsData = [
    {
      title: 'Bajarilgan testlar',
      value: attempts?.filter(a => a.status === 'completed').length || 0,
      icon: 'fact_check',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-primary',
      trend: {
        value: '+2',
        label: 'Bu hafta bajarilgan',
        isPositive: true,
      },
      progressValue: 70,
    },
    {
      title: 'O\'rtacha natija',
      value: '87%',
      icon: 'grade',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-secondary',
      trend: {
        value: '+5%',
        label: 'Yaxshilanish',
        isPositive: true,
      },
      progressValue: 87,
      progressColor: 'bg-secondary',
    },
    {
      title: 'Darsliklar',
      value: 12,
      icon: 'menu_book',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-accent',
      trend: {
        value: '2 yangi',
        label: 'Bu hafta qo\'shilgan',
        isNeutral: true,
      },
      progressValue: 30,
      progressColor: 'bg-accent',
    },
  ];
  
  // Progress stats data
  const progressItems = [
    { subject: 'Algebra', percentage: 85 },
    { subject: 'Geometriya', percentage: 72 },
    { subject: 'Fizika', percentage: 68 },
    { subject: 'Kimyo', percentage: 60, status: 'warning' as const },
    { subject: 'Ona tili', percentage: 90, status: 'success' as const },
  ];
  
  // Recent results data
  const recentResults = [
    {
      id: 1,
      title: 'Kvadrat tenglamalar',
      correct: 17,
      total: 20,
      percentage: 85,
      type: 'primary' as const,
    },
    {
      id: 2,
      title: 'So\'z yasalishi',
      correct: 23,
      total: 25,
      percentage: 92,
      type: 'secondary' as const,
    },
    {
      id: 3,
      title: 'Kimyoviy reaksiyalar',
      correct: 14,
      total: 20,
      percentage: 70,
      type: 'accent' as const,
    },
  ];
  
  const handleStartTest = (testId: number) => {
    toast({
      title: 'Test boshlanmoqda',
      description: 'Test sahifasiga yo\'naltirilmoqdasiz',
    });
    window.location.href = `/student/tests/${testId}`;
  };
  
  // Calculate days left for a test
  const getDaysLeft = (endDate?: string): number | undefined => {
    if (!endDate) return undefined;
    
    const end = new Date(endDate);
    const today = new Date();
    
    // Reset hours to compare dates only
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : undefined;
  };
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number): string => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.fullName || 'O\'qituvchi';
  };
  
  return (
    <DashboardLayout title="O'quvchi paneli">
      {/* Stats Row */}
      <StatsRow stats={statsData} />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tests */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg card-shadow">
            <div className="p-4 border-b border-neutral-ultralight flex justify-between items-center">
              <h2 className="text-lg font-heading font-medium text-neutral-dark">Yaqinlashayotgan testlar</h2>
              <Link href="/student/tests">
                <a className="text-sm text-primary hover:text-primary-dark">
                  Barchasini ko'rish
                </a>
              </Link>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {isLoadingTests ? (
                  <div className="flex justify-center items-center p-10">
                    <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
                    <span>Testlar yuklanmoqda...</span>
                  </div>
                ) : tests && tests.length > 0 ? (
                  tests
                    .filter(test => test.status === 'active')
                    .slice(0, 3)
                    .map(test => (
                      <TestCard
                        key={test.id}
                        id={test.id}
                        title={test.title}
                        subject={test.description}
                        grade={test.grade}
                        classroom={test.classroom}
                        teacherName={getTeacherName(test.teacherId)}
                        questionCount={test.totalQuestions}
                        duration={test.duration}
                        daysLeft={getDaysLeft(test.endDate)}
                        isActive={test.status === 'active'}
                        onStartTest={handleStartTest}
                      />
                    ))
                ) : (
                  <div className="text-center p-10 text-neutral-medium">
                    <span className="material-icons text-4xl mb-2">info</span>
                    <p>Hozircha faol testlar yo'q</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Stats */}
        <div>
          <ProgressStats 
            progressItems={progressItems}
            recentResults={recentResults}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
