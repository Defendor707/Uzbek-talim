import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Sidebar from './Sidebar';
import useAuth from '@/hooks/useAuth';

interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface ImprovedDashboardProps {
  userRole: string;
  sections: DashboardSection[];
  children: React.ReactNode;
  currentPage?: string;
}

const ImprovedDashboard: React.FC<ImprovedDashboardProps> = ({ 
  userRole, 
  sections, 
  children, 
  currentPage = "Bosh sahifa" 
}) => {
  const { user, logout } = useAuth();

  const sidebarItems = sections.map(section => ({
    id: section.id,
    title: section.title,
    icon: section.icon,
    href: section.href,
    badge: section.badge
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        items={sidebarItems}
        userRole={userRole}
        userName={user?.fullName || 'Foydalanuvchi'}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentPage}</h1>
              <p className="text-sm text-gray-600">
                {userRole === 'teacher' && 'Darslaringizni boshqaring va o\'quvchilar bilan ishlang'}
                {userRole === 'student' && 'Darslarni o\'rganing va testlar ishlang'}
                {userRole === 'parent' && 'Farzandingizning o\'qish jarayonini kuzatib boring'}
                {userRole === 'center' && 'O\'quv markazingizni boshqaring'}
              </p>
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
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ImprovedDashboard;