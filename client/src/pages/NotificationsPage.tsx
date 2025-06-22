import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Trash2, Settings, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useMobile } from '@/hooks/use-mobile';
import useAuth from '@/hooks/useAuth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Real API call for notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return 'ℹ';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hozir';
    if (diffInHours < 24) return `${diffInHours} soat oldin`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} kun oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href={`/${user?.role}`}>
              <Button variant="ghost" size="sm" className="p-2 h-10 w-10 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Bildirishnomalar</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : 'Barcha xabarlar o\'qilgan'}
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </header>

        {/* Mobile Content */}
        <main className="px-4 py-6 pb-24">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="whitespace-nowrap min-h-[40px] px-4"
              >
                Barchasi ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="whitespace-nowrap min-h-[40px] px-4"
              >
                O'qilmagan ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
                className="whitespace-nowrap min-h-[40px] px-4"
              >
                O'qilgan ({notifications.length - unreadCount})
              </Button>
            </div>
          </div>

          {/* Quick Actions - Mobile */}
          {unreadCount > 0 && (
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-12 text-sm font-medium"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Hammasini o'qilgan deb belgilash
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-3 text-sm">Yuklanmoqda...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sizga habarlar mavjud emas
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {filter === 'unread' 
                      ? 'Barcha xabarlar o\'qilgan' 
                      : 'Hozircha sizga xabarlar kelmagan'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification: Notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 shadow-sm hover:shadow-md ${
                    !notification.isRead 
                      ? 'border-l-4 border-l-blue-500 bg-blue-50/30' 
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        <span className="text-sm font-bold">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-base leading-tight">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        {!notification.isRead && (
                          <Badge variant="secondary" className="mb-2 text-xs font-medium">
                            Yangi
                          </Badge>
                        )}
                        
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // Desktop layout with ResponsiveDashboard
  const dashboardSections = [
    {
      id: 'home',
      title: 'Bosh sahifa',
      icon: <Bell className="w-5 h-5" />,
      href: `/${user?.role}`,
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${user?.role}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bildirishnomalar</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} ta o'qilmagan xabar` : 'Barcha xabarlar o\'qilgan'}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <CheckCheck className="w-4 h-4 mr-2" />
              Hammasini o'qilgan deb belgilash
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Sozlamalar
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Filter Tabs */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Barchasi ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  O'qilmagan ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  O'qilgan ({notifications.length - unreadCount})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Yuklanmoqda...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sizga habarlar mavjud emas
                  </h3>
                  <p className="text-gray-500">
                    {filter === 'unread' 
                      ? 'Barcha xabarlar o\'qilgan' 
                      : 'Hozircha sizga xabarlar kelmagan'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification: Notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        <span className="text-sm font-bold">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {notification.title}
                              {!notification.isRead && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Yangi
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;