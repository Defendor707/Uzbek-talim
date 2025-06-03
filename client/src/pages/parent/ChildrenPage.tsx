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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/parent">
                <Button variant="ghost" size="sm" className="p-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Orqaga</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Farzandlarim</h1>
                <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Farzandlar ro'yxati va boshqaruv</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm">
                  <Plus className="w-5 h-5 mr-2" />
                  Farzand qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95%] max-w-md mx-auto rounded-lg">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-lg sm:text-xl">Farzand qo'shish</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Farzandingizning username (foydalanuvchi nomi) orqali uni hisobingizga bog'lang.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="childUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Farzand username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="farzand_username"
                              className="h-12 text-base border-2 border-gray-200 focus:border-green-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm border-2"
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        type="submit"
                        disabled={addChildMutation.isPending}
                        className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm bg-green-600 hover:bg-green-700"
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {children.map((child: any) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow border-2 border-gray-100">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg sm:text-base truncate">{child.fullName}</CardTitle>
                      <CardDescription className="text-base sm:text-sm">@{child.username}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    {child.phoneNumber && (
                      <div className="flex items-center space-x-2 text-sm sm:text-xs text-gray-600">
                        <span className="text-base">📞</span>
                        <span className="truncate">{child.phoneNumber}</span>
                      </div>
                    )}
                    {child.bio && (
                      <div className="text-sm sm:text-xs text-gray-600">
                        <p className="line-clamp-2">{child.bio}</p>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm sm:text-xs text-gray-500">
                      <span className="text-base">📅</span>
                      <span className="truncate">Qo'shilgan: {new Date(child.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-20 h-20 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-6 sm:mb-4" />
            <h3 className="text-xl sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-2">
              Hozircha farzandlar yo'q
            </h3>
            <p className="text-base sm:text-sm text-gray-600 mb-8 sm:mb-6 max-w-md mx-auto leading-relaxed">
              Farzandlaringizni qo'shib, ularning o'quv jarayonini kuzatib boring.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm">
                  <Plus className="w-5 h-5 mr-2" />
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