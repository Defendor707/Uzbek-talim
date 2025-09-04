import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import useAuth from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight, Menu, User, Settings, LogOut, Bell, Flag, Star, Home, BookOpen, Users, Building, BarChart3, MessageSquare, Calendar, FileText } from 'lucide-react';

interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface ResponsiveDashboardProps {
  userRole: string;
  sections: DashboardSection[];
  children: React.ReactNode;
  currentPage?: string;
}

const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = ({ 
  userRole, 
  sections, 
  children, 
  currentPage = "Bosh sahifa" 
}) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case 'student': return 'Testlar va darslaringizni ko\'ring';
      case 'parent': return 'Farzandingizning o\'qish jarayonini kuzatib boring';
      case 'center': return 'O\'quv markazingizni boshqaring';
      default: return 'Tizimga xush kelibsiz';
    }
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen uzbek-gradient-sky uzbek-pattern">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={() => setSidebarOpen(false)} 
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 card-uzbek shadow-uzbek-lg transform transition-transform">
              {/* Mobile Sidebar Header */}
              <div className="p-6 border-b border-uzbek-green flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden uzbek-float">
                    <img 
                      src="/logo.jpg" 
                      alt="O'zbek Talim Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-uzbek-green">O'zbek Talim</h2>
                    <p className="text-sm text-uzbek-blue">{getRoleTitle(userRole)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 h-8 w-8 rounded-lg hover:bg-green-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto py-6">
                <nav className="space-y-3 px-4">
                  {sections.map((section) => (
                    <Link key={section.id} href={section.href}>
                      <div className={cn(
                        "nav-item-uzbek flex items-center justify-between px-6 py-4 text-base font-medium transition-all duration-300 rounded-2xl",
                        location === section.href
                          ? "active"
                          : "text-gray-700 hover:text-uzbek-green hover:bg-green-50"
                      )}>
                        <div className="flex items-center space-x-4">
                          <div className="w-6 h-6 icon-uzbek">
                            {section.icon}
                          </div>
                          <span>{section.title}</span>
                        </div>
                        {section.badge && (
                          <span className="bg-uzbek-red text-white text-sm rounded-full px-3 py-1 min-w-[24px] text-center uzbek-pulse">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="p-6 border-t border-uzbek-green">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-uzbek-green flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 truncate">
                      {user?.fullName || 'Foydalanuvchi'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link href={`/${userRole}/profile`}>
                    <div className="flex items-center px-4 py-3 text-base text-uzbek-green hover:bg-green-50 rounded-xl transition-colors">
                      <Settings className="w-5 h-5 mr-4" />
                      Profil
                    </div>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center px-4 py-3 text-base text-uzbek-red hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                        <LogOut className="w-5 h-5 mr-4" />
                        Chiqish
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Chiqishni tasdiqlang</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tizimdan chiqishni xohlaysizmi?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>
                          Chiqish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <div className="sticky top-0 z-40 nav-uzbek">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-3 h-10 w-10 rounded-xl hover:bg-green-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-uzbek-green">{currentPage}</h1>
                <p className="text-sm text-uzbek-blue">{getWelcomeMessage(userRole)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-uzbek-gold">
                <Flag className="w-5 h-5" />
                <Star className="w-5 h-5" />
              </div>
              <Button variant="ghost" size="sm" className="p-3 h-10 w-10 rounded-xl hover:bg-green-100">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 pb-6">
          <div className="card-uzbek rounded-3xl p-6 shadow-uzbek">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen uzbek-gradient-sky uzbek-pattern">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-72 md:flex-col">
          <div className="flex flex-col flex-grow pt-6 card-uzbek shadow-uzbek-lg">
            <div className="flex items-center flex-shrink-0 px-6">
              <div className="w-14 h-14 rounded-xl overflow-hidden uzbek-float">
                <img 
                  src="/logo.jpg" 
                  alt="O'zbek Talim Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-uzbek-green">O'zbek Talim</h2>
                <p className="text-sm text-uzbek-blue">{getRoleTitle(userRole)}</p>
              </div>
            </div>
            
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-4 space-y-3">
                {sections.map((section) => (
                  <Link key={section.id} href={section.href}>
                    <div className={cn(
                      "nav-item-uzbek group flex items-center justify-between px-6 py-4 text-base font-medium transition-all duration-300 rounded-2xl",
                      location === section.href
                        ? "active"
                        : "text-gray-700 hover:text-uzbek-green hover:bg-green-50"
                    )}>
                      <div className="flex items-center space-x-4">
                        <div className="w-6 h-6 icon-uzbek">
                          {section.icon}
                        </div>
                        <span>{section.title}</span>
                      </div>
                      {section.badge && (
                        <span className="bg-uzbek-red text-white text-sm rounded-full px-3 py-1 min-w-[24px] text-center uzbek-pulse">
                          {section.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop Sidebar Footer */}
            <div className="flex-shrink-0 p-6 border-t border-uzbek-green">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-uzbek-green flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 truncate">
                    {user?.fullName || 'Foydalanuvchi'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Link href={`/${userRole}/profile`}>
                  <div className="flex items-center px-4 py-3 text-base text-uzbek-green hover:bg-green-50 rounded-xl transition-colors">
                    <Settings className="w-5 h-5 mr-4" />
                    Profil
                  </div>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex items-center px-4 py-3 text-base text-uzbek-red hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                      <LogOut className="w-5 h-5 mr-4" />
                      Chiqish
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Chiqishni tasdiqlang</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tizimdan chiqishni xohlaysizmi?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>
                        Chiqish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <div className="nav-uzbek">
            <div className="flex items-center justify-between px-8 py-6">
              <div>
                <h1 className="text-3xl font-bold text-uzbek-green">{currentPage}</h1>
                <p className="text-base text-uzbek-blue">{getWelcomeMessage(userRole)}</p>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3 text-uzbek-gold">
                  <Flag className="w-6 h-6" />
                  <Star className="w-6 h-6" />
                </div>
                <Button variant="ghost" size="sm" className="p-3 h-10 w-10 rounded-xl hover:bg-green-100">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-uzbek-green flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="hidden sm:block text-base font-medium">{user?.fullName || 'Foydalanuvchi'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem asChild>
                      <Link href={`/${userRole}/profile`} className="flex items-center">
                        <Settings className="w-5 h-5 mr-3" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-uzbek-red">
                      <LogOut className="w-5 h-5 mr-3" />
                      Chiqish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="card-uzbek rounded-3xl p-8 shadow-uzbek-lg">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDashboard;
