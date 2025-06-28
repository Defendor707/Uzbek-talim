import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Upload, 
  X, 
  Plus, 
  Clock, 
  Target, 
  Tag,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign
} from 'lucide-react';
// API request function
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Something went wrong');
  }
  
  return response.json();
};

// Form schema for lesson creation
const createLessonSchema = z.object({
  title: z.string()
    .min(5, "Darslik nomi kamida 5 ta harfdan iborat bo'lishi kerak")
    .max(100, "Darslik nomi 100 ta harfdan oshmasligi kerak"),
  description: z.string()
    .min(10, "Tavsif kamida 10 ta harfdan iborat bo'lishi kerak")
    .max(500, "Tavsif 500 ta harfdan oshmasligi kerak")
    .optional()
    .or(z.literal('')),
  topic: z.string()
    .min(3, "Mavzu kamida 3 ta harfdan iborat bo'lishi kerak")
    .max(50, "Mavzu 50 ta harfdan oshmasligi kerak")
    .optional()
    .or(z.literal('')),
  price: z.number().min(0, "Narx 0 dan kichik bo'lmasligi kerak").optional(),
  duration: z.number().min(1, "Davomiylik kamida 1 kun bo'lishi kerak").optional(),
  weeklyHours: z.number().min(1, "Haftalik soatlar kamida 1 soat bo'lishi kerak").max(168, "Haftalik soatlar 168 soatdan oshmasligi kerak").optional(),
  dailyLessonDuration: z.number().min(1, "Kunlik dars davomiyligi kamida 1 soat bo'lishi kerak").max(24, "Kunlik dars davomiyligi 24 soatdan oshmasligi kerak").optional(),
});

type CreateLessonFormData = z.infer<typeof createLessonSchema>;

const CreateLesson: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [dailySchedule, setDailySchedule] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const dashboardSections = [
    { id: 'dashboard', title: 'Bosh sahifa', href: '/dashboard/teacher', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tests', title: 'Testlar', href: '/teacher/tests', icon: <FileText className="w-4 h-4" /> },
    { id: 'lessons', title: 'Darsliklar', href: '/teacher/lessons', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const form = useForm<CreateLessonFormData>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: '',
      description: '',
      topic: '',
      price: 0,
      duration: 1,
      weeklyHours: 1,
      dailyLessonDuration: 1,
    },
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: CreateLessonFormData & { coverImage?: string; learningObjectives?: string[]; keywords?: string[]; dailySchedule?: string[] }) => {
      return await apiRequest('/api/lessons', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      toast({
        title: "Muvaffaqiyat!",
        description: "Darslik muvaffaqiyatli yaratildi",
      });
      navigate('/teacher/lessons');
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "Darslik yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Handle cover image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Xatolik",
          description: "Rasm hajmi 5MB dan oshmasligi kerak",
          variant: "destructive",
        });
        return;
      }
      
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add learning objective
  const addObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  // Remove learning objective
  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  // Add keyword
  const addKeyword = () => {
    if (newKeyword.trim()) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  // Remove keyword
  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: CreateLessonFormData) => {
    let coverImageUrl = '';
    
    // Upload cover image if exists
    if (coverImage) {
      const formData = new FormData();
      formData.append('image', coverImage);
      
      try {
        setUploadProgress(20);
        const response = await fetch('/api/lessons/upload-cover', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });
        
        setUploadProgress(80);
        
        if (!response.ok) {
          throw new Error('Rasm yuklashda xatolik');
        }
        
        const result = await response.json();
        coverImageUrl = result.imageUrl;
        setUploadProgress(100);
      } catch (error) {
        toast({
          title: "Xatolik",
          description: "Rasm yuklashda xatolik yuz berdi",
          variant: "destructive",
        });
        setUploadProgress(0);
        return;
      }
    }
    
    // Submit lesson data
    createLessonMutation.mutate({
      ...data,
      coverImage: coverImageUrl,
      learningObjectives: objectives,
      keywords: keywords,
      dailySchedule: dailySchedule,
    });
  };

  return (
    <ResponsiveDashboard 
      userRole="teacher" 
      sections={dashboardSections}
      currentPage="Yangi darslik"
    >
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Yangi darslik yaratish</h1>
            <p className="text-gray-600 mt-1">O'quvchilar uchun yangi darslik tayyorlang</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/teacher/lessons')}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Bekor qilish
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Asosiy ma'lumotlar
                    </CardTitle>
                    <CardDescription>
                      Darslik haqida asosiy ma'lumotlarni kiriting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Darslik nomi *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Masalan: Fotosintez jarayoni"
                              className="text-base"
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
                          <FormLabel>Qisqacha tavsif</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Darslik haqida qisqacha ma'lumot..."
                              rows={3}
                              className="resize-none text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mavzu</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Masalan: Biologiya - O'simliklar"
                              className="text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Pricing and Duration Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Narx va davomiylik
                    </CardTitle>
                    <CardDescription>
                      Darslik narxi va davomiylik ma'lumotlarini kiriting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Narx (so'm)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="0"
                                placeholder="0"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Davomiylik (kun)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="1"
                                placeholder="1"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weeklyHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Haftadan necha soat</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="1"
                                max="168"
                                placeholder="1"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dailyLessonDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>1 kunlik dars necha soat</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="1"
                                max="24"
                                placeholder="1"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      O'quv maqsadlari
                    </CardTitle>
                    <CardDescription>
                      O'quvchilar nimalarni o'rganishini belgilang
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="Maqsad kiriting"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                      />
                      <Button
                        type="button"
                        onClick={addObjective}
                        size="icon"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {objectives.length > 0 && (
                      <div className="space-y-2">
                        {objectives.map((objective, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="flex-1 text-sm">{objective}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => removeObjective(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Right Side */}
              <div className="space-y-6">
                {/* Cover Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Muqova rasmi
                    </CardTitle>
                    <CardDescription>
                      Darslik uchun muqova rasmini yuklang
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {coverImagePreview ? (
                        <div className="relative">
                          <img
                            src={coverImagePreview}
                            alt="Cover"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setCoverImage(null);
                              setCoverImagePreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Rasm yuklash uchun bosing
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG (maks. 5MB)
                          </p>
                        </div>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Yuklanmoqda...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Kunlik dars jadval
                    </CardTitle>
                    <CardDescription>
                      Kunning qaysi vaqtlarida dars o'tilishini kiriting (masalan: 09:00-10:00)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        placeholder="09:00-10:00"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newTimeSlot.trim() && !dailySchedule.includes(newTimeSlot.trim())) {
                            setDailySchedule([...dailySchedule, newTimeSlot.trim()]);
                            setNewTimeSlot('');
                          }
                        }}
                        className="px-4"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {dailySchedule.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dailySchedule.map((slot, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-2 px-3 py-1"
                          >
                            {slot}
                            <button
                              type="button"
                              onClick={() => {
                                setDailySchedule(dailySchedule.filter((_, i) => i !== index));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Kalit so'zlar
                    </CardTitle>
                    <CardDescription>
                      Qidiruv uchun kalit so'zlar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Kalit so'z"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      />
                      <Button
                        type="button"
                        onClick={addKeyword}
                        size="icon"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="px-2 py-1">
                            {keyword}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 ml-1 p-0"
                              onClick={() => removeKeyword(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end sticky bottom-0 bg-white p-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/teacher/lessons')}
                className="w-full sm:w-auto"
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={createLessonMutation.isPending}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {createLessonMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Darslikni yaratish
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ResponsiveDashboard>
  );
};

export default CreateLesson;