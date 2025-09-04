import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

interface BottomNavItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  userRole: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ items, userRole }) => {
  const [location] = useLocation();
  const { logout } = useAuth();

  // Show only 3 main items (profile moved to header)
  const mainItems = items.slice(0, 3);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb z-50">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {mainItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + '/');
          return (
            <Link key={item.id} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 relative min-w-[80px]",
                isActive 
                  ? "bg-blue-50 text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}>
                <div className={cn(
                  "w-5 h-5 mb-1.5 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}>
                  {item.title}
                </span>
                {item.badge && (
                  <span className={cn(
                    "absolute -top-1 -right-1 px-1.5 py-0.5 text-xs rounded-full",
                    isActive 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
            </Link>
          );
        })}

      </div>
    </div>
  );
};

export default BottomNavigation;