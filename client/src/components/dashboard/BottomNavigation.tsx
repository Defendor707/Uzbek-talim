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

  // Show only 4 main items + logout
  const mainItems = items.slice(0, 4);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mainItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + '/');
          return (
            <Link key={item.id} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors relative",
                isActive 
                  ? "text-blue-600" 
                  : "text-gray-500"
              )}>
                <div className={cn(
                  "w-6 h-6 mb-1",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  "text-xs font-medium",
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
        
        {/* Logout Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-red-500">
              <div className="w-6 h-6 mb-1">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-xs font-medium">Chiqish</span>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tizimdan chiqish</AlertDialogTitle>
              <AlertDialogDescription>
                Haqiqatan ham tizimdan chiqishni xohlaysizmi?
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
      </div>
    </div>
  );
};

export default BottomNavigation;