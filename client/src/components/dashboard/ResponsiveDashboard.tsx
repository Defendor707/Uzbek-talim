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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen gradient-ocean pb-20">
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
                    <p className="text-xs text-gray-600">{getRoleTitle(userRole)}</p>
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
              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {sections.map((section) => {
                  const isActive = location === section.href || location.startsWith(section.href + '/');
                  return (
                    <Link key={section.id} href={section.href} onClick={() => setSidebarOpen(false)}>
                      <div className={cn(
                        "flex items-center px-4 py-3 space-x-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                        isActive 
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}>
                        <span className={cn(
                          "w-5 h-5 transition-colors flex-shrink-0",
                          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                        )}>
                          {section.icon}
                        </span>
                        <span className="flex-1 truncate">{section.title}</span>
                        {section.badge && (
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full font-medium",
                            isActive 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {section.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>


            </div>
          </div>
        )}
        {/* Mobile Header */}
        <header className="glass border-b border-white/20 px-4 py-3 sticky top-0 z-40 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {

                  setSidebarOpen(true);
                }}
                className="p-2 h-8 w-8 rounded-lg hover:bg-gray-100 mr-2"
              >
                <Menu className="h-4 w-4 text-gray-600" />
              </Button>
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img 
                  src="/logo.jpg" 
                  alt="O'zbek Talim Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">O'zbek Talim</h1>
                <p className="text-xs text-gray-600">{getRoleTitle(userRole)}</p>
              </div>
            </div>
            
            {/* Notifications and Profile */}
            <div className="flex items-center space-x-2">
              {/* Notifications Button - Mobile Version */}
              <Link href={`/${userRole}/notifications`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative p-2 h-8 w-8",
                    location === `/${userRole}/notifications`
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </Link>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profil surati" 
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500">{getRoleTitle(userRole)}</p>
                  </div>
                  <Link href={`/${userRole}/profile`}>
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Profil
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Sozlamalar
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        Chiqish
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Chiqishni tasdiqlang</AlertDialogTitle>
                        <AlertDialogDescription>
                          Haqiqatan ham tizimdan chiqmoqchimisiz?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={logout} className="bg-red-600 hover:bg-red-700">
                          Chiqish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="px-4 py-6 pb-16 transition-all duration-300 ease-out dashboard-bg">
          <div className="max-w-lg mx-auto">
            {children}
          </div>
        </main>

        {/* Compact Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-sm border-t border-gray-200 z-50 safe-area-pb">
          <div className="flex items-center justify-around px-4 py-1 max-w-sm mx-auto">
            {sections.slice(0, 3).map((section) => {
              const isActive = location === section.href || location.startsWith(section.href + '/');
              return (
                <Link key={section.id} href={section.href}>
                  <div className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 ease-out relative min-w-[60px] active:scale-95",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  )}>
                    <div className={cn(
                      "w-5 h-5 mb-0.5 transition-all duration-200",
                      isActive ? "text-white" : "text-gray-500"
                    )}>
                      {section.icon}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium leading-tight text-center",
                      isActive ? "text-white" : "text-gray-600"
                    )}>
                      {section.title}
                    </span>
                    {section.badge && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 px-1 py-0.5 text-[9px] rounded-full min-w-[16px] text-center font-bold",
                        isActive 
                          ? "bg-white text-blue-600" 
                          : "bg-red-500 text-white"
                      )}>
                        {section.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="h-safe-area-inset-bottom"></div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen professional-bg">
      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <div className="w-64 glass-modern border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-in-out shadow-lg">
          {/* Sidebar Header */}
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
                <p className="text-xs text-gray-600">{getRoleTitle(userRole)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="p-2 h-8 w-8 rounded-lg hover:bg-gray-100"
              title="Sidebar yopish"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info with Dropdown */}
          <div className="p-4 border-b border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt="Profil surati" 
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-gray-500">Faol foydalanuvchi</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href={`/${userRole}/profile`}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${userRole}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Sozlamalar</span>
                </Link>
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <LogOut className="mr-2 h-4 w-4 text-red-600" />
                    <span className="text-red-600">Chiqish</span>
                  </DropdownMenuItem>
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
                    <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                      Ha, chiqish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {sections.map((section) => {
              const isActive = location === section.href || location.startsWith(section.href + '/');
              return (
                <Link key={section.id} href={section.href}>
                  <div className={cn(
                    "flex items-center px-4 py-3 space-x-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isActive 
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                    <span className={cn(
                      "w-5 h-5 transition-colors flex-shrink-0",
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    )}>
                      {section.icon}
                    </span>
                    <span className="flex-1 truncate">{section.title}</span>
                    {section.badge && (
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full font-medium",
                        isActive 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {section.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-500 text-center">
              O'zbek Talim v1.0
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {

                    setSidebarOpen(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Sidebar ochish"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {!sidebarOpen && (
                <div className="w-8 h-8 rounded-lg overflow-hidden mr-3">
                  <img 
                    src="/logo.jpg" 
                    alt="O'zbek Talim Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentPage}</h1>
                <p className="text-gray-600">{getWelcomeMessage(userRole)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/${userRole}/notifications`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative p-2",
                    location === `/${userRole}/notifications`
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 dashboard-bg transition-all duration-300 ease-out">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveDashboard;