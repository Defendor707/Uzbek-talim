import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';

// Types
interface Lesson {
  id: number;
  title: string;
  description?: string;
  grade: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Schedule {
  id: number;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId?: number;
  subjectName?: string;
}

interface CalendarEvent {
  date: Date;
  type: 'primary' | 'secondary' | 'accent';
}

interface ScheduleItem {
  time: string;
  title: string;
  subtitle: string;
  type: 'primary' | 'secondary' | 'accent';
}

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch lessons
  const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });
  
  // Fetch tests
  const { data: tests, isLoading: isLoadingTests } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });
  
  // Fetch teacher profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery<any>({
    queryKey: ['/api/profile/teacher'],
  });
  return (
    <DashboardLayout title="Ustoz paneli">
      {/* Main Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Profil Bo'limi */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <CardTitle className="text-lg font-semibold">Profil</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm mb-4">Shaxsiy ma'lumotlaringizni ko'ring va tahrirlang</p>
            <Link href="/teacher/profile">
              <Button className="w-full">
                Profilni ko'rish
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Darsliklar Bo'limi */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <CardTitle className="text-lg font-semibold">Darsliklar</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm mb-2">Jami darsliklar: <span className="font-semibold">{lessons?.length || 0}</span></p>
            <p className="text-gray-500 text-xs mb-4">Darslik yarating va boshqaring</p>
            <Link href="/teacher/lessons">
              <Button className="w-full">
                Darsliklarni ko'rish
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Testlar Bo'limi */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <CardTitle className="text-lg font-semibold">Testlar</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm mb-2">Jami testlar: <span className="font-semibold">{tests?.length || 0}</span></p>
            <p className="text-gray-500 text-xs mb-4">Test yarating va boshqaring</p>
            <Link href="/teacher/tests">
              <Button className="w-full">
                Testlarni ko'rish
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Boshqalar Bo'limi */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <CardTitle className="text-lg font-semibold">Boshqalar</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm mb-4">O'quvchilar, qidiruv va boshqa funksiyalar</p>
            <Link href="/teacher/other">
              <Button className="w-full">
                Boshqalarni ko'rish
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Faol darsliklar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.filter(l => l.status === 'active').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Faol testlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests?.filter(t => t.status === 'active').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Profil to'ldirilganligi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile ? '100%' : '0%'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
