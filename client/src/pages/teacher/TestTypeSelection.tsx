import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';

const TestTypeSelection: React.FC = () => {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const testTypes = [
    {
      id: 'simple',
      title: 'Oddiy test',
      description: 'Standart test yaratish - rasmlar va savollar bilan',
      available: true,
      route: '/teacher/create-test'
    },
    {
      id: 'dtm',
      title: 'DTM test',
      description: 'Davlat test markazi uslubidagi test',
      available: false,
      route: '#'
    },
    {
      id: 'certificate',
      title: 'Sertifikat test',
      description: 'Sertifikat olish uchun mo\'ljallangan test',
      available: false,
      route: '#'
    },
    {
      id: 'open',
      title: 'Ochiq test',
      description: 'Hamma uchun ochiq bo\'lgan test',
      available: false,
      route: '#'
    },
    {
      id: 'disciplinary',
      title: 'Intizomli test',
      description: 'Vaqt cheklovi va qat\'iy qoidalar bilan',
      available: false,
      route: '#'
    }
  ];

  const handleTestTypeSelect = (testType: any) => {
    if (testType.available) {
      setLocation(testType.route);
    }
  };

  // Dashboard sections for navigation
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/teacher',
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/teacher/lessons',
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/teacher/tests'
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole="teacher" 
      sections={dashboardSections}
      currentPage="Test turi tanlash"
    >

      {/* Test Types Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testTypes.map((testType) => (
            <Card 
              key={testType.id} 
              className={`cursor-pointer transition-all duration-200 ${
                testType.available 
                  ? 'hover:shadow-md hover:scale-105 border-blue-200' 
                  : 'opacity-60 cursor-not-allowed bg-gray-50'
              }`}
              onClick={() => handleTestTypeSelect(testType)}
            >
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${testType.available ? 'text-blue-600' : 'text-gray-500'}`}>
                  {testType.title}
                  {testType.available && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Mavjud
                    </span>
                  )}
                  {!testType.available && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Tez orada
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-600 leading-relaxed">
                  {testType.description}
                </CardDescription>
                {!testType.available && (
                  <p className="mt-3 text-xs text-red-500 font-medium">
                    Bu toifadagi test yaratish hozircha mavjud emas
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Ma'lumot
          </h3>
          <p className="text-blue-700 text-sm leading-relaxed">
            Hozircha faqat "Oddiy test" yaratish mavjud. Boshqa test turlari tez orada qo'shiladi. 
            Oddiy test orqali rasmlar yuklash, savollar yaratish va test kodlari bilan ishlash mumkin.
          </p>
        </div>
      </div>
    </ResponsiveDashboard>
  );
};

export default TestTypeSelection;