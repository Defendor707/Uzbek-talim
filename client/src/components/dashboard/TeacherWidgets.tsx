import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardWidget from './DashboardWidget';
import { Plus, BookOpen, FileText, Users, BarChart3, Clock, CheckCircle } from 'lucide-react';

const TeacherWidgets: React.FC = () => {
  // Fetch data for widgets
  const { data: lessons = [] } = useQuery<any[]>({
    queryKey: ['/api/lessons'],
  });
  
  const { data: tests = [] } = useQuery<any[]>({
    queryKey: ['/api/tests'],
  });

  // Calculate statistics
  const activeLessons = lessons.filter(l => l.status === 'active');
  const activeTests = tests.filter(t => t.status === 'active');
  const draftTests = tests.filter(t => t.status === 'draft');
  const completedTests = tests.filter(t => t.status === 'completed');

  const quickActions = [
    {
      label: 'Yangi test',
      href: '/teacher/test-types',
      icon: <Plus className="w-4 h-4" />,
      variant: 'default' as const
    },
    {
      label: 'Darslik qo\'shish',
      href: '/teacher/lessons',
      icon: <BookOpen className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  const testActions = [
    {
      label: 'Barcha testlar',
      href: '/teacher/tests',
      icon: <FileText className="w-4 h-4" />,
      variant: 'outline' as const
    },
    {
      label: 'Yangi test',
      href: '/teacher/test-types',
      icon: <Plus className="w-4 h-4" />,
      variant: 'default' as const
    }
  ];

  const lessonActions = [
    {
      label: 'Darsliklar',
      href: '/teacher/lessons',
      icon: <BookOpen className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Widget */}
      <DashboardWidget
        title="Tezkor amallar"
        subtitle="Ko'p ishlatiladigan funksiyalar"
        icon={<Plus className="w-6 h-6" />}
        gradient="from-indigo-500 to-purple-600"
        actions={quickActions}
      />

      {/* Statistics Grid */}
      <div className="responsive-grid-2-4 gap-4">
        <DashboardWidget
          title="Jami darsliklar"
          value={lessons.length}
          subtitle={`${activeLessons.length} ta faol`}
          icon={<BookOpen className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
          actions={lessonActions}
        />

        <DashboardWidget
          title="Jami testlar"
          value={tests.length}
          subtitle={`${activeTests.length} ta faol`}
          icon={<FileText className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
          actions={testActions}
        />

        <DashboardWidget
          title="Faol testlar"
          value={activeTests.length}
          subtitle="Hozir mavjud"
          icon={<CheckCircle className="w-6 h-6" />}
          gradient="from-emerald-500 to-emerald-600"
        />

        <DashboardWidget
          title="Qoralama testlar"
          value={draftTests.length}
          subtitle="Tugallanmagan"
          icon={<Clock className="w-6 h-6" />}
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Recent Activity Widget */}
      <DashboardWidget
        title="So'nggi faoliyat"
        subtitle="Oxirgi yaratilgan materiallar"
        icon={<BarChart3 className="w-6 h-6" />}
        gradient="from-purple-500 to-pink-600"
      >
        <div className="space-y-3">
          {tests.slice(0, 3).map((test: any) => (
            <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{test.title}</p>
                  <p className="text-xs text-gray-500">{test.testType} turi</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  test.status === 'active' ? 'bg-green-100 text-green-800' :
                  test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {test.status === 'active' ? 'Faol' : 
                   test.status === 'draft' ? 'Qoralama' : 'Tugallangan'}
                </span>
              </div>
            </div>
          ))}
          
          {tests.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">Hozircha testlar mavjud emas</p>
            </div>
          )}
        </div>
      </DashboardWidget>
    </div>
  );
};

export default TeacherWidgets;