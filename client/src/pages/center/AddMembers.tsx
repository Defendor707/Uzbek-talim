import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import ResponsiveDashboard from "@/components/dashboard/ResponsiveDashboard";

interface MemberRequest {
  id: number;
  centerId: number;
  userId: number;
  userRole: 'teacher' | 'student';
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export default function AddMembers() {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('teacher');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  // Fetch existing requests
  const { data: requests = [], isLoading } = useQuery<MemberRequest[]>({
    queryKey: ['/api/center/member-requests'],
  });

  // Create member request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { username: string; userRole: 'teacher' | 'student'; message?: string }) => {
      const response = await fetch('/api/center/member-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'So\'rov yaratishda xatolik');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "So'rov muvaffaqiyatli yuborildi",
        description: "Foydalanuvchi tasdiqlasa, u sizning markazingizga qo'shiladi",
      });
      setUsername('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/center/member-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Xatolik",
        description: "Foydalanuvchi nomi kiritilishi kerak",
        variant: "destructive",
      });
      return;
    }
    createRequestMutation.mutate({ username, userRole, message });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      default:
        return status;
    }
  };

  return (
    <ResponsiveDashboard role="center">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">A'zolar qo'shish</h1>
          <p className="text-muted-foreground">O'qituvchi yoki o'quvchilarni markazingizga qo'shing</p>
        </div>

        <Tabs defaultValue="add" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Yangi a'zo qo'shish</TabsTrigger>
            <TabsTrigger value="requests">So'rovlar ({requests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Yangi a'zo qo'shish</CardTitle>
                <CardDescription>
                  Foydalanuvchi nomini kiriting va rolini tanlang. So'rov yuborilgandan keyin, foydalanuvchi tasdiqlashi kerak.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Foydalanuvchi roli</Label>
                    <RadioGroup value={userRole} onValueChange={(value) => setUserRole(value as 'teacher' | 'student')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="teacher" />
                        <Label htmlFor="teacher">O'qituvchi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student">O'quvchi</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Foydalanuvchi nomi</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Foydalanuvchi nomini kiriting"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Xabar (ixtiyoriy)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Qo'shimcha ma'lumot yoki taklif xabarini kiriting"
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createRequestMutation.isPending}
                    className="w-full"
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        So'rov yuborish
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Yuborilgan so'rovlar</CardTitle>
                <CardDescription>
                  Markazingizga a'zolar qo'shish uchun yuborilgan barcha so'rovlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : requests.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Hali so'rovlar yuborilmagan
                  </p>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {request.userRole === 'teacher' ? 'O\'qituvchi' : 'O\'quvchi'} so'rovi
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString('uz-UZ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className="text-sm">{getStatusText(request.status)}</span>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                        )}
                        {request.respondedAt && (
                          <p className="text-xs text-muted-foreground">
                            Javob berilgan: {new Date(request.respondedAt).toLocaleDateString('uz-UZ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboard>
  );
}