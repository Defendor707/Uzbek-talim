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
                  <a className={`flex items-center p-2 ${isCollapsed ? 'justify-center' : ''} ${
                    currentPath === item.path 
                      ? 'text-primary bg-blue-50' 
                      : 'text-neutral-medium hover:text-primary hover:bg-blue-50'
                    } rounded-lg`}>
                    <span className="material-icons mr-3">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* Mobile Navigation */}
      {isMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
          <div className="flex justify-around p-2">
            {mobileNavItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`flex flex-col items-center p-2 ${
                  currentPath === item.path 
                    ? 'text-primary' 
                    : 'text-neutral-medium'
                  }`}>
                  <span className="material-icons">{item.icon}</span>
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              </Link>
            ))}
            {/* More menu for remaining items */}
            <div className="flex flex-col items-center p-2 text-neutral-medium">
              <span className="material-icons">more_horiz</span>
              <span className="text-xs mt-1">Boshqa</span>
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
