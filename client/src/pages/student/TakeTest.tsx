import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ChevronLeft, ChevronRight, Flag, Check, ArrowLeft, Image as ImageIcon, Grid3X3, Eye, Download, ZoomIn, CheckCircle } from 'lucide-react';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';

interface Question {
  id: number;
  questionText: string;
  questionImage?: string;
  options: string[];
  correctAnswer?: string;
  points: number;
  order: number;
}

interface Test {
  id: number;
  title: string;
  description?: string;
  testImages?: string[];
  totalQuestions: number;
  status: string;
  type: string;
}

interface TestAttempt {
  id: number;
  testId: number;
  studentId: number;
  startTime: string;
  endTime?: string;
  status: string;
  totalQuestions: number;
}

const TakeTestPage: React.FC = () => {
  const params = useParams();
  const testId = params.testId || params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [showQuestionOverview, setShowQuestionOverview] = useState(false);

  console.log('TakeTestPage rendered with testId:', testId);

  // Fetch test details
  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ['/api/tests', testId],
    enabled: !!testId && testId !== 'undefined',
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    enabled: !!testId && testId !== 'undefined',
  });

  // Start test attempt
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating test attempt for testId:', testId);
      const response = await fetch(`/api/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Test boshlashda xatolik');
      }
      
      const data = await response.json();
      console.log('Test attempt response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Test attempt created successfully:', data);
      setAttemptId(data.id);
      toast({
        title: "Test boshlandi",
        description: "Omad tilaymiz!",
      });
    },
    onError: (error) => {
      console.error('Test attempt creation failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Xato",
        description: `Testni boshlashda xatolik yuz berdi: ${error.message || 'Noma\'lum xato'}`,
        variant: "destructive",
      });
    },
  });

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      console.log('Submitting answer:', { questionId, answer, attemptId });
      const response = await fetch(`/api/test-attempts/${attemptId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ questionId, answer }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Javob saqlashda xatolik');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log('Answer submitted successfully:', data);
      toast({
        title: "Javob saqlandi",
        description: `${variables.answer} varianti tanlandi`,
        duration: 2000,
      });
    },
    onError: (error, variables) => {
      console.error('Answer submission failed:', error);
      toast({
        title: "Xatolik",
        description: "Javobni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Complete test
  const completeTestMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error('No attempt ID');
      
      console.log('Completing test with answers:', answers);
      
      // Calculate score based on correct answers
      let score = 0;
      if (questions) {
        questions.forEach((question: any) => {
          const userAnswer = answers[question.id];
          if (userAnswer === question.correctAnswer) {
            score++;
          }
        });
      }
      
      console.log('Calculated score:', score, 'out of', questions?.length);
      
      const response = await fetch(`/api/test-attempts/${attemptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: 'completed',
          score,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Test yakunlashda xatolik');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Test completion successful:', data);
      
      // Calculate percentage
      const totalQuestions = questions?.length || 0;
      const correctAnswers = data.score || 0;
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      toast({
        title: "Test yakunlandi!",
        description: `Natija: ${correctAnswers}/${totalQuestions} (${percentage}%)`,
        duration: 5000,
      });
      
      // Redirect to main dashboard instead of tests page
      setTimeout(() => {
        setLocation('/dashboard/student');
      }, 2000);
    },
    onError: (error) => {
      console.error('Test completion error:', error);
      toast({
        title: "Xatolik",
        description: "Test yakunlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Start test attempt on component mount
  useEffect(() => {
    if (test && !attemptId && !startAttemptMutation.isPending) {
      console.log('Attempting to start test for:', test.id);
      console.log('Test data:', test);
      startAttemptMutation.mutate();
    }
  }, [test, attemptId]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    console.log('Answer selected:', { questionId, answer });
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    if (attemptId) {
      submitAnswerMutation.mutate({ questionId, answer });
    } else {
      console.warn('No attempt ID available for answer submission');
    }
  };

  // Navigation functions
  const goToNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCompleteTest = () => {
    console.log('Test yakunlash boshlandi:', { attemptId, answers, totalQuestions: questions?.length });
    
    // Check if all questions are answered
    if (Object.keys(answers).length !== questions?.length) {
      toast({
        title: "Diqqat",
        description: `Barcha savollarga javob bering (${Object.keys(answers).length}/${questions?.length})`,
        variant: "destructive",
      });
      return;
    }
    
    if (!attemptId) {
      // Try to start attempt first
      if (!startAttemptMutation.isPending) {
        startAttemptMutation.mutate();
      }
      toast({
        title: "Xatolik",
        description: "Test urinishi yaratilmagan. Qayta urinib ko'ring.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Test yakunlanmoqda...');
    completeTestMutation.mutate();
  };

  // Handle invalid testId early
  if (!testId || testId === 'undefined' || testId === 'null') {
    console.log('Invalid testId detected:', testId);
    return (
      <ResponsiveDashboard userRole="student" sections={[]} currentPage="Test">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Noto'g'ri test</h2>
          <p className="text-gray-600 mb-4">Test ID mavjud emas yoki noto'g'ri: {testId}</p>
          <Button onClick={() => setLocation('/student/tests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Testlarga qaytish
          </Button>
        </div>
      </ResponsiveDashboard>
    );
  }

  console.log('TakeTestPage - Test data:', test);
  console.log('TakeTestPage - Questions data:', questions);
  console.log('TakeTestPage - Current question:', questions?.[currentQuestionIndex]);

  if (testLoading || questionsLoading || startAttemptMutation.isPending) {
    return (
      <ResponsiveDashboard userRole="student" sections={[]} currentPage="Test Yuklanmoqda">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold mb-2">
              {startAttemptMutation.isPending ? 'Test boshlanmoqda...' : 'Test yuklanmoqda...'}
            </h2>
            <p className="text-gray-600">
              {testId ? `Test ID: ${testId}` : 'Iltimos kuting...'}
            </p>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  if (!test || !questions || questions.length === 0) {
    return (
      <ResponsiveDashboard userRole="student" sections={[]} currentPage="Test Topilmadi">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Test topilmadi</h2>
            <p className="text-red-600 mb-6">
              Test ID: {testId} - Bu test mavjud emas yoki o'chirilgan
            </p>
            <Button 
              onClick={() => setLocation('/student/tests')}
              className="bg-red-600 hover:bg-red-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Testlarga qaytish
            </Button>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions?.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  console.log('Current question data:', currentQuestion);
  console.log('Questions array length:', questions?.length);
  console.log('Current question index:', currentQuestionIndex);

  return (
    <ResponsiveDashboard userRole="student" sections={[]} currentPage={test?.title || 'Test'}>
      <div className="max-w-6xl mx-auto p-2 md:p-6 bg-gray-50 min-h-screen">
        {/* Test Header */}
        <Card className="mb-4 md:mb-6 shadow-lg border-0">
          <CardHeader className="p-4 md:p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl md:text-2xl font-bold">{test?.title || 'Test'}</CardTitle>
                <p className="text-blue-100 mt-2 text-sm md:text-base">{test?.description || 'Test tavsifi'}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className="bg-white text-blue-700 font-semibold">{test?.type || 'test'}</Badge>
                  <span className="text-blue-100 text-sm">Test ID: {testId}</span>
                  <span className="text-blue-100 text-sm">Savollar: {questions?.length || 0}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLocation('/student/tests')}
                className="self-start bg-white text-blue-700 border-white hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Testdan chiqish</span>
                <span className="sm:hidden">Orqaga</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Bar */}
        <Card className="mb-6 shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-800">
                  Savol {currentQuestionIndex + 1} / {questions.length}
                </span>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  {Math.round(progress)}% tugallandi
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Javob berilgan</div>
                <div className="text-lg font-semibold text-green-600">
                  {answeredCount} / {questions.length}
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-gray-200" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Question Overview Panel */}
          <div className={`xl:col-span-1 ${showQuestionOverview ? 'block' : 'hidden xl:block'}`}>
            <Card className="shadow-md sticky top-4">
              <CardHeader className="p-4 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                  <Grid3X3 className="w-5 h-5" />
                  Savollar ro'yxati
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-5 xl:grid-cols-3 gap-3">
                  {questions.map((question, index) => {
                    const isAnswered = answers[question.id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={question.id}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        className={`h-12 w-12 p-0 text-sm font-semibold relative transition-all duration-200 ${
                          isAnswered ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200' : ''
                        } ${
                          isCurrent ? 'ring-2 ring-blue-500 bg-blue-600 text-white' : ''
                        }`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                        {isAnswered && !isCurrent && (
                          <CheckCircle className="w-4 h-4 absolute -top-1 -right-1 text-green-600 bg-white rounded-full" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                    <span className="text-gray-700">Javob berilgan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                    <span className="text-gray-700">Javob berilmagan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span className="text-gray-700">Joriy savol</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="xl:col-span-4">
            <Card className="shadow-lg border-0">
              <CardHeader className="p-6 md:p-8 bg-white border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">
                      Savol {currentQuestionIndex + 1}
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                      {currentQuestion.points} ball
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowQuestionOverview(!showQuestionOverview)}
                    className="xl:hidden"
                  >
                    <Grid3X3 className="w-5 h-5 mr-2" />
                    Savollar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 bg-white">
                {/* Question Text */}
                <div className="mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                      {currentQuestion?.questionText || 'Savol yuklanmoqda...'}
                    </p>
                  </div>
                  
                  {/* Question Image */}
                  {currentQuestion?.questionImage && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
                      <img
                        src={currentQuestion?.questionImage}
                        alt="Savol rasmi"
                        className="max-w-full h-auto max-h-80 md:max-h-[500px] object-contain rounded-lg border bg-white mx-auto cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          // Handle image click for full view
                          window.open(currentQuestion?.questionImage, '_blank');
                        }}
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">Rasmni kattalashtrish uchun bosing</p>
                    </div>
                  )}

                  {/* Test Images Display */}
                  {test?.testImages && test.testImages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Test materiallari:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {test?.testImages?.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Test materiali ${index + 1}`}
                              className="w-full h-24 md:h-32 object-cover rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => window.open(image, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Answer Options - Horizontal Grid Layout */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {['A', 'B', 'C', 'D'].map((optionLetter, index) => {
                      const isSelected = currentQuestion ? answers[currentQuestion.id] === optionLetter : false;
                      const options = currentQuestion?.options ? JSON.parse(currentQuestion.options as string) : [];
                      const optionText = options[index];
                      
                      // Show placeholder if no question loaded yet
                      if (!currentQuestion) {
                        return (
                          <div key={optionLetter} className="relative p-4 rounded-lg border-2 border-gray-200 bg-gray-100 min-h-[80px] flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 rounded border-2 border-gray-300 mx-auto mb-2 flex items-center justify-center font-bold text-sm text-gray-500">
                                {optionLetter}
                              </div>
                              <div className="text-sm text-gray-500">Yuklanmoqda...</div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Show all 4 options, even if empty
                      const displayText = optionText || `Variant ${optionLetter}`;
                      
                      return (
                        <div
                          key={optionLetter}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[80px] flex items-center justify-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-100 shadow-md' 
                              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                          } ${submitAnswerMutation.isPending ? 'opacity-70' : ''}`}
                          onClick={() => currentQuestion && handleAnswerSelect(currentQuestion.id, optionLetter)}
                        >
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded border-2 mx-auto mb-2 flex items-center justify-center font-bold text-sm ${
                              isSelected 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'border-gray-400 text-gray-600'
                            }`}>
                              {optionLetter}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">
                              {displayText}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Selected Answer Display */}
                  {currentQuestion && answers[currentQuestion.id] && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Tanlangan javob:</strong> {currentQuestion ? answers[currentQuestion.id] : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex flex-col lg:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                  <div className="flex gap-3 flex-1">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex-1 lg:flex-none lg:px-8"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Oldingi savol
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex-1 lg:flex-none lg:px-8"
                    >
                      Keyingi savol
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Complete Test Button */}
                  <div className="flex flex-col gap-3">
                    {answeredCount < questions.length && (
                      <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 font-medium">
                          Barcha savollarga javob bering: <span className="font-bold">{answeredCount}/{questions.length}</span>
                        </p>
                      </div>
                    )}
                    
                    {answeredCount === questions.length && (
                      <Button
                        onClick={handleCompleteTest}
                        disabled={completeTestMutation.isPending}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold shadow-lg"
                      >
                        {completeTestMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Yakunlanmoqda...
                          </>
                        ) : (
                          <>
                            <Check className="w-6 h-6 mr-3" />
                            Testni yakunlash ({answeredCount}/{questions.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsiveDashboard>
  );
};

export default TakeTestPage;