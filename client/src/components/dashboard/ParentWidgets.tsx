import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardWidget from './DashboardWidget';
import { Users, TrendingUp, Calendar, Award, UserPlus, BarChart3, Clock, Star } from 'lucide-react';

const ParentWidgets: React.FC = () => {
  // Fetch data for widgets
  const { data: children = [] } = useQuery<any[]>({
    queryKey: ['/api/parent/children'],
  });

  const quickActions = [
    {
      label: 'Farzand qo\'shish',
      href: '/parent/children',
      icon: <UserPlus className="w-4 h-4" />,
      variant: 'default' as const
    },
    {
      label: 'Natijalarni ko\'rish',
      href: '/parent/results',
      icon: <BarChart3 className="w-4 h-4" />,
      variant: 'outline' as const
    }
  ];

  const childrenActions = [
    {
      label: 'Barchasi',
      href: '/parent/children',
      icon: <Users className="w-4 h-4" />,
      variant: 'outline' as const
    },
    {
      label: 'Qo\'shish',
      href: '/parent/children',
      icon: <UserPlus className="w-4 h-4" />,
      variant: 'default' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Widget */}
      <DashboardWidget
        title="Tezkor amallar"
        subtitle="Farzandlaringizni boshqaring"
        icon={<Users className="w-6 h-6" />}
        gradient="from-purple-500 to-pink-600"
        actions={quickActions}
      />

      {/* Statistics Grid */}
      <div className="responsive-grid-2-4 gap-4">
        <DashboardWidget
          title="Farzandlar soni"
          value={children.length}
          subtitle="Ro'yxatda turganlar"
          icon={<Users className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
          actions={childrenActions}
        />

        <DashboardWidget
          title="Faol o'quvchilar"
          value={children.filter((c: any) => c.status === 'active').length}
          subtitle="Hozir o'qiyotganlar"
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-green-500 to-green-600"
        />

        <DashboardWidget
          title="Bu oy testlar"
          value={0}
          subtitle="Ishlangan testlar"
          icon={<Calendar className="w-6 h-6" />}
          gradient="from-orange-500 to-orange-600"
        />

        <DashboardWidget
          title="Yuqori natijalar"
          value={0}
          subtitle="80% dan yuqori"
          icon={<Award className="w-6 h-6" />}
          gradient="from-yellow-500 to-yellow-600"
        />
      </div>

      {/* Children Overview */}
      <DashboardWidget
        title="Farzandlaringiz"
        subtitle="O'quv jarayoni haqida ma'lumot"
        icon={<BarChart3 className="w-6 h-6" />}
        gradient="from-indigo-500 to-purple-600"
      >
        <div className="space-y-4">
          {children.length > 0 ? (
            children.map((child: any) => (
              <div key={child.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {child.firstName?.charAt(0) || child.username?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {child.firstName && child.lastName 
                        ? `${child.firstName} ${child.lastName}`
                        : child.username
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {child.grade ? `${child.grade}-sinf` : 'Sinf ko\'rsatilmagan'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Faol
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-4">Hozircha farzandlar qo'shilmagan</p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Birinchi farzandni qo'shish
              </button>
            </div>
          )}
        </div>
      </DashboardWidget>

      {/* Recent Activity */}
      <DashboardWidget
        title="So'nggi faoliyat"
        subtitle="Farzandlaringizning oxirgi natijalari"
        icon={<Clock className="w-6 h-6" />}
        gradient="from-emerald-500 to-teal-600"
      >
        <div className="space-y-3">
          {/* Placeholder for recent activities */}
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              Farzandlaringizning test natijalari bu yerda ko'rsatiladi
            </p>
          </div>
        </div>
      </DashboardWidget>
    </div>
  );
};

export default ParentWidgets;