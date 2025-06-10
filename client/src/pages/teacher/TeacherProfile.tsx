import React from 'react';
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

// Teacher Profile Schema
const teacherProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Ism-familya kamida 2 ta harfdan iborat bo\'lishi kerak')
    .max(50, 'Ism-familya 50 ta harfdan oshmasligi kerak'),
  phoneNumber: z.string().optional().or(z.literal('')),
  specialty: z.union([
    z.string()
      .min(2, 'Mutaxassislik kamida 2 ta harfdan iborat bo\'lishi kerak')
      .max(20, 'Mutaxassislik 20 ta harfdan oshmasligi kerak')
      .regex(/^[a-zA-ZўқғҳҚҒҲЎ\s]+$/, 'Mutaxassislikda faqat harflar bo\'lishi mumkin'),
    z.literal('')
  ]).optional(),
  bio: z.string()
    .max(200, 'Haqida bo\'limi 200 ta harfdan oshmasligi kerak')
    .optional()
    .or(z.literal('')),
  experience: z.number().min(0, 'Tajriba manfiy bo\'lishi mumkin emas').optional().or(z.nan()),
});

type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;

const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch teacher profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/profile/teacher'],
    retry: false,
  });

  const form = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      specialty: profile?.specialty || '',
      bio: profile?.bio || '',
      experience: profile?.experience || 0,
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: (data: TeacherProfileFormData) => 
      apiRequest('POST', '/api/profile/teacher', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/teacher'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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
    mutationFn: (data: TeacherProfileFormData) => 
      apiRequest('PUT', '/api/profile/teacher', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/teacher'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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

  const onSubmit = (data: TeacherProfileFormData) => {
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
      specialty: profile?.specialty || '',
      bio: profile?.bio || '',
      experience: profile?.experience || 0,
    });
  }, [profile, user, form]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">O'qituvchi Profil</h1>
              <p className="text-gray-600">Shaxsiy ma'lumotlaringizni boshqaring</p>
            </div>
            <Link href="/dashboard/teacher">
              <Button variant="outline">
                Orqaga
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="specialty">Mutaxassislik</Label>
                  <Input
                    id="specialty"
                    {...form.register('specialty')}
                    placeholder="Masalan: Matematika, Fizika, IT"
                    maxLength={20}
                  />
                  {form.formState.errors.specialty && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.specialty.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Ixtiyoriy. Maksimal 20 harf</p>
                </div>
                
                <div>
                  <Label htmlFor="experience">Tajriba (yillarda)</Label>
                  <Input
                    id="experience"
                    type="number"
                    {...form.register('experience', { valueAsNumber: true })}
                    placeholder="0"
                    min="0"
                  />
                  {form.formState.errors.experience && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.experience.message}</p>
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
                <p className="text-sm text-gray-500 mt-1">Maksimal 200 harf</p>
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
  );
};

export default TeacherProfile;