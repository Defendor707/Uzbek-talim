import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ImprovedDashboard from '@/components/dashboard/ImprovedDashboard';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">O'quvchi paneli</h1>
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
            <Link href="/student/profile">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 2. Testlar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Testlar</h3>
            <p className="text-gray-600 text-sm mb-1">Mavjud: {tests?.length || 0}</p>
            <p className="text-gray-500 text-xs mb-4">Test ishlash va natijalar</p>
            <Link href="/student/tests">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 3. Darsliklar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Darsliklar</h3>
            <p className="text-gray-600 text-sm mb-1">Mavjud: {lessons?.length || 0}</p>
            <p className="text-gray-500 text-xs mb-4">Darsliklarni o'qish va o'rganish</p>
            <Link href="/student/lessons">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 4. Natijalar */}
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Natijalar</h3>
            <p className="text-gray-600 text-sm mb-4">Test natijalari va statistikalar</p>
            <Link href="/student/results">
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
                <p className="text-gray-600 text-sm">Bajarilgan testlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attempts?.filter(a => a.status === 'completed').length || 0}
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
                <p className="text-gray-600 text-sm">O'qilgan darsliklar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons?.length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">O'rtacha ball</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attempts && attempts.length > 0 ? 
                    Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) + '%' 
                    : '0%'
                  }
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;