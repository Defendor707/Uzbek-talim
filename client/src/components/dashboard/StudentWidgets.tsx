import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardWidget from './DashboardWidget';
import { Search, FileText, BookOpen, Trophy, Target, TrendingUp, Calendar, Star, Users, Award } from 'lucide-react';

const StudentWidgets: React.FC = () => {
  // Fetch data for widgets
  const { data: tests = [] } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });

  const { data: publicTests = [] } = useQuery<any[]>({
    queryKey: ['/api/tests/public'],
  });

  const { data: attempts = [] } = useQuery<any[]>({
    queryKey: ['/api/student/attempts'],
  });

  // Calculate statistics
  const completedAttempts = attempts.filter((a: any) => a.status === 'completed');
  const averageScore = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((sum: number, a: any) => sum + (Number(a.score) || 0), 0) / completedAttempts.length)
    : 0;

  const quickActions = [
    {
      label: 'Test qidirish',
      href: '/student/tests',
      icon: <Search className="w-4 h-4" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Mavjud testlarni qidiring'
    },
    {
      label: 'Natijalarim',
      href: '/student/results',
      icon: <Trophy className="w-4 h-4" />,
      color: 'from-green-500 to-green-600',
      description: 'Test natijalarini ko\'ring'
    },
    {
      label: 'Darsliklar',
      href: '/student/materials',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'from-purple-500 to-purple-600',
      description: 'O\'quv materiallarini ko\'ring'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Asosiy statistikalar - yumshoq ko'rinish */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-900">{publicTests.length}</span>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-1">Jami testlar</h3>
          <p className="text-sm text-blue-600">Mavjud testlar soni</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-green-900">{completedAttempts.length}</span>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">Bajarilgan testlar</h3>
          <p className="text-sm text-green-600">Siz bajargan testlar</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-purple-900">{averageScore}%</span>
          </div>
          <h3 className="text-lg font-semibold text-purple-900 mb-1">O'rtacha ball</h3>
          <p className="text-sm text-purple-600">Umumiy o'rtacha natija</p>
        </div>
      </div>

      {/* Tezkor amallar - yumshoq ko'rinish */}
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-blue-900 mb-6">Tezkor amallar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="group flex items-center p-4 rounded-xl bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">{action.label}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* So'nggi faoliyat - yumshoq ko'rinish */}
      {completedAttempts.length > 0 && (
        <div className="bg-gradient-to-r from-white to-green-50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-green-900 mb-6">So'nggi natijalar</h3>
          <div className="space-y-3">
            {completedAttempts.slice(0, 3).map((attempt: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{attempt.testTitle || 'Test'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(attempt.completedAt).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{attempt.score}%</p>
                  <p className="text-sm text-gray-500">Ball</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWidgets;
