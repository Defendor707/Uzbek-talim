import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  // Fetch lessons
  const { data: lessons } = useQuery<any[]>({
    queryKey: ['/api/lessons'],
  });
  
  // Fetch tests
  const { data: tests } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });
  
  // Fetch teacher profile
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile/teacher'],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ustoz paneli</h1>
              <p className="text-gray-600">Xush kelibsiz, {user?.fullName}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Chiqish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tizimdan chiqish</AlertDialogTitle>
                  <AlertDialogDescription>
                    Haqiqatan ham tizimdan chiqishni xohlaysizmi? Barcha ochilgan sahifalar yopiladi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction onClick={logout} className="bg-red-600 hover:bg-red-700">
                    Ha, chiqish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 4 Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* 1. Profil */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Profil</h3>
            <p className="text-gray-600 text-sm mb-4">Shaxsiy ma'lumotlaringizni boshqaring</p>
            <Link href="/teacher/profile">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 2. Darsliklar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Darsliklar</h3>
            <p className="text-gray-600 text-sm mb-1">Jami: {lessons?.length || 0}</p>
            <p className="text-gray-500 text-xs mb-4">Darslik yarating va boshqaring</p>
            <Link href="/teacher/lessons">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 3. Testlar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Testlar</h3>
            <p className="text-gray-600 text-sm mb-1">Jami: {tests?.length || 0}</p>
            <p className="text-gray-500 text-xs mb-4">Test yarating va boshqaring</p>
            <div className="space-y-2">
              <Link href="/teacher/tests" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Ko'rish
                </Button>
              </Link>
              <Link href="/teacher/test-types" className="block">
                <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50">
                  Yangi test yaratish
                </Button>
              </Link>
            </div>
          </div>

          {/* 4. Boshqalar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Boshqalar</h3>
            <p className="text-gray-600 text-sm mb-4">O'quvchilar va qo'shimcha funksiyalar</p>
            <Link href="/teacher/other">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Ko'rish
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Faol darsliklar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.filter(l => l.status === 'active').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Faol testlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests?.filter(t => t.status === 'active').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Profil holati</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile ? 'To\'liq' : 'Bo\'sh'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
