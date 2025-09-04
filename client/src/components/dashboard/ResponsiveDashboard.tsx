import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import useAuth from '@/hooks/useAuth';
import { ChevronLeft, Menu, User, Settings, LogOut, Bell, Home, BookOpen, Users, Building, BarChart3, MessageSquare, Calendar, FileText, ChevronDown } from 'lucide-react';

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
    window.location.href = '/login';
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="gov-theme">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={() => setSidebarOpen(false)} 
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 gov-sidebar gov-slide-in">
              {/* Mobile Sidebar Header */}
              <div className="gov-sidebar-header">
                <div className="flex items-center justify-between">
                  <div className="gov-logo">
                    <div className="gov-logo-icon">
                      <img 
                        src="/logo.jpg" 
                        alt="O'zbek Talim Logo" 
                        className="w-8 h-8 rounded object-cover"
                      />
                    </div>
                    <div>
                      <div className="gov-logo-text">O'zbek Talim</div>
                      <div className="gov-logo-subtitle">{getRoleTitle(userRole)}</div>
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
              </div>

              {/* Mobile Sidebar Navigation */}
              <div className="gov-sidebar-nav">
                {sections.map((section) => (
                  <div key={section.id} className="gov-sidebar-item">
                    <Link href={section.href}>
                      <div className={cn(
                        "gov-sidebar-link",
                        location === section.href ? "active" : ""
                      )}>
                        <div className="w-5 h-5">
                          {section.icon}
                        </div>
                        <span>{section.title}</span>
                        {section.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <div className="gov-header">
          <div className="gov-header-content">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 h-10 w-10 rounded-lg hover:bg-white/20 text-white"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-white">{currentPage}</h1>
                  <p className="text-sm text-white/80">{getWelcomeMessage(userRole)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="p-2 h-10 w-10 rounded-lg hover:bg-white/20 text-white">
                <Link href={`/${userRole}/notifications`}>
                  <Button variant="ghost" size="sm" className="p-2 h-10 w-10 rounded-lg hover:bg-white/20 text-white">
                    <Bell className="h-5 w-5" />
                  </Button>
                </Link>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 p-2 text-white hover:bg-white/20">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/${userRole}/profile`} className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${userRole}/settings`} className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Sozlamalar
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
        </div>

        {/* Mobile Content */}
        <div className="gov-main pb-20">
          <div className="gov-container">
            <div className="gov-card gov-fade-in">
              <div className="gov-card-content">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="gov-mobile-nav">
          <ul className="gov-mobile-nav-list">
            {sections.slice(0, 4).map((section) => (
              <li key={section.id} className="gov-mobile-nav-item">
                <Link href={section.href}>
                  <div className={cn(
                    "gov-mobile-nav-link",
                    location === section.href ? "active" : ""
                  )}>
                    <div className="w-5 h-5">
                      {section.icon}
                    </div>
                    <span>{section.title}</span>
                    {section.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                        {section.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="gov-theme">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-80 md:flex-col">
          <div className="gov-sidebar">
            <div className="gov-sidebar-header">
              <div className="gov-logo">
                <div className="gov-logo-icon">
                  <img 
                    src="/logo.jpg" 
                    alt="O'zbek Talim Logo" 
                    className="w-10 h-10 rounded object-cover"
                  />
                </div>
                <div>
                  <div className="gov-logo-text">O'zbek Talim</div>
                  <div className="gov-logo-subtitle">{getRoleTitle(userRole)}</div>
                </div>
              </div>
            </div>
            
            <div className="gov-sidebar-nav">
              {sections.map((section) => (
                <div key={section.id} className="gov-sidebar-item">
                  <Link href={section.href}>
                    <div className={cn(
                      "gov-sidebar-link",
                      location === section.href ? "active" : ""
                    )}>
                      <div className="w-5 h-5">
                        {section.icon}
                      </div>
                      <span>{section.title}</span>
                      {section.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {section.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <div className="gov-header">
            <div className="gov-header-content">
              <div className="flex items-center justify-between py-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">{currentPage}</h1>
                  <p className="text-base text-white/80">{getWelcomeMessage(userRole)}</p>
                </div>
                
                <div className="flex items-center space-x-6">
                  <Button variant="ghost" size="sm" className="p-3 h-10 w-10 rounded-lg hover:bg-white/20 text-white">
                  <Link href={`/${userRole}/notifications`}>
                    <Button variant="ghost" size="sm" className="p-3 h-10 w-10 rounded-lg hover:bg-white/20 text-white">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </Link>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-3 text-white hover:bg-white/20">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="hidden sm:block text-base font-medium">{user?.fullName || 'Foydalanuvchi'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuItem asChild>
                        <Link href={`/${userRole}/profile`} className="flex items-center">
                          <User className="w-5 h-5 mr-3" />
                          Profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${userRole}/settings`} className="flex items-center">
                          <Settings className="w-5 h-5 mr-3" />
                          Sozlamalar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-5 h-5 mr-3" />
                        Chiqish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="gov-main">
            <div className="gov-container">
              <div className="gov-card gov-fade-in">
                <div className="gov-card-content">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDashboard;
