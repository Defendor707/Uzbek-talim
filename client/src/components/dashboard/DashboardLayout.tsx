import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import useAuth from '@/hooks/useAuth';

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  bgColor: string;
}

interface DashboardLayoutProps {
  userRole: string;
  sections: DashboardSection[];
  statsCards?: React.ReactNode[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userRole, sections, statsCards }) => {
  const { user, logout } = useAuth();

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'teacher': return 'O\'qituvchi';
      case 'student': return 'O\'quvchi';
      case 'parent': return 'Ota-ona';
      case 'center': return 'O\'quv markazi';
      default: return 'Foydalanuvchi';
    }
  };

  const getWelcomeMessage = (role: string) => {
    switch (role) {
      case 'teacher': return 'Darslaringizni boshqaring va o\'quvchilar bilan ishlang';
      case 'student': return 'Darslarni o\'rganing va testlar ishlang';
      case 'parent': return 'Farzandingizning o\'qish jarayonini kuzatib boring';
      case 'center': return 'O\'quv markazingizni boshqaring';
      default: return 'Platformadan foydalaning';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">O'zbek Talim</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Salom, {user?.fullName || user?.username}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getRoleTitle(userRole)} Paneli
          </h2>
          <p className="text-gray-600">
            {getWelcomeMessage(userRole)}
          </p>
        </div>

        {/* Stats Cards (agar mavjud bo'lsa) */}
        {statsCards && statsCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards}
          </div>
        )}
        
        {/* 4 Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${section.bgColor} rounded-lg mx-auto mb-4 flex items-center justify-center`}>
                {section.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{section.description}</p>
              <Link href={section.href}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Ko'rish
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;