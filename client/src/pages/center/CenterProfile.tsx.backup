import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Building2, MapPin, Phone, Mail, Globe, User, Calendar, FileText, Users, Clock, Plus, X, Upload, Image } from 'lucide-react';
import * as schema from '@shared/schema';

// Center profile form schema
const centerProfileSchema = schema.insertCenterProfileSchema.extend({
  userId: z.number(),
});

type CenterProfileFormData = z.infer<typeof centerProfileSchema>;

const CenterProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newFacility, setNewFacility] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Fetch center profile
  const { data: profile, isLoading } = useQuery<schema.CenterProfile>({
    queryKey: ['/api/center/profile'],
    enabled: !!user,
  });

  // Initialize form
  const form = useForm<CenterProfileFormData>({
    resolver: zodResolver(centerProfileSchema),
    defaultValues: {
      userId: user?.id || 0,
      centerName: '',
      address: '',
      phoneNumber: '',
      email: '',
      website: '',
      description: '',
      director: '',
      establishedYear: undefined,
      capacity: undefined,
      specializations: [],
      facilities: [],
      workingHours: '',
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        userId: profile.userId,
        centerName: profile.centerName || '',
        address: profile.address || '',
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || '',
        website: profile.website || '',
        description: profile.description || '',
        director: profile.director || '',
        establishedYear: profile.establishedYear ?? undefined,
        capacity: profile.capacity ?? undefined,
        specializations: profile.specializations || [],
        facilities: profile.facilities || [],
        workingHours: profile.workingHours || '',
      });
    }
  }, [profile, form]);

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await apiRequest('POST', '/api/center/upload-image', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Muvaffaqiyat",
        description: "Rasm muvaffaqiyatli yuklandi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/center/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Rasm yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: CenterProfileFormData) => 
      apiRequest(profile ? 'PUT' : 'POST', '/api/center/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/center/profile'] });
      toast({
        title: "Muvaffaqiyat",
        description: "Profil ma'lumotlari saqlandi",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Profilni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CenterProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      const current = form.getValues('specializations') || [];
      form.setValue('specializations', [...current, newSpecialization.trim()]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    const current = form.getValues('specializations') || [];
    form.setValue('specializations', current.filter((_, i) => i !== index));
  };

  const addFacility = () => {
    if (newFacility.trim()) {
      const current = form.getValues('facilities') || [];
      form.setValue('facilities', [...current, newFacility.trim()]);
      setNewFacility('');
    }
  };

  const removeFacility = (index: number) => {
    const current = form.getValues('facilities') || [];
    form.setValue('facilities', current.filter((_, i) => i !== index));
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
      href: '/dashboard/center',
    },
    {
      id: 'teachers',
      title: 'O\'qituvchilar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/center/teachers',
    },
    {
      id: 'students',
      title: 'O\'quvchilar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: '/center/students',
    }
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="center" 
        sections={dashboardSections}
        currentPage="Profil"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Profil ma'lumotlari yuklanmoqda...</p>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard 
      userRole="center" 
      sections={dashboardSections}
      currentPage="Profil"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Markaz profili</h1>
            <p className="text-gray-600">O'quv markazi ma'lumotlarini boshqaring</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Building2 className="w-4 h-4 mr-2" />
                Tahrirlash
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      form.reset({
                        userId: profile.userId,
                        centerName: profile.centerName || '',
                        address: profile.address || '',
                        phoneNumber: profile.phoneNumber || '',
                        email: profile.email || '',
                        website: profile.website || '',
                        description: profile.description || '',
                        director: profile.director || '',
                        establishedYear: profile.establishedYear || undefined,

                        capacity: profile.capacity || undefined,
                        specializations: profile.specializations || [],
                        facilities: profile.facilities || [],
                        workingHours: profile.workingHours || '',
                      });
                    }
                  }}
                >
                  Bekor qilish
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Asosiy ma'lumotlar
                </CardTitle>
                <CardDescription>
                  Markaz haqidagi asosiy ma'lumotlar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Image Upload Section */}
                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : profile?.profileImage ? (
                        <img src={profile.profileImage} alt="Markaz rasmi" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="profile-image-upload"
                        disabled={!isEditing}
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50 ${
                          !isEditing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Rasm tanlash
                      </label>
                      {selectedImage && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleImageUpload}
                          disabled={uploadImageMutation.isPending}
                        >
                          {uploadImageMutation.isPending ? 'Yuklanmoqda...' : 'Rasm yuklash'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Markaz rasmini yuklang (maksimal 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="centerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Markaz nomi *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="O'quv markazi nomi"
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="director"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direktor</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Direktor F.I.O"
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon raqam</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="+998 XX XXX XX XX"
                            disabled={!isEditing}
                          />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="markaz@example.com"
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veb-sayt</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://markaz.uz"
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="establishedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tashkil etilgan yil</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number"
                            min="1900"
                            max={new Date().getFullYear()}
                            placeholder="2020"
                            disabled={!isEditing}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>O'quvchilar sig'imi</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number"
                            min="1"
                            placeholder="100"
                            disabled={!isEditing}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manzil *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="To'liq manzil"
                          disabled={!isEditing}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ish vaqti</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Du-Shan: 9:00-18:00"
                          disabled={!isEditing}
                        />
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
                          placeholder="Markaz haqida qisqacha ma'lumot"
                          disabled={!isEditing}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardHeader>
                <CardTitle>Mutaxassisliklar</CardTitle>
                <CardDescription>
                  Markaz yo'nalishlari va mutaxassisliklari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {form.watch('specializations')?.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      placeholder="Yangi mutaxassislik qo'shish"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                    />
                    <Button type="button" onClick={addSpecialization} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card>
              <CardHeader>
                <CardTitle>Imkoniyatlar</CardTitle>
                <CardDescription>
                  Markaz imkoniyatlari va jihozlari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {form.watch('facilities')?.map((facility, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {facility}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFacility(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      value={newFacility}
                      onChange={(e) => setNewFacility(e.target.value)}
                      placeholder="Yangi imkoniyat qo'shish"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                    />
                    <Button type="button" onClick={addFacility} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </ResponsiveDashboard>
  );
};

export default CenterProfile;