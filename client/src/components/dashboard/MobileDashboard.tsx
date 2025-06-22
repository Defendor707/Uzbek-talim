import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, User, Menu, X } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import useAuth from '@/hooks/useAuth';

interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface MobileDashboardProps {
  userRole: string;
  sections: DashboardSection[];
  children: React.ReactNode;
  currentPage?: string;
}

const ResponsiveDashboard: React.FC<MobileDashboardProps> = ({ 
  userRole, 
  sections, 
  children, 
  currentPage = "Bosh sahifa" 
}) => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  // Only show main 3 navigation items (exclude profile)
  const bottomNavItems = sections.filter(section => section.id !== 'profile').slice(0, 3).map(section => ({
    id: section.id,
    title: section.title,
    icon: section.icon,
    href: section.href,
    badge: section.badge
  }));

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'teacher': return 'O\'qituvchi';
      case 'student': return 'O\'quvchi';
      case 'parent': return 'Ota-ona';
      case 'center': return 'O\'quv markazi';
      default: return 'Foydalanuvchi';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pb-0 pb-20">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">O'zbek Talim</h2>
              <p className="text-sm text-gray-600">{getRoleTitle(userRole)}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {sections.map((section) => {
              const isActive = location === section.href || location.startsWith(section.href + '/');
              return (
                <Link key={section.id} href={section.href}>
                  <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                    <div className="w-5 h-5 mr-3">
                      {section.icon}
                    </div>
                    <span className="flex-1">{section.title}</span>
                    {section.badge && (
                      <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                        isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {section.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link href={`/${userRole}/profile`}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top Header - Only visible on mobile */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left Side - Menu Button and Title */}
          <div className="flex items-center space-x-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="lg" className="h-12 w-12 p-0 touch-target">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                <div className="flex flex-col h-full bg-white">
                  {/* Mobile Sidebar Header */}
                  <SheetHeader className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">O</span>
                      </div>
                      <div>
                        <SheetTitle className="text-lg font-semibold text-gray-900">O'zbek Talim</SheetTitle>
                        <p className="text-sm text-gray-600">{getRoleTitle(userRole)}</p>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Mobile Navigation Menu */}
                  <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {sections.map((section) => {
                      const isActive = location === section.href || location.startsWith(section.href + '/');
                      return (
                        <Link key={section.id} href={section.href}>
                          <div 
                            className={`flex items-center px-4 py-4 text-base font-medium rounded-lg transition-colors cursor-pointer touch-target min-h-[56px] ${
                              isActive 
                                ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            <div className="w-6 h-6 mr-4 flex-shrink-0">
                              {section.icon}
                            </div>
                            <span className="flex-1">{section.title}</span>
                            {section.badge && (
                              <span className={`ml-auto px-3 py-1 text-sm rounded-full font-medium ${
                                isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {section.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Mobile User Profile Section */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.fullName || user?.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link href={`/${userRole}/profile`}>
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="w-full justify-start h-12 text-base touch-target"
                          onClick={() => setMobileSidebarOpen(false)}
                        >
                          <User className="mr-3 h-5 w-5" />
                          Profil
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="lg" 
                        className="w-full justify-start h-12 text-base text-red-600 hover:text-red-700 hover:bg-red-50 touch-target"
                        onClick={() => {
                          handleLogout();
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Chiqish
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{currentPage}</h1>
              <p className="text-xs text-gray-600">{getRoleTitle(userRole)}</p>
            </div>
          </div>
          
          {/* Profile Dropdown - Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href={`/${userRole}/profile`}>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* User Info - Mobile */}
        <div className="mt-3 text-sm text-gray-600">
          Xush kelibsiz, {user?.fullName || user?.username}
        </div>
      </header>

      {/* Desktop Top Bar - Only visible on desktop */}
      <div className="hidden lg:block lg:pl-64">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{currentPage}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Xush kelibsiz, {user?.fullName || user?.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1 lg:pl-64">
        <div className="lg:px-6 lg:py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Only visible on mobile */}
      <div className="lg:hidden">
        <BottomNavigation 
          items={bottomNavItems}
          userRole={userRole}
        />
      </div>
    </div>
  );
};

export default ResponsiveDashboard;