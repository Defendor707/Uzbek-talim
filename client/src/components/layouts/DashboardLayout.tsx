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
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          toggleMobileMenu={toggleMobileMenu} 
          currentPath={location}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-8">
          {/* Header with user info */}
          <header className="bg-white rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm border border-gray-100">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{title}</h1>
            <div className="flex items-center">
              {/* Notifications */}
              <div className="relative mr-3">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-2.5-2.5h6a3 3 0 003-3V7a3 3 0 00-3-3H6a3 3 0 00-3 3v1a3 3 0 003 3h6a50.002 50.002 0 00-2.5 2.5L6.5 17H12"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
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
