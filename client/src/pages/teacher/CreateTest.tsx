import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';

const testSchema = z.object({
  title: z.string().min(1, 'Test nomini kiriting'),
  description: z.string().optional(),
  type: z.enum(['public', 'numerical']),
  totalQuestions: z.number().min(5, 'Kamida 5 ta savol bo\'lishi kerak').max(90, 'Maksimal 90 ta savol'),
});

type TestFormData = z.infer<typeof testSchema>;

interface Question {
  questionText: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

const CreateTestPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'images' | 'questions'>('info');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testCode, setTestCode] = useState<string>('');

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      type: 'public',
      totalQuestions: 20,
    },
  });

  const [isCreatingTest, setIsCreatingTest] = useState(false);

  const handleTestInfoSubmit = (data: TestFormData) => {
    if (data.type === 'numerical') {
      setTestCode(Math.floor(100000 + Math.random() * 900000).toString());
    }
    setStep('images');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - uploadedImages.length);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const proceedToQuestions = () => {
    const formData = form.getValues();
    setQuestions(Array(formData.totalQuestions).fill(null).map(() => ({
      questionText: '',
      correctAnswer: 'A' as const
    })));
    setStep('questions');
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleCreateTest = async () => {
    const formData = form.getValues();
    
    // Validate that we have at least one question
    if (questions.length === 0) {
      toast({
        title: 'Xatolik',
        description: 'Kamida bitta savol qo\'shing',
        variant: 'destructive',
      });
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.questionText.trim()) {
        toast({
          title: 'Xatolik',
          description: 'Barcha savollar to\'ldirilishi kerak',
          variant: 'destructive',
        });
        return;
      }
      if (!question.correctAnswer) {
        toast({
          title: 'Xatolik',
          description: 'Barcha savollar uchun to\'g\'ri javob belgilanishi kerak',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsCreatingTest(true);
    
    try {
      // Prepare form data with images
      const testFormData = new FormData();
      testFormData.append('title', formData.title);
      testFormData.append('description', formData.description || '');
      testFormData.append('type', formData.type);
      testFormData.append('duration', '60');
      testFormData.append('totalQuestions', formData.totalQuestions.toString());
      testFormData.append('status', 'active');
      
      if (testCode) {
        testFormData.append('testCode', testCode);
      }

      // Add images
      uploadedImages.forEach((image, index) => {
        testFormData.append(`testImages`, image);
      });

      // Add questions
      testFormData.append('questions', JSON.stringify(questions.map((q, index) => ({
        questionText: q.questionText || `${index + 1}-savol`,
        questionType: 'simple',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: q.correctAnswer,
        points: 1,
        order: index + 1
      }))));

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Xatolik',
          description: 'Avtorizatsiya kerak. Iltimos, qaytadan kiring.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/tests/create-with-images', {
        method: 'POST',
        body: testFormData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast({
            title: 'Avtorizatsiya xatosi',
            description: 'Sessiya tugagan. Iltimos, qaytadan kiring.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(errorData.error || `Xatolik: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: 'Muvaffaqiyat',
        description: 'Test muvaffaqiyatli yaratildi!',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      
      // Reset and redirect
      form.reset();
      setStep('info');
      setUploadedImages([]);
      setQuestions([]);
      window.location.href = '/teacher/tests';
    } catch (error: any) {
      console.error('Test creation error:', error);
      toast({
        title: 'Xatolik',
        description: error.message || 'Test yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTest(false);
    }
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
      href: '/dashboard/teacher',
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
    },
    {
      id: 'tests',
      title: 'Testlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      href: '/teacher/tests'
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole="teacher" 
      sections={dashboardSections}
      currentPage="Test yaratish"
    >
      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${step === 'info' ? 'text-blue-600' : step === 'images' || step === 'questions' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'info' ? 'border-blue-600 bg-blue-50' : step === 'images' || step === 'questions' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              1
            </div>
            <span className="font-medium">Test ma'lumotlari</span>
          </div>
          <div className={`w-8 h-0.5 ${step === 'images' || step === 'questions' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center space-x-2 ${step === 'images' ? 'text-blue-600' : step === 'questions' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'images' ? 'border-blue-600 bg-blue-50' : step === 'questions' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="font-medium">Rasmlar</span>
          </div>
          <div className={`w-8 h-0.5 ${step === 'questions' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center space-x-2 ${step === 'questions' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'questions' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              3
            </div>
            <span className="font-medium">Savollar</span>
          </div>
        </div>

        {/* Step 1: Test Information */}
        {step === 'info' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Test ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleTestInfoSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="title">Test nomi *</Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="Test nomini kiriting"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Tavsif</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Test haqida qisqacha ma'lumot"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Test turi *</Label>
                  <Select onValueChange={(value) => form.setValue('type', value as 'public' | 'numerical')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Test turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Ommaviy test</SelectItem>
                      <SelectItem value="numerical">Maxsus raqamli test</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.type.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="totalQuestions">Savollar soni *</Label>
                  <Input
                    id="totalQuestions"
                    type="number"
                    min="5"
                    max="90"
                    {...form.register('totalQuestions', { valueAsNumber: true })}
                    placeholder="20"
                  />
                  {form.formState.errors.totalQuestions && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.totalQuestions.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Keyingi qadam: Rasmlar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Images */}
        {step === 'images' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Test rasmlari</CardTitle>
              <p className="text-gray-600">Test uchun rasmlar yuklang (ixtiyoriy)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="images">Rasmlar yuklash</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadedImages.length >= 5}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maksimal 5 ta rasm yuklash mumkin. JPG, PNG formatlarida.
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <div>
                  <Label>Yuklangan rasmlar ({uploadedImages.length}/5)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Rasm ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" onClick={proceedToQuestions} className="flex-1">
                  Keyingi qadam: Savollar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Questions */}
        {step === 'questions' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Savollar va javoblar</CardTitle>
              <p className="text-gray-600">Har bir savol uchun to'g'ri javobni belgilang</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-5 gap-4">
                {questions.map((_, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={currentQuestionIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={questions[index].correctAnswer ? "border-green-500" : ""}
                  >
                    {index + 1}
                    {questions[index].correctAnswer && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
                  </Button>
                ))}
              </div>

              {questions[currentQuestionIndex] && (
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">
                    {currentQuestionIndex + 1}-savol
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="questionText">Savol matni</Label>
                      <Input
                        id="questionText"
                        value={questions[currentQuestionIndex].questionText}
                        onChange={(e) => updateQuestion(currentQuestionIndex, 'questionText', e.target.value)}
                        placeholder={`${currentQuestionIndex + 1}-savol`}
                      />
                    </div>

                    <div>
                      <Label>To'g'ri javob</Label>
                      <div className="flex gap-4 mt-2">
                        {['A', 'B', 'C', 'D'].map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${currentQuestionIndex}`}
                              value={option}
                              checked={questions[currentQuestionIndex].correctAnswer === option}
                              onChange={(e) => updateQuestion(currentQuestionIndex, 'correctAnswer', e.target.value)}
                              className="text-blue-600"
                            />
                            <span className="font-medium">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                
                <div className="flex gap-3">
                  {currentQuestionIndex > 0 && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    >
                      Oldingi savol
                    </Button>
                  )}
                  
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button 
                      type="button"
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    >
                      Keyingi savol
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      onClick={handleCreateTest}
                      disabled={isCreatingTest}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isCreatingTest ? 'Yaratilmoqda...' : 'Testni yaratish'}
                    </Button>
                  )}
                </div>
              </div>

              {testCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    Maxsus test kodi: <span className="font-mono text-lg">{testCode}</span>
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    O'quvchilar ushbu kod orqali testni topa olishadi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveDashboard>
  );
};

export default CreateTestPage;