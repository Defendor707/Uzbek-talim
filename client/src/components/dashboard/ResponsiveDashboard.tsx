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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">O'zbek Talim</h1>
                <p className="text-xs text-gray-600">{getRoleTitle(userRole)}</p>
              </div>
            </div>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href={`/${userRole}/profile`}>
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profil</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <span className="flex items-center space-x-2 text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Chiqish</span>
                      </span>
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
                      <AlertDialogAction onClick={logout} className="bg-red-600 hover:bg-red-700">
                        Ha, chiqish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="px-4 py-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
          <div className="flex items-center justify-around max-w-sm mx-auto">
            {sections.slice(0, 3).map((section) => {
              const isActive = location === section.href || location.startsWith(section.href + '/');
              return (
                <Link key={section.id} href={section.href}>
                  <div className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 relative min-w-[70px]",
                    isActive 
                      ? "bg-blue-50 text-blue-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  )}>
                    <div className={cn(
                      "w-5 h-5 mb-1 transition-colors",
                      isActive ? "text-blue-600" : "text-gray-400"
                    )}>
                      {section.icon}
                    </div>
                    <span className={cn(
                      "text-xs font-medium leading-tight text-center",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )}>
                      {section.title}
                    </span>
                    {section.badge && (
                      <span className={cn(
                        "absolute -top-1 -right-1 px-1.5 py-0.5 text-xs rounded-full min-w-[18px] text-center",
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
            
            {/* Notifications Button */}
            <Link href={`/${userRole}/notifications`}>
              <div className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 relative min-w-[70px]",
                location === `/${userRole}/notifications`
                  ? "bg-blue-50 text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}>
                <div className={cn(
                  "w-5 h-5 mb-1 transition-colors",
                  location === `/${userRole}/notifications` ? "text-blue-600" : "text-gray-400"
                )}>
                  <Bell />
                </div>
                <span className={cn(
                  "text-xs font-medium leading-tight text-center",
                  location === `/${userRole}/notifications` ? "text-blue-600" : "text-gray-500"
                )}>
                  Xabarlar
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className={cn(
        "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header with Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className={cn(
            "flex items-center space-x-3 transition-opacity duration-200",
            sidebarCollapsed ? "opacity-0" : "opacity-100"
          )}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">O'zbek Talim</h1>
              <p className="text-sm text-gray-600">{getRoleTitle(userRole)}</p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Info with Dropdown */}
        <div className="p-3 border-b border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                "flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-50 cursor-pointer transition-colors",
                sidebarCollapsed ? "justify-center" : ""
              )}>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-gray-500">Faol foydalanuvchi</p>
                  </div>
                )}
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
                    <AlertDialogAction onClick={logout} className="bg-red-600 hover:bg-red-700">
                      Ha, chiqish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {sections.map((section) => {
            const isActive = location === section.href || location.startsWith(section.href + '/');
            return (
              <Link key={section.id} href={section.href}>
                <div className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group relative",
                  sidebarCollapsed ? "px-3 py-3 justify-center" : "px-3 py-3 space-x-3",
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
                  {!sidebarCollapsed && (
                    <>
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
                    </>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {section.title}
                      {section.badge && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-600 rounded-full text-xs">
                          {section.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-500 text-center">
              O'zbek Talim v1.0
            </div>
          </div>
        )}
      </div>

      {/* Desktop Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentPage}</h1>
              <p className="text-gray-600 mt-1">
                {getWelcomeMessage(userRole)}
              </p>
            </div>
            
            {/* Notifications Button - PC Version */}
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
          </div>
        </header>

        {/* Desktop Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveDashboard;