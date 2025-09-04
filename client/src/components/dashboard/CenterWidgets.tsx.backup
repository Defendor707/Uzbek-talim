import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardWidget from './DashboardWidget';
import { Users, GraduationCap, Building2, BarChart3, UserPlus, Settings, TrendingUp, Award } from 'lucide-react';

const CenterWidgets: React.FC = () => {
  // Fetch data for widgets (placeholder queries)
  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ['/api/center/teachers'],
    queryFn: () => Promise.resolve([]) // Placeholder
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/center/students'], 
    queryFn: () => Promise.resolve([]) // Placeholder
  });

  const quickActions = [
    {
      label: 'O\'qituvchi qo\'shish',
      href: '/center/teachers',
      icon: <UserPlus className="w-4 h-4" />,
      variant: 'default' as const
    },
    {
      label: 'Hisobotlar',
      href: '/center/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      variant: 'outline' as const
    },
    {
      label: 'Sozlamalar',
      href: '/center/settings',
      icon: <Settings className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  const teacherActions = [
    {
      label: 'Barchasi',
      href: '/center/teachers',
      icon: <GraduationCap className="w-4 h-4" />,
      variant: 'outline' as const
    },
    {
      label: 'Qo\'shish',
      href: '/center/teachers',
      icon: <UserPlus className="w-4 h-4" />,
      variant: 'default' as const
    }
  ];

  const studentActions = [
    {
      label: 'Barchasi',
      href: '/center/students',
      icon: <Users className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Widget */}
      <DashboardWidget
        title="Tezkor amallar"
        subtitle="Markaz boshqaruvi"
        icon={<Building2 className="w-6 h-6" />}
        gradient="from-indigo-500 to-purple-600"
        actions={quickActions}
      />

      {/* Statistics Grid */}
      <div className="responsive-grid-2-4 gap-4">
        <DashboardWidget
          title="O'qituvchilar"
          value={teachers.length}
          subtitle="Faol o'qituvchilar"
          icon={<GraduationCap className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
          actions={teacherActions}
        />

        <DashboardWidget
          title="O'quvchilar"
          value={students.length}
          subtitle="Ro'yxatda turganlar"
          icon={<Users className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
          actions={studentActions}
        />

        <DashboardWidget
          title="Bu oy testlar"
          value={0}
          subtitle="Yaratilgan testlar"
          icon={<BarChart3 className="w-6 h-6" />}
          gradient="from-orange-500 to-orange-600"
        />

        <DashboardWidget
          title="Faollik darajasi"
          value="85%"
          subtitle="O'rtacha faollik"
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Center Overview */}
      <DashboardWidget
        title="Markaz ko'rsatkichlari"
        subtitle="Umumiy statistika"
        icon={<Award className="w-6 h-6" />}
        gradient="from-emerald-500 to-teal-600"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
            <div className="text-sm text-gray-600">O'qituvchilar</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{students.length}</div>
            <div className="text-sm text-gray-600">O'quvchilar</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">Testlar</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Darsliklar</div>
          </div>
        </div>
      </DashboardWidget>

      {/* Recent Activity */}
      <DashboardWidget
        title="So'nggi faoliyat"
        subtitle="Markaz bo'yicha oxirgi yangiliklar"
        icon={<BarChart3 className="w-6 h-6" />}
        gradient="from-pink-500 to-rose-600"
      >
        <div className="space-y-3">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-2">Markaz faoliyati</p>
            <p className="text-gray-400 text-xs">
              Bu yerda markaz bo'yicha so'nggi faoliyat ko'rsatiladi
            </p>
          </div>
        </div>
      </DashboardWidget>
    </div>
  );
};

export default CenterWidgets;