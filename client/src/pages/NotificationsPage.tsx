import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
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
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Mock notifications - replace with real API call
  const mockNotifications: Notification[] = [
    {
      id: 1,
      title: 'Yangi test yaratildi',
      message: 'Matematika fanidan yangi test qo\'shildi. Testni ko\'rish uchun bosing.',
      type: 'info',
      isRead: false,
      createdAt: '2024-01-15T10:30:00Z',
      actionUrl: '/tests/123'
    },
    {
      id: 2,
      title: 'Test yakunlandi',
      message: 'Fizika testini muvaffaqiyatli yakunladingiz. Natijangiz: 85%',
      type: 'success',
      isRead: false,
      createdAt: '2024-01-15T09:15:00Z'
    },
    {
      id: 3,
      title: 'Profil yangilandi',
      message: 'Profilingiz muvaffaqiyatli yangilandi.',
      type: 'success',
      isRead: true,
      createdAt: '2024-01-14T16:45:00Z'
    },
    {
      id: 4,
      title: 'Tizim xabarnomasi',
      message: 'Tizimda texnik ishlar olib boriladi. Iltimos, sabrli bo\'ling.',
      type: 'warning',
      isRead: true,
      createdAt: '2024-01-14T08:00:00Z'
    }
  ];

  const notifications = mockNotifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(notification => {
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

  const dashboardSections = [
    {
      id: 'home',
      title: 'Bosh sahifa',
      icon: <Bell className="w-5 h-5" />,
      href: `/${user?.role}`,
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole={user?.role || 'student'} 
      sections={dashboardSections}
      currentPage="Bildirishnomalar"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bildirishnomalar</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} ta o'qilmagan xabar` : 'Barcha xabarlar o\'qilgan'}
            </p>
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
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Xabarlar yo'q
                </h3>
                <p className="text-gray-500">
                  {filter === 'unread' 
                    ? 'Barcha xabarlar o\'qilgan' 
                    : 'Hozircha sizga xabarlar kelmagan'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
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

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="text-center">
            <Button variant="outline">
              Ko'proq yuklash
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDashboard>
  );
};

export default NotificationsPage;