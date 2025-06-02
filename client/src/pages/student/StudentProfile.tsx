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

// Student Profile Schema
const studentProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Ism-familya kamida 2 ta harfdan iborat bo\'lishi kerak')
    .max(50, 'Ism-familya 50 ta harfdan oshmasligi kerak'),
  age: z.number()
    .min(5, 'Yosh 5 dan kichik bo\'lishi mumkin emas')
    .max(25, 'Yosh 25 dan katta bo\'lishi mumkin emas'),
  grade: z.string()
    .min(1, 'Sinf ko\'rsatilishi shart'),
  classroom: z.string()
    .min(1, 'Sinf-guruh ko\'rsatilishi shart'),
  subjects: z.array(z.string()).optional(),
});

type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch student profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/profile/student'],
    retry: false,
  });

  const form = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      age: 16,
      grade: '',
      classroom: '',
      subjects: [],
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: (data: StudentProfileFormData) => 
      apiRequest('POST', '/api/profile/student', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/student'] });
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
      apiRequest('PUT', '/api/profile/student', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/student'] });
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
      age: profile?.age || 16,
      grade: profile?.grade || '',
      classroom: profile?.classroom || '',
      subjects: profile?.subjects || [],
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
              <h1 className="text-2xl font-bold text-gray-900">O'quvchi Profil</h1>
              <p className="text-gray-600">Shaxsiy ma'lumotlaringizni boshqaring</p>
            </div>
            <Link href="/dashboard/student">
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
                  <Label htmlFor="age">Yoshi *</Label>
                  <Input
                    id="age"
                    type="number"
                    {...form.register('age', { valueAsNumber: true })}
                    placeholder="16"
                    min="5"
                    max="25"
                  />
                  {form.formState.errors.age && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.age.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">5-25 yosh oraligi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="grade">Sinf *</Label>
                  <Input
                    id="grade"
                    {...form.register('grade')}
                    placeholder="Masalan: 9"
                  />
                  {form.formState.errors.grade && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.grade.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Majburiy maydon</p>
                </div>
                
                <div>
                  <Label htmlFor="classroom">Sinf-guruh *</Label>
                  <Input
                    id="classroom"
                    {...form.register('classroom')}
                    placeholder="Masalan: 9-A"
                  />
                  {form.formState.errors.classroom && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.classroom.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Majburiy maydon</p>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <Label htmlFor="subjects">Tayyorgarlik fanlari</Label>
                <Textarea
                  id="subjects"
                  placeholder="Masalan: Matematika, Fizika, Kimyo, Ingliz tili"
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">Vergul bilan ajrating</p>
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

export default StudentProfile;