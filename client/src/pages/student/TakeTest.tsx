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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <ResponsiveDashboard userRole="student" sections={[]} currentPage={`${test.title} - Test`}>
      <div className="max-w-6xl mx-auto p-2 md:p-6 bg-gray-50 min-h-screen">
        {/* Test Header */}
        <Card className="mb-4 md:mb-6 shadow-lg border-0">
          <CardHeader className="p-4 md:p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl md:text-2xl font-bold">{test.title}</CardTitle>
                <p className="text-blue-100 mt-2 text-sm md:text-base">{test.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className="bg-white text-blue-700 font-semibold">{test.type}</Badge>
                  <span className="text-blue-100 text-sm">Test ID: {testId}</span>
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
                      {currentQuestion.questionText}
                    </p>
                  </div>
                  
                  {/* Question Image */}
                  {currentQuestion.questionImage && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
                      <img
                        src={currentQuestion.questionImage}
                        alt="Savol rasmi"
                        className="max-w-full h-auto max-h-80 md:max-h-[500px] object-contain rounded-lg border bg-white mx-auto cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          // Handle image click for full view
                          window.open(currentQuestion.questionImage, '_blank');
                        }}
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">Rasmni kattalashtrish uchun bosing</p>
                    </div>
                  )}

                  {/* Test Images Display */}
                  {test.testImages && test.testImages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Test materiallari:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {test.testImages.map((image, index) => (
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

                {/* Answer Options - Test Sheet Style with A, B, C, D */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Javobni tanlang:</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {['A', 'B', 'C', 'D'].map((optionLetter, index) => {
                      const isSelected = answers[currentQuestion.id] === optionLetter;
                      const options = currentQuestion.options ? JSON.parse(currentQuestion.options as string) : [];
                      const optionText = options[index];
                      
                      // Only show options that have text
                      if (!optionText) return null;
                      
                      return (
                        <Button
                          key={optionLetter}
                          variant={isSelected ? "default" : "outline"}
                          className={`w-full p-6 h-auto text-left justify-start text-base md:text-lg transition-all duration-300 ${
                            isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-[1.01] ring-2 ring-blue-300' 
                              : 'hover:bg-blue-50 hover:border-blue-400 border-gray-300 hover:shadow-md bg-white'
                          } ${submitAnswerMutation.isPending ? 'opacity-70' : ''}`}
                          onClick={() => handleAnswerSelect(currentQuestion.id, optionLetter)}
                          disabled={submitAnswerMutation.isPending}
                        >
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full border-3 flex items-center justify-center mr-6 text-lg font-bold transition-all ${
                            isSelected 
                              ? 'bg-white text-blue-600 border-white shadow-md' 
                              : 'border-blue-400 text-blue-600 group-hover:border-blue-500 bg-blue-50'
                          }`}>
                            {optionLetter}
                          </div>
                          <span className="flex-1 text-left font-medium">{optionText}</span>
                          {isSelected && (
                            <Check className="w-6 h-6 text-white ml-4" />
                          )}
                        </Button>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
                  <div className="flex gap-2 sm:flex-1">
                    <Button
                      variant="outline"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Oldingi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex-1 sm:flex-none"
                    >
                      Keyingi
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Complete Test Button */}
                  <div className="flex flex-col gap-2">
                    {answeredCount < questions.length && (
                      <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          Barcha savollarga javob bering: {answeredCount}/{questions.length}
                        </p>
                      </div>
                    )}
                    
                    {answeredCount === questions.length && (
                      <Button
                        onClick={handleCompleteTest}
                        disabled={completeTestMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                      >
                        {completeTestMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Yakunlanmoqda...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2" />
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