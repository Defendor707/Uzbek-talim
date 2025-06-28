import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Video, VideoOff, Mic, MicOff, Share2, Users, MessageCircle, 
  Palette, Settings, Phone, PhoneOff, Monitor, MonitorOff,
  Send, Maximize, Minimize, Copy, ExternalLink
} from "lucide-react";
import type { StudyRoom, StudyRoomMessage } from "@shared/schema";

interface Participant {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  role: 'host' | 'moderator' | 'participant';
  joinedAt: string;
}

interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  username: string;
  createdAt: string;
  type: 'text' | 'system';
}

export default function StudyRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const roomId = parseInt(id!);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Room state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Media state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // UI state
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  // Fetch room data
  const { data: room, isLoading } = useQuery({
    queryKey: [`/api/study-rooms/${roomId}`],
    queryFn: () => apiRequest(`/api/study-rooms/${roomId}`),
    enabled: !!roomId,
  });

  // Fetch chat messages
  const { data: chatMessages = [] } = useQuery({
    queryKey: [`/api/study-rooms/${roomId}/messages`],
    queryFn: () => apiRequest(`/api/study-rooms/${roomId}/messages`),
    enabled: !!roomId,
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/study-rooms/${roomId}/join`, {
        method: "POST",
      });
    },
  });

  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/study-rooms/${roomId}/leave`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      window.location.href = "/study-rooms";
    },
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/study-room?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join the room
      ws.send(JSON.stringify({
        type: 'join-room',
        roomId: roomId.toString()
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, roomId]);

  // Initialize chat messages from API
  useEffect(() => {
    if (chatMessages.length > 0) {
      setMessages(chatMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        userId: msg.userId,
        username: msg.username,
        createdAt: msg.createdAt,
        type: msg.type || 'text'
      })));
    }
  }, [chatMessages]);

  // Auto-join room on load
  useEffect(() => {
    if (room && user) {
      joinRoomMutation.mutate();
    }
  }, [room, user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'participants-list':
        setParticipants(data.participants);
        break;
        
      case 'user-joined':
        setParticipants(prev => [...prev, data.user]);
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `${data.user.fullName || data.user.username} xonaga qo'shildi`,
          userId: 0,
          username: 'System',
          createdAt: new Date().toISOString(),
          type: 'system'
        }]);
        break;
        
      case 'user-left':
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `${data.username} xonani tark etdi`,
          userId: 0,
          username: 'System',
          createdAt: new Date().toISOString(),
          type: 'system'
        }]);
        break;
        
      case 'chat-message':
        setMessages(prev => [...prev, data.message]);
        break;
        
      case 'screen-share-started':
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `${data.username} ekran ulashishni boshladi`,
          userId: 0,
          username: 'System',
          createdAt: new Date().toISOString(),
          type: 'system'
        }]);
        break;
        
      case 'screen-share-ended':
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `Ekran ulashish tugadi`,
          userId: 0,
          username: 'System',
          createdAt: new Date().toISOString(),
          type: 'system'
        }]);
        break;
        
      case 'error':
        console.error('WebSocket error:', data.message);
        break;
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat-message',
      content: newMessage.trim()
    }));

    setNewMessage("");
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  const toggleScreenShare = () => {
    if (!wsRef.current || !isConnected) return;

    if (isScreenSharing) {
      wsRef.current.send(JSON.stringify({
        type: 'screen-share-end'
      }));
      setIsScreenSharing(false);
    } else {
      wsRef.current.send(JSON.stringify({
        type: 'screen-share-start'
      }));
      setIsScreenSharing(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const leaveRoom = () => {
    leaveRoomMutation.mutate();
  };

  const copyRoomCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Xona topilmadi</h3>
            <p className="text-gray-600 text-center mb-4">
              Siz qidirayotgan study xonasi mavjud emas yoki o'chirilgan.
            </p>
            <Button onClick={() => window.location.href = "/study-rooms"}>
              Study xonalarga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold">{room.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Kod: {room.roomCode}</span>
              <Button variant="ghost" size="sm" onClick={copyRoomCode}>
                <Copy className="w-3 h-3" />
              </Button>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Ulangan" : "Ulanmagan"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowParticipants(!showParticipants)}>
            <Users className="w-4 h-4 mr-2" />
            {participants.length}
          </Button>
          
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          
          <Button variant="destructive" size="sm" onClick={leaveRoom}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Chiqish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Area */}
          <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Video konferensiya</h3>
              <p className="text-gray-300 mb-4">
                Kamera va mikrofon funksiyalari tez orada qo'shiladi
              </p>
              
              {/* Whiteboard Toggle */}
              <Button 
                variant={showWhiteboard ? "default" : "outline"}
                onClick={() => setShowWhiteboard(!showWhiteboard)}
                className="mr-2"
              >
                <Palette className="w-4 h-4 mr-2" />
                {showWhiteboard ? "Whiteboardni yashirish" : "Whiteboard"}
              </Button>
            </div>

            {/* Whiteboard */}
            {showWhiteboard && (
              <div className="absolute inset-4 bg-white rounded-lg shadow-lg">
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Palette className="w-12 h-12 mx-auto mb-4" />
                    <p>Whiteboard funksiyasi tez orada</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center gap-4">
            <Button
              variant={isMicOn ? "default" : "secondary"}
              size="lg"
              onClick={toggleMic}
              className="rounded-full w-12 h-12"
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isCameraOn ? "default" : "secondary"}
              size="lg"
              onClick={toggleCamera}
              className="rounded-full w-12 h-12"
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              onClick={toggleScreenShare}
              className="rounded-full w-12 h-12"
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowChat(!showChat)}
              className="rounded-full w-12 h-12"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </h3>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`${
                      message.type === 'system' 
                        ? 'text-center text-sm text-gray-500 italic' 
                        : message.userId === user?.id
                          ? 'text-right'
                          : 'text-left'
                    }`}
                  >
                    {message.type === 'system' ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className={`inline-block max-w-xs ${
                        message.userId === user?.id
                          ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                          : 'bg-gray-200 text-gray-900 rounded-r-lg rounded-tl-lg'
                      } px-3 py-2`}>
                        {message.userId !== user?.id && (
                          <p className="text-xs opacity-75 mb-1">{message.username}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Xabar yozing..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={!isConnected}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <Sheet open={showParticipants} onOpenChange={setShowParticipants}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Ishtirokchilar ({participants.length})</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {participant.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.fullName || participant.username}</p>
                      <p className="text-xs text-gray-500">@{participant.username}</p>
                    </div>
                    
                    <Badge variant={
                      participant.role === 'host' ? 'default' : 
                      participant.role === 'moderator' ? 'secondary' : 'outline'
                    }>
                      {participant.role === 'host' ? 'Host' : 
                       participant.role === 'moderator' ? 'Moderator' : 'Ishtirokchi'}
                    </Badge>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}