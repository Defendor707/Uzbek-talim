import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import useAuth from '@/hooks/useAuth';
import { useMobile } from '@/hooks/use-mobile';

type SidebarProps = {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  currentPath: string;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  isMobileMenuOpen, 
  toggleMobileMenu,
  currentPath
}) => {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Close mobile menu when route changes
    if (isMobileMenuOpen && isMobile) {
      toggleMobileMenu();
    }
  }, [currentPath]);

  // Determine navigation items based on user role
  const getNavItems = () => {
    if (user?.role === 'teacher') {
      return [
        { path: '/dashboard/teacher', icon: 'dashboard', label: 'Bosh sahifa' },
        { path: '/teacher/lessons', icon: 'menu_book', label: 'Darsliklar' },
        { path: '/teacher/tests', icon: 'quiz', label: 'Testlar' },
        { path: '/teacher/students', icon: 'groups', label: 'O\'quvchilar' },
        { path: '/teacher/schedule', icon: 'calendar_month', label: 'Jadval' },
        { path: '/teacher/analytics', icon: 'analytics', label: 'Statistika' },
        { path: '/profile', icon: 'settings', label: 'Sozlamalar' }
      ];
    } else if (user?.role === 'student') {
      return [
        { path: '/dashboard/student', icon: 'dashboard', label: 'Bosh sahifa' },
        { path: '/student/lessons', icon: 'menu_book', label: 'Darsliklar' },
        { path: '/student/tests', icon: 'quiz', label: 'Testlar' },
        { path: '/student/results', icon: 'leaderboard', label: 'Natijalar' },
        { path: '/student/schedule', icon: 'calendar_month', label: 'Jadval' },
        { path: '/profile', icon: 'settings', label: 'Sozlamalar' }
      ];
    } else if (user?.role === 'parent') {
      return [
        { path: '/dashboard/parent', icon: 'dashboard', label: 'Bosh sahifa' },
        { path: '/parent/children', icon: 'family_restroom', label: 'Farzandlar' },
        { path: '/parent/progress', icon: 'trending_up', label: 'O\'zlashtirish' },
        { path: '/parent/messages', icon: 'message', label: 'Xabarlar' },
        { path: '/profile', icon: 'settings', label: 'Sozlamalar' }
      ];
    } else if (user?.role === 'center') {
      return [
        { path: '/dashboard/center', icon: 'dashboard', label: 'Bosh sahifa' },
        { path: '/center/teachers', icon: 'school', label: 'O\'qituvchilar' },
        { path: '/center/students', icon: 'people', label: 'O\'quvchilar' },
        { path: '/center/courses', icon: 'library_books', label: 'Kurslar' },
        { path: '/center/analytics', icon: 'analytics', label: 'Statistika' },
        { path: '/profile', icon: 'settings', label: 'Sozlamalar' }
      ];
    }
    
    // Default
    return [
      { path: '/', icon: 'dashboard', label: 'Bosh sahifa' },
      { path: '/profile', icon: 'settings', label: 'Sozlamalar' }
    ];
  };

  const navItems = getNavItems();

  // Mobile bottom navigation items (simplified)
  const mobileNavItems = navItems.slice(0, 4);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`dashboard-sidebar bg-white w-full md:w-64 md:min-h-screen card-shadow z-10 ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-neutral-ultralight flex justify-between items-center md:block">
          <div className="flex items-center">
            <span className="material-icons text-primary mr-2">school</span>
            <h2 className={`text-lg font-heading font-bold text-neutral-dark ${isCollapsed ? 'hidden' : 'hidden md:block'}`}>Repititor</h2>
          </div>
          <button className="text-neutral-medium md:hidden" onClick={toggleMobileMenu}>
            <span className="material-icons">menu</span>
          </button>
          <button className="text-neutral-medium hidden md:block" onClick={() => setIsCollapsed(!isCollapsed)}>
            <span className="material-icons">{isCollapsed ? 'menu_open' : 'menu'}</span>
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <nav className={`hidden md:block p-4 ${isCollapsed ? 'px-2' : ''}`}>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <div className={`flex items-center p-2 cursor-pointer ${isCollapsed ? 'justify-center' : ''} ${
                    currentPath === item.path 
                      ? 'text-primary bg-blue-50' 
                      : 'text-neutral-medium hover:text-primary hover:bg-blue-50'
                    } rounded-lg`}>
                    <span className="material-icons mr-3">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
          <div className="flex justify-around py-1 px-1">
            {mobileNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={`mobile-nav-item flex flex-col items-center p-3 rounded-xl min-w-[64px] transition-all duration-200 ${
                  currentPath === item.path 
                    ? 'text-blue-600 bg-blue-50 scale-105' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                  }`}>
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon === 'dashboard' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                    )}
                    {item.icon === 'menu_book' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    )}
                    {item.icon === 'quiz' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    )}
                    {item.icon === 'groups' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    )}
                  </svg>
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
            {/* More menu for remaining items */}
            <Link href="/profile">
              <div className="flex flex-col items-center p-2 rounded-lg min-w-[60px] text-gray-500 hover:text-blue-600 hover:bg-gray-50">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
                <span className="text-xs font-medium">Boshqa</span>
              </div>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
