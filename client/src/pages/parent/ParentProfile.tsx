import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Upload, Image, User } from 'lucide-react';

// Parent Profile Schema
const parentProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Ism-familya kamida 2 ta harfdan iborat bo\'lishi kerak')
    .max(50, 'Ism-familya 50 ta harfdan oshmasligi kerak'),
  phoneNumber: z.string().optional().or(z.literal('')),
});

type ParentProfileFormData = z.infer<typeof parentProfileSchema>;

const ParentProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch parent profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/profile/parent'],
    retry: false,
  });

  const form = useForm<ParentProfileFormData>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: (data: ParentProfileFormData) => 
      apiRequest('POST', '/api/profile/parent', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/parent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] }); // Refresh user data
      toast({
        title: 'Muvaffaqiyat',
        description: 'Profil muvaffaqiyatli yaratildi',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Profil yaratishda xatolik',
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ParentProfileFormData) => 
      apiRequest('PUT', '/api/profile/parent', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/parent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] }); // Refresh user data
      toast({
        title: 'Muvaffaqiyat',
        description: 'Profil muvaffaqiyatli yangilandi',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Profil yangilashda xatolik',
        variant: 'destructive',
      });
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/parent/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Rasm yuklashda xatolik');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/parent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Muvaffaqiyat',
        description: 'Profil rasmi muvaffaqiyatli yuklandi',
      });
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Rasm yuklashda xatolik',
        variant: 'destructive',
      });
    },
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Xatolik",
          description: "Rasm hajmi 5MB dan oshmasligi kerak",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    try {
      await uploadImageMutation.mutateAsync(selectedImage);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const onSubmit = (data: ParentProfileFormData) => {
    if (profile) {
      updateProfileMutation.mutate(data);
    } else {
      createProfileMutation.mutate(data);
    }
  };

  // Initialize form when profile or user loads
  React.useEffect(() => {
    form.reset({
      fullName: user?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
    });
  }, [profile, user, form]);

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
    },
    {
      id: 'results',
      title: 'Natijalar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/parent/results',
    },
    {
      id: 'notification-settings',
      title: 'Bildirishnoma',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V7a1 1 0 011-1h3a1 1 0 011 1v10z" />
        </svg>
      ),
      href: '/parent/notification-settings',
    }
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="parent" 
        sections={dashboardSections}
        currentPage="Ota-ona Profil"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Yuklanmoqda...</div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="parent" 
      sections={dashboardSections}
      currentPage="Ota-ona Profil"
    >
      <div>
        {/* Profile Content */}
        <div className="max-w-4xl mx-auto">
        
        {/* Profile Image Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil Rasmi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {/* Profile Image Display */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profil rasmi" 
                    className="w-full h-full object-cover"
                  />
                ) : user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt="Profil rasmi" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              
              {/* Upload Controls */}
              <div className="flex flex-col items-center space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="profileImageInput"
                />
                <Label 
                  htmlFor="profileImageInput"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Rasm tanlash
                </Label>
                
                {selectedImage && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{selectedImage.name}</span>
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadImageMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {uploadImageMutation.isPending ? 'Yuklanmoqda...' : 'Yuklash'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Bekor qilish
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">
                Rasm hajmi 5MB dan oshmasligi kerak. JPG, PNG formatlar qabul qilinadi.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profil Ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">To'liq ism *</Label>
                  <Input
                    id="fullName"
                    {...form.register('fullName')}
                    placeholder="Ism va familyangizni kiriting"
                    maxLength={50}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.fullName.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Majburiy maydon</p>
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Telefon raqam</Label>
                  <Input
                    id="phoneNumber"
                    {...form.register('phoneNumber')}
                    placeholder="+998901234567"
                    type="tel"
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Ixtiyoriy maydon</p>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Ota-ona profili
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Ism-familya va telefon raqamingizni kiritishingiz mumkin. 
                        Kelajakda qo'shimcha funksiyalar qo'shiladi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                >
                  {createProfileMutation.isPending || updateProfileMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </ResponsiveDashboard>
  );
};

export default ParentProfile;