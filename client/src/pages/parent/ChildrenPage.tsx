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
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Users, ArrowLeft, User } from 'lucide-react';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';

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
      const response = await apiRequest('POST', '/api/parent/add-child', data);
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

  // Dashboard sections for navigation
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/parent',
    },
    {
      id: 'children',
      title: 'Farzandlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/parent/children',
      badge: children?.length || 0
    },
    {
      id: 'results',
      title: 'Natijalar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/parent/test-results',
    }
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="parent" 
        sections={dashboardSections}
        currentPage="Farzandlarim"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="parent" 
      sections={dashboardSections}
      currentPage="Farzandlarim"
    >
      <div>
        {/* Add Child Button */}
        <div className="mb-6 flex justify-end">
            
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
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

        {/* Children List */}
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
    </ResponsiveDashboard>
  );
};

export default ChildrenPage;