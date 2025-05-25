import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useAuth from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Form schema
const profileSchema = z.object({
  fullName: z.string().min(2, 'To\'liq ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Yaroqli email kiriting'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  // Role-specific fields
  grade: z.string().optional(),
  classroom: z.string().optional(),
  subjects: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!user,
  });
  
  // Fetch role-specific profile
  const { data: roleProfile, isLoading: isLoadingRoleProfile } = useQuery({
    queryKey: [`/api/profile/${user?.role}`],
    enabled: !!user?.role,
  });
  
  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/users/profile', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Profil muvaffaqiyatli yangilandi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Profilni yangilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Upload profile image mutation
  const { mutate: uploadImage } = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/users/profile/image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Rasmni yuklashda xatolik yuz berdi');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Profil rasmi muvaffaqiyatli yangilandi',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Rasmni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });
  
  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      grade: roleProfile?.grade || '',
      classroom: roleProfile?.classroom || '',
      subjects: Array.isArray(roleProfile?.subjects) ? roleProfile?.subjects.join(', ') : roleProfile?.subjects || '',
      address: roleProfile?.address || '',
      description: roleProfile?.description || '',
    },
  });
  
  // Update form values when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      form.setValue('fullName', profile.fullName);
      form.setValue('email', profile.email);
      form.setValue('phone', profile.phone || '');
      form.setValue('bio', profile.bio || '');
    }
    
    if (roleProfile) {
      if (user?.role === 'student') {
        form.setValue('grade', roleProfile.grade || '');
        form.setValue('classroom', roleProfile.classroom || '');
      } else if (user?.role === 'teacher') {
        form.setValue('subjects', Array.isArray(roleProfile.subjects) ? roleProfile.subjects.join(', ') : roleProfile.subjects || '');
      } else if (user?.role === 'center') {
        form.setValue('address', roleProfile.address || '');
        form.setValue('description', roleProfile.description || '');
      }
    }
  }, [profile, roleProfile, form, user?.role]);
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfile(data);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Xatolik',
        description: 'Faqat rasm yuklashingiz mumkin',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Xatolik',
        description: 'Rasm hajmi 5MB dan katta bo\'lmasligi kerak',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('profileImage', file);
    
    setIsUploading(true);
    uploadImage(formData);
  };
  
  if (isLoadingProfile || isLoadingRoleProfile) {
    return (
      <DashboardLayout title="Profil">
        <div className="flex justify-center items-center p-10">
          <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
          <span>Profil ma'lumotlari yuklanmoqda...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Profil">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Image and Info */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading font-medium text-neutral-dark">
                Shaxsiy ma'lumotlar
              </CardTitle>
              <CardDescription>
                Profil rasmi va asosiy ma'lumotlar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={profile?.profileImage} alt={profile?.fullName} />
                  <AvatarFallback className="text-3xl">{profile?.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer">
                    <span className="sr-only">Rasmni o'zgartirish</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={isUploading}
                    />
                    <span className="material-icons text-white">photo_camera</span>
                  </label>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="h-8 w-8 border-4 border-t-white border-white/30 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-medium text-neutral-dark">{profile?.fullName}</h3>
              <p className="text-sm text-neutral-medium mb-1">{profile?.email}</p>
              <div className="px-3 py-1 bg-blue-100 text-primary rounded-full text-xs mt-2">
                {user?.role === 'teacher' && 'O\'qituvchi'}
                {user?.role === 'student' && 'O\'quvchi'}
                {user?.role === 'parent' && 'Ota-ona'}
                {user?.role === 'center' && 'O\'quv markaz'}
              </div>
              
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-medium">Foydalanuvchi nomi:</span>
                  <span className="font-medium">{profile?.username}</span>
                </div>
                {user?.role === 'student' && roleProfile && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-medium">Sinf:</span>
                      <span className="font-medium">{roleProfile.grade}-{roleProfile.classroom}</span>
                    </div>
                  </>
                )}
                {user?.role === 'teacher' && roleProfile && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-medium">Fanlar:</span>
                    <span className="font-medium">
                      {Array.isArray(roleProfile.subjects) 
                        ? roleProfile.subjects.join(', ') 
                        : roleProfile.subjects || 'Ko\'rsatilmagan'}
                    </span>
                  </div>
                )}
                {user?.role === 'center' && roleProfile && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-medium">Manzil:</span>
                    <span className="font-medium">{roleProfile.address || 'Ko\'rsatilmagan'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-medium">Ro'yxatdan o'tgan sana:</span>
                  <span className="font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Noma\'lum'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Profile Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading font-medium text-neutral-dark">
                Profilni tahrirlash
              </CardTitle>
              <CardDescription>
                Shaxsiy ma'lumotlaringizni yangilang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal" className="pt-2">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Shaxsiy ma'lumotlar</TabsTrigger>
                  {user?.role === 'student' && (
                    <TabsTrigger value="education">Ta'lim ma'lumotlari</TabsTrigger>
                  )}
                  {user?.role === 'teacher' && (
                    <TabsTrigger value="professional">Kasbiy ma'lumotlar</TabsTrigger>
                  )}
                  {user?.role === 'center' && (
                    <TabsTrigger value="center">Markaz ma'lumotlari</TabsTrigger>
                  )}
                  <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <TabsContent value="personal">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>To'liq ism</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email manzil</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon raqam</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>O'zingiz haqingizda</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="O'zingiz haqingizda qisqacha ma'lumot"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    {user?.role === 'student' && (
                      <TabsContent value="education">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sinf</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="classroom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Guruh</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Alert>
                            <AlertDescription>
                              Ta'lim ma'lumotlarini o'zgartirish o'quv tizimi tomonidan tasdiqlanishi kerak.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </TabsContent>
                    )}
                    
                    {user?.role === 'teacher' && (
                      <TabsContent value="professional">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="subjects"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fanlar (vergul bilan ajrating)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Matematika, Fizika" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Alert>
                            <AlertDescription>
                              O'qitiladigan fanlarni o'zgartirish o'quv tizimi tomonidan tasdiqlanishi kerak.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </TabsContent>
                    )}
                    
                    {user?.role === 'center' && (
                      <TabsContent value="center">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Manzil</FormLabel>
                                <FormControl>
                                  <Input {...field} />
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
                                <FormLabel>Ta'rif</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="O'quv markaz haqida qisqacha ma'lumot"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    )}
                    
                    <TabsContent value="security">
                      <div className="space-y-4">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">Parolni o'zgartirish</h3>
                          <p className="text-sm text-neutral-medium">
                            Parolni o'zgartirish uchun alohida so'rov yuboriladi
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <Input type="password" placeholder="Joriy parol" disabled />
                          <Input type="password" placeholder="Yangi parol" disabled />
                          <Input type="password" placeholder="Yangi parolni tasdiqlang" disabled />
                        </div>
                        
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Ma\'lumot',
                              description: 'Parolni o\'zgartirish funksiyasi hozircha mavjud emas',
                            });
                          }}
                        >
                          Parolni o'zgartirish
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <div className="mt-6 flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        Bekor qilish
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isUpdating}
                        className="bg-primary hover:bg-primary-dark text-white"
                      >
                        {isUpdating ? (
                          <>
                            <span className="material-icons animate-spin mr-2">refresh</span>
                            Saqlanmoqda...
                          </>
                        ) : (
                          'Saqlash'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
