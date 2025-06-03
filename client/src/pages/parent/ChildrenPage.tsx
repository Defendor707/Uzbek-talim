import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import { Plus, Users, ArrowLeft, User } from 'lucide-react';

const addChildSchema = z.object({
  childUsername: z.string().min(1, "Farzand username kiriting"),
});

const ChildrenPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof addChildSchema>>({
    resolver: zodResolver(addChildSchema),
    defaultValues: {
      childUsername: "",
    },
  });

  // Fetch children data
  const { data: children, isLoading } = useQuery<any[]>({
    queryKey: ['/api/parent/children'],
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addChildSchema>) => {
      const response = await fetch('/api/parent/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Farzand qo\'shishda xatolik');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parent/children'] });
      toast({
        title: "Muvaffaqiyat",
        description: "Farzand muvaffaqiyatli qo'shildi",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof addChildSchema>) => {
    addChildMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/parent">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Orqaga
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Farzandlarim</h1>
                <p className="text-gray-600">Farzandlar ro'yxati va boshqaruv</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Farzand qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Farzand qo'shish</DialogTitle>
                  <DialogDescription>
                    Farzandingizning username (foydalanuvchi nomi) orqali uni hisobingizga bog'lang.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="childUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farzand username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="farzand_username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        type="submit"
                        disabled={addChildMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {addChildMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child: any) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{child.fullName}</CardTitle>
                      <CardDescription>@{child.username}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {child.phoneNumber && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📞</span>
                        <span>{child.phoneNumber}</span>
                      </div>
                    )}
                    {child.bio && (
                      <div className="text-sm text-gray-600">
                        <p className="line-clamp-2">{child.bio}</p>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>📅</span>
                      <span>Qo'shilgan: {new Date(child.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hozircha farzandlar yo'q
            </h3>
            <p className="text-gray-600 mb-6">
              Farzandlaringizni qo'shib, ularning o'quv jarayonini kuzatib boring.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Birinchi farzandni qo'shish
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildrenPage;