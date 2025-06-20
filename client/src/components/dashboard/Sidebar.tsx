import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface SidebarProps {
  items: SidebarItem[];
  userRole: string;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ items, userRole, userName }) => {
  const [location] = useLocation();

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'teacher': return 'O\'qituvchi';
      case 'student': return 'O\'quvchi';
      case 'parent': return 'Ota-ona';
      case 'center': return 'O\'quv markazi';
      default: return 'Foydalanuvchi';
    }
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">O'zbek Talim</h1>
            <p className="text-sm text-gray-600">{getRoleTitle(userRole)}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500">Faol foydalanuvchi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {items.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + '/');
          return (
            <Link key={item.id} href={item.href}>
              <span className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}>
                <span className={cn(
                  "w-5 h-5",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    isActive 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          O'zbek Talim v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;