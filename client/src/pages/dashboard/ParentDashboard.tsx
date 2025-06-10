import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';

const ParentDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  // Fetch children data
  const { data: children } = useQuery<any[]>({
    queryKey: ['/api/parent/children'],
  });
  
  // Fetch test results
  const { data: testResults } = useQuery<any[]>({
    queryKey: ['/api/parent/test-results'],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ota-ona paneli</h1>
              <p className="text-sm sm:text-base text-gray-600">Xush kelibsiz, {user?.fullName}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm"
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* 4 Main Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* 1. Profil */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 sm:w-12 sm:h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-base font-semibold mb-2">Profil</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">Shaxsiy ma'lumotlaringizni boshqaring</p>
            <Link href="/parent/profile">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 py-3 sm:py-2 text-base sm:text-sm">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 2. Farzandlarim */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 sm:w-12 sm:h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-base font-semibold mb-2">Farzandlarim</h3>
            <p className="text-gray-600 text-sm mb-1">Jami: {children?.length || 0}</p>
            <p className="text-gray-500 text-xs mb-4">Farzandlarim haqida ma'lumot</p>
            <Link href="/parent/children">
              <Button className="w-full bg-green-600 hover:bg-green-700 py-3 sm:py-2 text-base sm:text-sm">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 3. Test natijalari */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 sm:w-12 sm:h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-base font-semibold mb-2">Test natijalari</h3>
            <p className="text-gray-600 text-sm mb-1">Jami: {testResults?.length || 0}</p>
            <p className="text-gray-500 text-xs mb-4">Farzandlarning test natijalari</p>
            <Link href="/parent/results">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 py-3 sm:py-2 text-base sm:text-sm">
                Ko'rish
              </Button>
            </Link>
          </div>

          {/* 4. Hisobotlar */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 sm:w-12 sm:h-12 bg-orange-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-base font-semibold mb-2">Hisobotlar</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">Oylik va yillik hisobotlar</p>
            <Link href="/parent/reports">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 py-3 sm:py-2 text-base sm:text-sm">
                Ko'rish
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-sm sm:text-xs">Jami farzandlar</p>
                <p className="text-2xl sm:text-xl font-bold text-gray-900">
                  {children?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-sm sm:text-xs">So'nggi test natijalari</p>
                <p className="text-2xl sm:text-xl font-bold text-gray-900">
                  {testResults?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-5 sm:h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-sm sm:text-xs">O'rtacha ko'rsatkichlar</p>
                <p className="text-2xl sm:text-xl font-bold text-gray-900">
                  {testResults && testResults.length > 0 ? 
                    Math.round(testResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / testResults.length) + '%' 
                    : '0%'
                  }
                </p>
              </div>
              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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

export default ParentDashboard;