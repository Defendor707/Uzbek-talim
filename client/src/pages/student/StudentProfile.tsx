import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Upload, Image, User } from 'lucide-react';

// Student Profile Schema
const studentProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Ism-familya kamida 2 ta harfdan iborat bo\'lishi kerak')
    .max(50, 'Ism-familya 50 ta harfdan oshmasligi kerak'),
  phoneNumber: z.string().optional().or(z.literal('')),
  bio: z.string()
    .max(200, 'Haqida bo\'limi 200 ta harfdan oshmasligi kerak')
    .optional()
    .or(z.literal('')),
});

type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch student profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/student/profile'],
    retry: false,
  });

  const form = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      bio: profile?.bio || '',
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: (data: StudentProfileFormData) => 
      apiRequest('POST', '/api/student/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
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
    mutationFn: (data: StudentProfileFormData) => 
      apiRequest('PUT', '/api/student/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
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
      
      const response = await fetch('/api/student/upload-image', {
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
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
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
      if (file.size > 10 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Xatolik",
          description: "Rasm hajmi 10MB dan oshmasligi kerak",
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

  const onSubmit = (data: StudentProfileFormData) => {
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
      bio: profile?.bio || '',
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
      href: '/dashboard/student',
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/student/tests',
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/student/lessons',
    }
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="student" 
        sections={dashboardSections}
        currentPage="O'quvchi Profil"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Yuklanmoqda...</div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="student" 
      sections={dashboardSections}
      currentPage="O'quvchi Profil"
    >
      <div>
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
                ) : profile?.profileImage ? (
                  <img 
                    src={profile.profileImage} 
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
                Rasm hajmi 10MB dan oshmasligi kerak. JPG, PNG formatlar qabul qilinadi.
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
                    placeholder="+998 90 123 45 67"
                    type="tel"
                  />
                  {form.formState.errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Ixtiyoriy</p>
                </div>
              </div>



              {/* Bio */}
              <div>
                <Label htmlFor="bio">Haqida</Label>
                <Textarea
                  id="bio"
                  {...form.register('bio')}
                  placeholder="O'zingiz haqingizda qisqacha ma'lumot..."
                  rows={4}
                  maxLength={200}
                />
                {form.formState.errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.bio.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Ixtiyoriy. Maksimal 200 harf</p>
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

export default StudentProfile;