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
        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-8 max-w-full overflow-x-hidden">
          {/* Header with user info */}
          <header className="mobile-card mb-4 md:mb-6 flex justify-between items-center min-h-[60px]">
            <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate flex-1 mr-4">{title}</h1>
            <div className="flex items-center">
              {/* Notifications */}
              <div className="relative mr-2">
                <button className="touch-target p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 active:scale-95">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-2.5-2.5h6a3 3 0 003-3V7a3 3 0 00-3-3H6a3 3 0 00-3 3v1a3 3 0 003 3h6a50.002 50.002 0 00-2.5 2.5L6.5 17H12"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">3</span>
                </button>
              </div>
              
              {/* User Profile */}
              <div className="relative">
                <div className="flex items-center cursor-pointer touch-target rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95" 
                     onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <img 
                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" 
                    src={user?.profileImage || "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"} 
                    alt="User profile"
                  />
                  <div className="ml-3 hidden md:block">
                    <p className="text-sm font-medium text-gray-800">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500">
                      {user?.role === 'teacher' && 'O\'qituvchi'}
                      {user?.role === 'student' && 'O\'quvchi'}
                      {user?.role === 'parent' && 'Ota-ona'}
                      {user?.role === 'center' && 'O\'quv markaz'}
                    </p>
                  </div>
                  <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
                
                {/* Dropdown menu */}
                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                    <a 
                      href="/profile" 
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 touch-target"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Profil
                    </a>
                    <div className="border-t border-gray-100 my-1"></div>
                    <a 
                      href="#" 
                      className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 touch-target"
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                    >
                      <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
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
