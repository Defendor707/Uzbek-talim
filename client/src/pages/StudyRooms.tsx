import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Video, MessageCircle, Palette, Share2, Plus, Search, Clock, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { StudyRoom, InsertStudyRoom } from "@shared/schema";
import ResponsiveDashboard from "@/components/ResponsiveDashboard";

const createRoomSchema = z.object({
  title: z.string().min(3, "Xona nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().optional(),
  type: z.enum(["public", "private", "class"]),
  maxParticipants: z.number().min(2).max(100),
  password: z.string().optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

export default function StudyRooms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "public",
      maxParticipants: 10,
      password: "",
      subject: "",
      grade: "",
    },
  });

  // Fetch active study rooms
  const { data: studyRooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ["/api/study-rooms"],
    queryFn: () => apiRequest("/api/study-rooms"),
  });

  // Fetch user's study rooms
  const { data: myRooms = [], isLoading: isLoadingMyRooms } = useQuery({
    queryKey: ["/api/my-study-rooms"],
    queryFn: () => apiRequest("/api/my-study-rooms"),
  });

  // Create study room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomFormData) => {
      return await apiRequest("/api/study-rooms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-study-rooms"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  // Join room by code mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (code: string) => {
      const room = await apiRequest(`/api/study-rooms/code/${code}`);
      await apiRequest(`/api/study-rooms/${room.id}/join`, {
        method: "POST",
      });
      return room;
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-study-rooms"] });
      // Navigate to the room
      window.location.href = `/study-room/${room.id}`;
    },
  });

  const onCreateRoom = (data: CreateRoomFormData) => {
    createRoomMutation.mutate(data);
  };

  const handleJoinRoom = (roomId: number) => {
    window.location.href = `/study-room/${roomId}`;
  };

  const handleJoinByCode = () => {
    if (joinCode.trim()) {
      joinRoomMutation.mutate(joinCode.trim().toUpperCase());
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "public": return "bg-green-100 text-green-800";
      case "private": return "bg-red-100 text-red-800";
      case "class": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoomTypeText = (type: string) => {
    switch (type) {
      case "public": return "Ochiq";
      case "private": return "Yopiq";
      case "class": return "Sinf";
      default: return type;
    }
  };

  const navItems = [
    { label: "Study Xonalar", href: "/study-rooms", icon: Video, isActive: true },
    ...(user?.role === "teacher" 
      ? [
          { label: "Testlar", href: "/teacher/tests", icon: Users },
          { label: "Darslar", href: "/teacher/lessons", icon: MessageCircle },
        ]
      : user?.role === "student"
      ? [
          { label: "Testlar", href: "/student", icon: Users },
          { label: "Darslar", href: "/student/lessons", icon: MessageCircle },
        ]
      : []
    ),
  ];

  return (
    <ResponsiveDashboard navItems={navItems}>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Study Xonalar</h1>
            <p className="text-gray-600">Jamoaviy o'rganish va hamkorlik uchun virtual xonalar</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Join by code */}
            <div className="flex gap-2">
              <Input
                placeholder="Xona kodi"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-32"
                maxLength={6}
              />
              <Button 
                onClick={handleJoinByCode}
                disabled={!joinCode.trim() || joinRoomMutation.isPending}
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" />
                Qo'shilish
              </Button>
            </div>

            {/* Create room */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Xona yaratish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Yangi Study Xona</DialogTitle>
                  <DialogDescription>
                    Jamoaviy o'rganish uchun yangi virtual xona yarating
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateRoom)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Xona nomi</FormLabel>
                          <FormControl>
                            <Input placeholder="Matematika darsi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tavsif (ixtiyoriy)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Xona haqida qisqacha ma'lumot" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Turi</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="public">Ochiq</SelectItem>
                                <SelectItem value="private">Yopiq</SelectItem>
                                <SelectItem value="class">Sinf</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maksimal ishtirokchilar</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={2} 
                                max={100} 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("type") === "private" && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parol</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Xona paroli" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fan (ixtiyoriy)</FormLabel>
                            <FormControl>
                              <Input placeholder="Matematika" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sinf (ixtiyoriy)</FormLabel>
                            <FormControl>
                              <Input placeholder="9-sinf" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={createRoomMutation.isPending} className="flex-1">
                        {createRoomMutation.isPending ? "Yaratilmoqda..." : "Xona yaratish"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Bekor qilish
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Barcha xonalar</TabsTrigger>
            <TabsTrigger value="my-rooms">Mening xonalarim</TabsTrigger>
            <TabsTrigger value="joined">Qo'shilgan xonalar</TabsTrigger>
          </TabsList>

          {/* All Rooms */}
          <TabsContent value="all" className="space-y-4">
            {isLoadingRooms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : studyRooms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Hech qanday xona yo'q</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Hozircha faol study xonalar mavjud emas. Birinchi bo'lib xona yarating!
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Xona yaratish
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyRooms.map((room: StudyRoom) => (
                  <Card key={room.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {room.title}
                            {room.type === "private" && <Lock className="w-4 h-4 text-gray-500" />}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge className={getRoomTypeColor(room.type)}>
                              {getRoomTypeText(room.type)}
                            </Badge>
                            {room.subject && (
                              <Badge variant="outline">{room.subject}</Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {room.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{room.currentParticipants || 0}/{room.maxParticipants || 50}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Faol</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleJoinRoom(room.id)}
                          className="flex-1"
                          disabled={(room.currentParticipants || 0) >= (room.maxParticipants || 50)}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Qo'shilish
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(room.roomCode)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500 text-center">
                        Xona kodi: <span className="font-mono font-medium">{room.roomCode}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Rooms */}
          <TabsContent value="my-rooms" className="space-y-4">
            {isLoadingMyRooms ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myRooms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sizning xonalaringiz yo'q</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Siz hali hech qanday xona yaratmagansiz yoki qo'shilmagansiz.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Birinchi xonani yaratish
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRooms.map((room: any) => (
                  <Card key={room.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium">{room.title}</h3>
                            <Badge className={getRoomTypeColor(room.type)}>
                              {getRoomTypeText(room.type)}
                            </Badge>
                            <Badge variant={room.role === 'host' ? 'default' : 'secondary'}>
                              {room.role === 'host' ? 'Host' : room.role === 'moderator' ? 'Moderator' : 'Ishtirokchi'}
                            </Badge>
                          </div>
                          
                          {room.description && (
                            <p className="text-gray-600 mb-3">{room.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{room.currentParticipants || 0}/{room.maxParticipants || 50}</span>
                            </div>
                            {room.subject && (
                              <div className="flex items-center gap-1">
                                <span>Fan: {room.subject}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span>Kod: <span className="font-mono">{room.roomCode}</span></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => handleJoinRoom(room.id)}>
                            <Video className="w-4 h-4 mr-2" />
                            Kirish
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(room.roomCode)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Joined Rooms - Same content as My Rooms for now */}
          <TabsContent value="joined">
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tez orada...</h3>
              <p className="text-gray-600">Bu bo'lim hali ishlab chiqilmoqda</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboard>
  );
}