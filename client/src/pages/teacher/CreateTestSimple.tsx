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
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';

const testSchema = z.object({
  title: z.string().min(1, 'Test nomini kiriting'),
  description: z.string().optional(),
  type: z.enum(['public', 'numerical']),
  totalQuestions: z.number().min(5, 'Kamida 5 ta savol bo\'lishi kerak').max(90, 'Maksimal 90 ta savol'),
});

type TestFormData = z.infer<typeof testSchema>;

interface Question {
  questionText: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

const CreateTestPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'images' | 'questions'>('info');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionGroup, setCurrentQuestionGroup] = useState(0);
  const [testCode, setTestCode] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  const questionsPerGroup = 5;

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      type: 'public',
      totalQuestions: 20,
    },
  });

  const handleTestInfoSubmit = (data: TestFormData) => {
    if (!data.type) {
      toast({
        title: 'Xatolik',
        description: 'Test turini tanlang',
        variant: 'destructive',
      });
      return;
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
    const totalQuestions = formData.totalQuestions;
    
    // Initialize questions array with empty questions
    const emptyQuestions: Question[] = Array.from({ length: totalQuestions }, (_, index) => ({
      questionText: `${index + 1}-savol`,
      correctAnswer: undefined,
    }));
    
    setQuestions(emptyQuestions);
    setStep('questions');
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleCreateTest = async () => {
    if (isCreating) return; // Prevent multiple submissions
    
    const formData = form.getValues();
    
    // Validate all questions have correct answers
    const incompleteQuestions = questions.filter(q => !q.correctAnswer);
    if (incompleteQuestions.length > 0) {
      toast({
        title: 'Xatolik',
        description: 'Barcha savollar uchun to\'g\'ri javobni belgilang',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Prepare form data with images
      const testFormData = new FormData();
      testFormData.append('title', formData.title);
      testFormData.append('description', formData.description || '');
      testFormData.append('type', formData.type === 'public' ? 'public' : 'numerical');
      testFormData.append('grade', '1');
      testFormData.append('classroom', '');
      testFormData.append('duration', '0');
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
        ...q,
        order: index + 1,
        points: 1,
        options: ['A', 'B', 'C', 'D']
      }))));

      const response = await fetch('/api/tests/create-with-images', {
        method: 'POST',
        body: testFormData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Test yaratishda xatolik');
      }

      const result = await response.json();
      
      // Backend tomonidan generatsiya qilingan test kodini olish
      const generatedTestCode = result.testCode;
      
      toast({
        title: 'Muvaffaqiyat',
        description: `Test muvaffaqiyatli yaratildi! ${generatedTestCode ? `Test kodi: ${generatedTestCode}` : ''}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      
      // Reset and redirect
      form.reset();
      setStep('info');
      setUploadedImages([]);
      setQuestions([]);
      setTestCode('');
      window.location.href = '/teacher/tests';
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message || 'Test yaratishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test yaratish</h1>
              <p className="text-sm sm:text-base text-gray-600">Yangi test yarating va savollarni qo'shing</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/teacher/tests" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Orqaga
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${step === 'info' ? 'text-blue-600' : step === 'images' || step === 'questions' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'info' ? 'border-blue-600 bg-blue-50' : step === 'images' || step === 'questions' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              1
            </div>
            <span className="font-medium text-sm sm:text-base">Test ma'lumotlari</span>
          </div>
          <div className={`hidden sm:block w-8 h-0.5 ${step === 'images' || step === 'questions' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center space-x-2 ${step === 'images' ? 'text-blue-600' : step === 'questions' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'images' ? 'border-blue-600 bg-blue-50' : step === 'questions' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="font-medium text-sm sm:text-base">Rasmlar</span>
          </div>
          <div className={`hidden sm:block w-8 h-0.5 ${step === 'questions' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center space-x-2 ${step === 'questions' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 'questions' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              3
            </div>
            <span className="font-medium text-sm sm:text-base">Savollar</span>
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
                    placeholder="Test haqida qo'shimcha ma'lumot (ixtiyoriy)"
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

                {/* Show test code for numerical tests */}
                {form.watch('type') === 'numerical' && testCode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Label className="text-blue-800 font-medium">Test kodi</Label>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{testCode}</div>
                    <p className="text-blue-600 text-sm mt-1">Bu kodni o'quvchilar botga yozib test topishadi</p>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Keyingi qadam: Rasmlar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Image Upload */}
        {step === 'images' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Rasm yuklash</CardTitle>
              <p className="text-gray-600">Testga maksimal 5 ta rasm qo'shishingiz mumkin (ixtiyoriy)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadedImages.length >= 5}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {uploadedImages.length}/5 rasm yuklandi
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="flex-1"
                >
                  Orqaga
                </Button>
                <Button
                  type="button"
                  onClick={proceedToQuestions}
                  className="flex-1"
                >
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
              <CardTitle>Savollar</CardTitle>
              <p className="text-gray-600">
                Guruh {currentQuestionGroup + 1} / {Math.ceil(questions.length / questionsPerGroup)} 
                (Savollar {currentQuestionGroup * questionsPerGroup + 1} - {Math.min((currentQuestionGroup + 1) * questionsPerGroup, questions.length)})
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length > 0 && (
                <div className="space-y-8">
                  {/* Current group questions */}
                  {questions
                    .slice(currentQuestionGroup * questionsPerGroup, (currentQuestionGroup + 1) * questionsPerGroup)
                    .map((question, index) => {
                      const actualIndex = currentQuestionGroup * questionsPerGroup + index;
                      return (
                        <div key={actualIndex} className="border rounded-lg p-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`question-${actualIndex}`} className="text-lg font-medium">
                                {actualIndex + 1}-savol
                              </Label>
                              <Input
                                id={`question-${actualIndex}`}
                                value={question.questionText}
                                onChange={(e) => updateQuestion(actualIndex, 'questionText', e.target.value)}
                                placeholder="Savolni kiriting"
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label className="text-sm text-gray-600">To'g'ri javob</Label>
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {['A', 'B', 'C', 'D'].map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateQuestion(actualIndex, 'correctAnswer', option as 'A' | 'B' | 'C' | 'D')}
                                    className={`p-2 border rounded-lg text-center font-medium transition-colors ${
                                      question.correctAnswer === option
                                        ? 'bg-green-500 text-white border-green-500'
                                        : 'bg-white hover:bg-gray-100 border-gray-200'
                                    }`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                              {!question.correctAnswer && (
                                <p className="text-red-500 text-xs mt-1">To'g'ri javobni tanlang</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('images')}
                    >
                      Orqaga
                    </Button>

                    <div className="flex gap-2">
                      {/* Previous group */}
                      {currentQuestionGroup > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentQuestionGroup(currentQuestionGroup - 1)}
                        >
                          Oldingi
                        </Button>
                      )}

                      {/* Next group or Save */}
                      {currentQuestionGroup < Math.ceil(questions.length / questionsPerGroup) - 1 ? (
                        <Button
                          type="button"
                          onClick={() => setCurrentQuestionGroup(currentQuestionGroup + 1)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Keyingi
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleCreateTest}
                          disabled={isCreating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isCreating ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateTestPage;