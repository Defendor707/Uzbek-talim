import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import useAuth from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight, Menu, User, Settings, LogOut, Bell } from 'lucide-react';

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

  // Get role-specific theme classes
  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'teacher': return 'teacher-bg';
      case 'student': return 'student-bg';
      case 'parent': return 'parent-bg';
      case 'center': return 'center-bg';
      default: return 'gradient-ocean';
    }
  };

  const getRoleCardClass = (role: string) => {
    switch (role) {
      case 'teacher': return 'teacher-card';
      case 'student': return 'student-card';
      case 'parent': return 'parent-card';
      case 'center': return 'center-card';
      default: return 'mobile-card';
    }
  };

  const getRoleNavClass = (role: string) => {
    switch (role) {
      case 'teacher': return 'mobile-nav-teacher';
      case 'student': return 'mobile-nav-student';
      case 'parent': return 'mobile-nav-parent';
      case 'center': return 'mobile-nav-center';
      default: return 'bg-white';
    }
  };

  const getRoleIconClass = (role: string) => {
    switch (role) {
      case 'teacher': return 'icon-teacher';
      case 'student': return 'icon-student';
      case 'parent': return 'icon-parent';
      case 'center': return 'icon-center';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleTextClass = (role: string) => {
    switch (role) {
      case 'teacher': return 'text-teacher';
      case 'student': return 'text-student';
      case 'parent': return 'text-parent';
      case 'center': return 'text-center';
      default: return 'text-gray-600';
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={`min-h-screen ${getRoleTheme(userRole)} pb-20`}>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={() => setSidebarOpen(false)} 
            />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform">
              {/* Mobile Sidebar Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img 
                      src="/logo.jpg" 
                      alt="O'zbek Talim Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">O'zbek Talim</h2>
                    <p className={`text-xs ${getRoleTextClass(userRole)}`}>{getRoleTitle(userRole)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 h-8 w-8 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                  {sections.map((section) => (
                    <Link key={section.id} href={section.href}>
                      <div className={cn(
                        "flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        location === section.href
                          ? `${getRoleIconClass(userRole)} text-white`
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}>
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5">
                            {section.icon}
                          </div>
                          <span>{section.title}</span>
                        </div>
                        {section.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.fullName || 'Foydalanuvchi'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Link href={`/${userRole}/profile`}>
                    <div className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Settings className="w-4 h-4 mr-3" />
                      Profil
                    </div>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <LogOut className="w-4 h-4 mr-3" />
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
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2 h-8 w-8 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
                <p className="text-xs text-gray-500">{getWelcomeMessage(userRole)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-2 h-8 w-8 rounded-lg hover:bg-gray-100">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 space-y-4">
          <div className={`${getRoleCardClass(userRole)} rounded-2xl p-6 shadow-role`}>
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className={`fixed bottom-0 left-0 right-0 ${getRoleNavClass(userRole)} border-t border-white/20`}>
          <div className="grid grid-cols-4 gap-1 p-2">
            {sections.slice(0, 4).map((section) => (
              <Link key={section.id} href={section.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200",
                  location === section.href
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}>
                  <div className="w-5 h-5 mb-1">
                    {section.icon}
                  </div>
                  <span className="text-xs font-medium truncate">{section.title}</span>
                  {section.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                      {section.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={`min-h-screen ${getRoleTheme(userRole)}`}>
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto glass-nav">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img 
                  src="/logo.jpg" 
                  alt="O'zbek Talim Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-bold text-white">O'zbek Talim</h2>
                <p className="text-xs text-white/80">{getRoleTitle(userRole)}</p>
              </div>
            </div>
            
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {sections.map((section) => (
                  <Link key={section.id} href={section.href}>
                    <div className={cn(
                      "group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      location === section.href
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}>
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5">
                          {section.icon}
                        </div>
                        <span>{section.title}</span>
                      </div>
                      {section.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {section.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop Sidebar Footer */}
            <div className="flex-shrink-0 p-4 border-t border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.fullName || 'Foydalanuvchi'}
                  </p>
                  <p className="text-xs text-white/70 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link href={`/${userRole}/profile`}>
                  <div className="flex items-center px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 mr-3" />
                    Profil
                  </div>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex items-center px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer">
                      <LogOut className="w-4 h-4 mr-3" />
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
          <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentPage}</h1>
                <p className="text-sm text-gray-600">{getWelcomeMessage(userRole)}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 rounded-lg hover:bg-gray-100">
                  <Bell className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="hidden sm:block">{user?.fullName || 'Foydalanuvchi'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/${userRole}/profile`} className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Chiqish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`${getRoleCardClass(userRole)} rounded-2xl p-8 shadow-role-lg`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDashboard;
