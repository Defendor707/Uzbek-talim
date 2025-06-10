import React from 'react';
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
              <h1 className="text-2xl font-bold text-gray-900">Ota-ona Profil</h1>
              <p className="text-gray-600">Shaxsiy ma'lumotlaringizni boshqaring</p>
            </div>
            <Link href="/dashboard/parent">
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
  );
};

export default ParentProfile;