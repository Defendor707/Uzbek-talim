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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import useAuth from '@/hooks/useAuth';

// Teacher Profile Schema
const teacherProfileSchema = z.object({
  specialty: z.string()
    .min(2, 'Mutaxassislik kamida 2 ta harfdan iborat bo\'lishi kerak')
    .max(20, 'Mutaxassislik 20 ta harfdan oshmasligi kerak')
    .regex(/^[a-zA-ZўқғҳҚҒҲЎ\s]+$/, 'Mutaxassislikda faqat harflar bo\'lishi mumkin'),
  bio: z.string()
    .max(200, 'Haqida bo\'limi 200 ta harfdan oshmasligi kerak')
    .optional(),
  experience: z.number().min(0, 'Tajriba manfiy bo\'lishi mumkin emas').optional(),
});

type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;

const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch teacher profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/profile/teacher'],
    retry: false,
  });

  const form = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      specialty: profile?.specialty || '',
      bio: profile?.bio || '',
      experience: profile?.experience || 0,
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: TeacherProfileFormData) => {
      const response = await apiRequest('POST', '/api/profile/teacher', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/teacher'] });
      setIsEditing(false);
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Profil yaratildi',
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
    mutationFn: async (data: TeacherProfileFormData) => {
      const response = await apiRequest('PUT', '/api/profile/teacher', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/teacher'] });
      setIsEditing(false);
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Profil yangilandi',
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

  // Initialize form when profile loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        specialty: profile.specialty || '',
        bio: profile.bio || '',
        experience: profile.experience || 0,
      });
    }
  }, [profile, form]);

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
            <div className="flex justify-between items-center">
              <CardTitle>Profil Ma'lumotlari</CardTitle>
              {profile && !isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Tahrirlash
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!profile && !isEditing ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Profilingiz hali yaratilmagan</p>
                <Button onClick={() => setIsEditing(true)}>
                  Profil Yaratish
                </Button>
              </div>
            ) : isEditing ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">To'liq ism</Label>
                    <Input
                      id="fullName"
                      value={user?.fullName || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumot foydalanuvchi sozlamalarida o'zgartiriladi</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="specialty">Mutaxassislik *</Label>
                    <Input
                      id="specialty"
                      {...form.register('specialty')}
                      placeholder="Masalan: Matematika, Fizika, IT"
                      maxLength={20}
                    />
                    {form.formState.errors.specialty && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.specialty.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Maksimal 20 harf</p>
                  </div>
                </div>

                {/* Experience */}
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
                </div>



                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Haqida</Label>
                  <Textarea
                    id="bio"
                    {...form.register('bio')}
                    placeholder="O'zingiz haqingizda, erishgan yutuqlaringiz, tajribangiz va boshqa ma'lumotlar..."
                    maxLength={200}
                    rows={4}
                  />
                  <div className="flex justify-between mt-1">
                    {form.formState.errors.bio && (
                      <p className="text-red-500 text-sm">{form.formState.errors.bio.message}</p>
                    )}
                    <p className="text-sm text-gray-500 ml-auto">
                      {form.watch('bio')?.length || 0}/200
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                  >
                    {createProfileMutation.isPending || updateProfileMutation.isPending 
                      ? 'Saqlanmoqda...' 
                      : profile ? 'Yangilash' : 'Yaratish'
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Bekor qilish
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Display Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">To'liq ism</h3>
                    <p className="text-gray-600">{user?.fullName}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Mutaxassislik</h3>
                    <p className="text-gray-600">{profile.specialty}</p>
                  </div>
                </div>

                {profile.experience && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tajriba</h3>
                    <p className="text-gray-600">{profile.experience} yil</p>
                  </div>
                )}



                {profile.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Haqida</h3>
                    <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherProfile;