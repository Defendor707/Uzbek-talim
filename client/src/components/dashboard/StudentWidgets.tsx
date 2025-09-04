import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardWidget from './DashboardWidget';
import { Search, FileText, BookOpen, Trophy, Target, TrendingUp, Calendar, Star } from 'lucide-react';

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
      variant: 'default' as const
    },
    {
      label: 'Ommaviy testlar',
      href: '/student/tests',
      icon: <FileText className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  const testActions = [
    {
      label: 'Barcha testlar',
      href: '/student/tests',
      icon: <FileText className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Widget */}
      <DashboardWidget
        title="Tezkor amallar"
        subtitle="Test topish va ishlash"
        icon={<Target className="w-6 h-6" />}
        gradient="from-blue-500 to-indigo-600"
        actions={quickActions}
      />

      {/* Statistics Grid */}
      <div className="responsive-grid-2-4 gap-4">
        <DashboardWidget
          title="Ishlangan testlar"
          value={attempts.length}
          subtitle={`${completedAttempts.length} ta tugallangan`}
          icon={<FileText className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
          actions={testActions}
        />

        <DashboardWidget
          title="O'rtacha ball"
          value={`${averageScore}%`}
          subtitle="Barcha testlar bo'yicha"
          icon={<Trophy className="w-6 h-6" />}
          gradient="from-yellow-500 to-orange-600"
        />

        <DashboardWidget
          title="Mavjud testlar"
          value={tests.length}
          subtitle="Sizning sinfingiz uchun"
          icon={<BookOpen className="w-6 h-6" />}
          gradient="from-purple-500 to-purple-600"
        />

        <DashboardWidget
          title="Ommaviy testlar"
          value={publicTests.length}
          subtitle="Hammaga ochiq"
          icon={<Star className="w-6 h-6" />}
          gradient="from-pink-500 to-rose-600"
        />
      </div>

      {/* Progress Widget */}
      <DashboardWidget
        title="O'quv jarayoni"
        subtitle="Sizning muvaffaqiyatingiz"
        icon={<TrendingUp className="w-6 h-6" />}
        gradient="from-emerald-500 to-teal-600"
      >
        <div className="space-y-4">
          {/* Progress bars */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Tugallangan testlar</span>
              <span className="text-sm text-gray-500">{completedAttempts.length}/{attempts.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{
                  width: attempts.length > 0 ? `${(completedAttempts.length / attempts.length) * 100}%` : '0%'
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">O'rtacha natija</span>
              <span className="text-sm text-gray-500">{averageScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${averageScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </DashboardWidget>

      {/* Recent Test Results */}
      <DashboardWidget
        title="So'nggi natijalar"
        subtitle="Oxirgi ishlangan testlar"
        icon={<Calendar className="w-6 h-6" />}
        gradient="from-indigo-500 to-blue-600"
      >
        <div className="space-y-3">
          {completedAttempts.slice(0, 3).map((attempt: any) => (
            <div key={attempt.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Test #{attempt.testId}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(attempt.completedAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                  Number(attempt.score) >= 80 ? 'bg-green-100 text-green-800' :
                  Number(attempt.score) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {attempt.score}%
                </span>
              </div>
            </div>
          ))}
          
          {completedAttempts.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">Hozircha test natijalari yo'q</p>
            </div>
          )}
        </div>
      </DashboardWidget>
    </div>
  );
};

export default StudentWidgets;