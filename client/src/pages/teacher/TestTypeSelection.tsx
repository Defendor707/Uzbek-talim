import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test turi tanlash</h1>
              <p className="text-sm sm:text-base text-gray-600">Yaratmoqchi bo'lgan test turini tanlang</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/teacher/tests" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Orqaga
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default TestTypeSelection;