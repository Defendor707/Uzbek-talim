import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Users, Bot } from 'lucide-react';

interface SyncStatusData {
  connectedUsers: number;
  connectedByRole: {
    teacher: number;
    student: number;
    parent: number;
    center: number;
  };
  timestamp: number;
}

export function SyncStatus() {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch initial sync status
    const fetchSyncStatus = async () => {
      try {
        const response = await apiRequest('/api/sync/status');
        const data = await response.json();
        setSyncStatus(data);
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      }
    };

    fetchSyncStatus();

    // Set up WebSocket connection for real-time sync
    const token = localStorage.getItem('auth_token');
    if (token) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-sync?token=${token}`;
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        setIsConnected(true);
        console.log('Sync WebSocket connected');
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different sync message types
          switch (message.type) {
            case 'connected':
              setIsConnected(true);
              break;
            case 'user_updated':
            case 'profile_updated':
            case 'test_created':
            case 'lesson_created':
            case 'schedule_updated':
              // Refresh sync status when data changes
              fetchSyncStatus();
              break;
          }
        } catch (error) {
          console.error('Failed to parse sync message:', error);
        }
      };

      websocket.onclose = () => {
        setIsConnected(false);
        console.log('Sync WebSocket disconnected');
      };

      websocket.onerror = (error) => {
        console.error('Sync WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(websocket);

      return () => {
        websocket.close();
      };
    }
  }, [user]);

  if (!user || !syncStatus) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
          {isConnected ? "Sinxronlashtirilgan" : "Ulanmagan"}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span>{syncStatus.connectedUsers} foydalanuvchi</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Bot className="h-4 w-4" />
        <span>Bot va sayt sinxronlashtirilgan</span>
      </div>
    </div>
  );
}