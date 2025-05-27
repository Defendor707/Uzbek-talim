import React, { useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import useAuth from '@/hooks/useAuth';

type DashboardLayoutProps = {
  children: React.ReactNode;
  title: string;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-neutral-ultralight">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          toggleMobileMenu={toggleMobileMenu} 
          currentPath={location}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-2 md:p-4 lg:p-8 pb-20 md:pb-8">
          {/* Header with user info */}
          <header className="bg-white rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex justify-between items-center card-shadow">
            <h1 className="text-lg md:text-xl font-heading font-bold text-neutral-dark truncate">{title}</h1>
            <div className="flex items-center">
              {/* Notifications */}
              <div className="relative mr-4">
                <button className="text-neutral-medium hover:text-primary">
                  <span className="material-icons">notifications</span>
                  <span className="absolute top-0 right-0 h-2 w-2 bg-status-error rounded-full"></span>
                </button>
              </div>
              
              {/* User Profile */}
              <div className="relative">
                <div className="flex items-center cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <img 
                    className="h-8 w-8 rounded-full object-cover" 
                    src={user?.profileImage || "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"} 
                    alt="User profile"
                  />
                  <div className="ml-2 hidden md:block">
                    <p className="text-sm font-medium text-neutral-dark">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-neutral-medium">
                      {user?.role === 'teacher' && 'O\'qituvchi'}
                      {user?.role === 'student' && 'O\'quvchi'}
                      {user?.role === 'parent' && 'Ota-ona'}
                      {user?.role === 'center' && 'O\'quv markaz'}
                    </p>
                  </div>
                  <button className="ml-2 text-neutral-medium">
                    <span className="material-icons">arrow_drop_down</span>
                  </button>
                </div>
                
                {/* Dropdown menu */}
                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <a 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-ultralight"
                    >
                      Profil
                    </a>
                    <a 
                      href="#" 
                      className="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-ultralight"
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                    >
                      Chiqish
                    </a>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* Dashboard Content */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
