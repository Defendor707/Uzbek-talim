import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import useAuth from '@/hooks/useAuth';

const editTestSchema = z.object({
  title: z.string().min(1, "Test sarlavhasi majburiy"),
  description: z.string().optional(),
  type: z.enum(['simple', 'open', 'dtm', 'certificate', 'disciplinary', 'public', 'numerical']),
  status: z.enum(['draft', 'active', 'completed']),
  grade: z.string().optional(),
  classroom: z.string().optional(),
  timeLimit: z.number().min(1, "Vaqt chegarasi majburiy").optional(),
  totalQuestions: z.number().min(1, "Savollar soni majburiy").optional(),
  testCode: z.string().optional(),
});

type EditTestForm = z.infer<typeof editTestSchema>;

const EditTestPage: React.FC = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<any[]>([]);

  // Fetch test data
  const { data: test, isLoading } = useQuery<any>({
    queryKey: [`/api/tests/${id}`],
    enabled: !!id,
  });

  // Fetch questions for this test
  const { data: testQuestions } = useQuery<any[]>({
    queryKey: [`/api/tests/${id}/questions`],
    enabled: !!id,
  });

  const form = useForm<EditTestForm>({
    resolver: zodResolver(editTestSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'simple',
      status: 'draft',
      grade: '',
      classroom: '',
      timeLimit: 60,
      totalQuestions: 0,
      testCode: '',
    },
  });

  // Update form when test data is loaded
  useEffect(() => {
    if (test && Object.keys(test).length > 0) {
      form.reset({
        title: test.title || '',
        description: test.description || '',
        type: test.type || 'simple',
        status: test.status || 'draft',
        grade: test.grade || '',
        classroom: test.classroom || '',
        timeLimit: test.timeLimit || 60,
        totalQuestions: test.totalQuestions || 0,
        testCode: test.testCode || '',
      });
    }
  }, [test, form]);

  // Update questions when fetched
  useEffect(() => {
    if (testQuestions && Array.isArray(testQuestions)) {
      setQuestions(testQuestions);
    }
  }, [testQuestions]);

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (data: EditTestForm) => {
      const response = await fetch(`/api/tests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Test yangilashda xatolik');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyat',
        description: 'Test muvaffaqiyatli yangilandi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}`] });
      setLocation('/teacher/tests');
    },
    onError: () => {
      toast({
        title: 'Xatolik',
        description: 'Test yangilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Savolni o\'chirishda xatolik');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyat',
        description: 'Savol muvaffaqiyatli o\'chirildi',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}/questions`] });
    },
    onError: () => {
      toast({
        title: 'Xatolik',
        description: 'Savolni o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditTestForm) => {
    updateTestMutation.mutate(data);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm('Bu savolni o\'chirishni xohlaysizmi?')) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/dashboard/teacher',
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/teacher/tests',
      badge: 0,
    },
    {
      id: 'lessons',
      title: 'Darsliklar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/teacher/lessons',
      badge: 0,
    },
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard sections={dashboardSections} userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ResponsiveDashboard>
    );
  }

  if (!test) {
    return (
      <ResponsiveDashboard sections={dashboardSections} userRole="teacher">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Test topilmadi</h3>
          <p className="text-gray-600">So'ralgan test mavjud emas yoki o'chirilgan.</p>
          <Button onClick={() => setLocation('/teacher/tests')} className="mt-4">
            Testlar ro'yxatiga qaytish
          </Button>
        </div>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard sections={dashboardSections} userRole="teacher">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test tahrirlash</h1>
            <p className="text-gray-600">Test ma'lumotlarini o'zgartiring</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/teacher/tests')}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Orqaga
          </Button>
        </div>

        {/* Test Info Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test sarlavhasi</FormLabel>
                        <FormControl>
                          <Input placeholder="Test sarlavhasini kiriting" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test turi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Test turini tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Oddiy test</SelectItem>
                            <SelectItem value="open">Ochiq test</SelectItem>
                            <SelectItem value="dtm">DTM test</SelectItem>
                            <SelectItem value="certificate">Sertifikat test</SelectItem>
                            <SelectItem value="disciplinary">Intizomiy test</SelectItem>
                            <SelectItem value="public">Ommaviy test</SelectItem>
                            <SelectItem value="numerical">Raqamli test</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test holati</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Test holatini tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Qoralama</SelectItem>
                            <SelectItem value="active">Faol</SelectItem>
                            <SelectItem value="completed">Tugallangan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vaqt chegarasi (daqiqa)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="60" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sinf</FormLabel>
                        <FormControl>
                          <Input placeholder="1-sinf" {...field} />
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
                        <FormLabel>Xona</FormLabel>
                        <FormControl>
                          <Input placeholder="A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test tavsifi</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Test haqida qo'shimcha ma'lumot..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('type') === 'numerical' && (
                  <FormField
                    control={form.control}
                    name="testCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test kodi (6 raqam)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" maxLength={6} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/teacher/tests')}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTestMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateTestMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Savollar ({questions.length})</CardTitle>
              <Button 
                onClick={() => setLocation(`/teacher/tests/${id}/questions/add`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Savol qo'shish
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          {question.hasImage && (
                            <Badge variant="secondary">Rasm bor</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-2">{question.questionText}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>A:</strong> {question.optionA}</p>
                          <p><strong>B:</strong> {question.optionB}</p>
                          <p><strong>C:</strong> {question.optionC}</p>
                          <p><strong>D:</strong> {question.optionD}</p>
                          <p className="text-green-600"><strong>To'g'ri javob:</strong> {question.correctAnswer}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/teacher/tests/${id}/questions/edit/${question.id}`)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={deleteQuestionMutation.isPending}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Savollar mavjud emas</h3>
                <p className="text-gray-600 mb-4">Bu testda hozircha savollar yo'q. Birinchi savolni qo'shing.</p>
                <Button 
                  onClick={() => setLocation(`/teacher/tests/${id}/questions/add`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Birinchi savolni qo'shish
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveDashboard>
  );
};

export default EditTestPage;