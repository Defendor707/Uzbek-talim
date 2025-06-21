import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import useAuth from '@/hooks/useAuth';

const editTestSchema = z.object({
  title: z.string().min(1, "Test sarlavhasi majburiy"),
  description: z.string().optional(),
  type: z.enum(['public', 'numerical']),
  status: z.enum(['draft', 'active', 'completed']),
  totalQuestions: z.number().min(1, "Savollar soni majburiy").optional(),
  testCode: z.string().optional(),
});

type EditTestForm = z.infer<typeof editTestSchema>;

interface Question {
  id?: number;
  questionText: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  hasImage?: boolean;
}

const EditTestPage: React.FC = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'info' | 'images' | 'questions'>('info');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionGroup, setCurrentQuestionGroup] = useState(0);
  const [testCode, setTestCode] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  const questionsPerGroup = 5;

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
      type: 'public',
      status: 'draft',
      totalQuestions: 0,
      testCode: '',
    },
  });

  // Initialize form and data when test is loaded
  useEffect(() => {
    if (test && Object.keys(test).length > 0) {
      form.reset({
        title: test.title || '',
        description: test.description || '',
        type: test.type === 'numerical' ? 'numerical' : 'public',
        status: test.status || 'draft',
        totalQuestions: test.totalQuestions || 0,
        testCode: test.testCode || '',
      });
      
      if (test.testCode) {
        setTestCode(test.testCode);
      }
      
      // Load existing images if any
      if (test.testImages && Array.isArray(test.testImages)) {
        setExistingImages(test.testImages);
      }
    }
  }, [test, form]);

  // Initialize questions when fetched
  useEffect(() => {
    if (testQuestions && Array.isArray(testQuestions)) {
      const formattedQuestions = testQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText || '',
        correctAnswer: q.correctAnswer || 'A',
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        hasImage: q.hasImage || false
      }));
      setQuestions(formattedQuestions);
    }
  }, [testQuestions]);

  const handleTestInfoSubmit = (data: EditTestForm) => {
    if (data.type === 'numerical' && !testCode) {
      setTestCode(Math.floor(100000 + Math.random() * 900000).toString());
    }
    setStep('images');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - uploadedImages.length - existingImages.length);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const proceedToQuestions = () => {
    const formData = form.getValues();
    if (questions.length === 0) {
      const newQuestions = Array(formData.totalQuestions || 10).fill(null).map(() => ({
        questionText: '',
        correctAnswer: 'A' as const
      }));
      setQuestions(newQuestions);
    }
    setStep('questions');
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleSaveTest = async () => {
    const formData = form.getValues();
    
    // Validate all questions have text and correct answers
    const incompleteQuestions = questions.filter(q => !q.questionText.trim() || !q.correctAnswer);
    if (incompleteQuestions.length > 0) {
      toast({
        title: 'Xatolik',
        description: 'Barcha savollar to\'ldirilishi va to\'g\'ri javob belgilanishi kerak',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare form data with images
      const testFormData = new FormData();
      testFormData.append('title', formData.title);
      testFormData.append('description', formData.description || '');
      testFormData.append('type', formData.type);
      testFormData.append('status', formData.status);
      testFormData.append('totalQuestions', formData.totalQuestions?.toString() || questions.length.toString());
      
      if (testCode) {
        testFormData.append('testCode', testCode);
      }

      // Add new images
      uploadedImages.forEach((image, index) => {
        testFormData.append(`testImages`, image);
      });

      // Add existing images to preserve them
      testFormData.append('existingImages', JSON.stringify(existingImages));

      // Add questions
      testFormData.append('questions', JSON.stringify(questions.map((q, index) => ({
        id: q.id,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        order: index + 1,
        points: 1,
        options: ['A', 'B', 'C', 'D']
      }))));

      const response = await fetch(`/api/tests/${id}/update-with-images`, {
        method: 'PUT',
        body: testFormData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Test yangilashda xatolik');
      }

      toast({
        title: 'Muvaffaqiyat',
        description: 'Test muvaffaqiyatli yangilandi!',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}`] });
      
      setLocation('/teacher/tests');
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message || 'Test yangilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test tahrirlash</h1>
              <p className="text-sm sm:text-base text-gray-600">Testni tahrirlang va o'zgarishlarni saqlang</p>
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

      {/* Progress indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full">
              {[
                { key: 'info', label: 'Ma\'lumotlar', step: 1 },
                { key: 'images', label: 'Rasmlar', step: 2 },
                { key: 'questions', label: 'Savollar', step: 3 }
              ].map((item, index) => (
                <div key={item.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                    step === item.key ? 'bg-blue-600 text-white' : 
                    (step === 'images' && item.key === 'info') || 
                    (step === 'questions' && (item.key === 'info' || item.key === 'images'))
                      ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {item.step}
                  </div>
                  <span className="ml-2 text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">
                    {item.label}
                  </span>
                  {index < 2 && <div className="w-4 sm:w-8 h-0.5 bg-gray-300 mx-1 sm:mx-2"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Step 1: Test Information */}
        {step === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Test ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleTestInfoSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label htmlFor="type">Test turi *</Label>
                    <Select onValueChange={(value) => form.setValue('type', value as 'public' | 'numerical')} value={form.watch('type')}>
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
                    <Label htmlFor="status">Test holati *</Label>
                    <Select onValueChange={(value) => form.setValue('status', value as 'draft' | 'active' | 'completed')} value={form.watch('status')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Test holatini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Qoralama</SelectItem>
                        <SelectItem value="active">Faol</SelectItem>
                        <SelectItem value="completed">Tugallangan</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.status.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="totalQuestions">Savollar soni</Label>
                    <Input
                      id="totalQuestions"
                      type="number"
                      min="1"
                      max="90"
                      {...form.register('totalQuestions', { valueAsNumber: true })}
                      placeholder="Savollar sonini kiriting"
                    />
                    {form.formState.errors.totalQuestions && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.totalQuestions.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Test tavsifi</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Test haqida qisqacha ma'lumot"
                    rows={3}
                  />
                </div>

                {form.watch('type') === 'numerical' && testCode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-medium">
                      Maxsus test kodi: <span className="font-mono text-lg">{testCode}</span>
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      O'quvchilar ushbu kod orqali testni topa olishadi.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Keyingi: Rasmlar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Images */}
        {step === 'images' && (
          <Card>
            <CardHeader>
              <CardTitle>Test rasmlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-3">Mavjud rasmlar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Mavjud rasm ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {uploadedImages.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-3">Yangi rasmlar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Yangi rasm ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Interface */}
                {(uploadedImages.length + existingImages.length) < 5 && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">
                          Rasmlar yuklash uchun bosing ({uploadedImages.length + existingImages.length}/5)
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('info')}
                  >
                    Orqaga
                  </Button>
                  <Button
                    type="button"
                    onClick={proceedToQuestions}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Keyingi: Savollar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Questions */}
        {step === 'questions' && (
          <Card>
            <CardHeader>
              <CardTitle>Savollar ({questions.length} ta)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.slice(currentQuestionGroup * questionsPerGroup, (currentQuestionGroup + 1) * questionsPerGroup).map((question, index) => {
                      const globalIndex = currentQuestionGroup * questionsPerGroup + index;
                      return (
                        <div key={globalIndex} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{globalIndex + 1}</Badge>
                            {question.hasImage && (
                              <Badge variant="secondary">Rasm bor</Badge>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`question-${globalIndex}`}>Savol matni</Label>
                              <Textarea
                                id={`question-${globalIndex}`}
                                value={question.questionText}
                                onChange={(e) => updateQuestion(globalIndex, 'questionText', e.target.value)}
                                placeholder="Savolni kiriting..."
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label>To'g'ri javob</Label>
                              <Select 
                                value={question.correctAnswer} 
                                onValueChange={(value) => updateQuestion(globalIndex, 'correctAnswer', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                  <SelectItem value="C">C</SelectItem>
                                  <SelectItem value="D">D</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {currentQuestionGroup > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentQuestionGroup(currentQuestionGroup - 1)}
                          >
                            Oldingi
                          </Button>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        {currentQuestionGroup * questionsPerGroup + 1}-{Math.min((currentQuestionGroup + 1) * questionsPerGroup, questions.length)} / {questions.length}
                      </div>

                      <div className="flex gap-2">
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
                            onClick={handleSaveTest}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('images')}
                  >
                    Orqaga
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EditTestPage;