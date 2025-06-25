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
      const response = await apiRequest(`/api/tests/${testId}/start`, {
        method: 'POST',
      });
      console.log('Test attempt response:', response);
      return response;
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
      toast({
        title: "Xato",
        description: "Testni boshlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      return apiRequest(`/api/test-attempts/${attemptId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ questionId, answer }),
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
      
      return apiRequest(`/api/test-attempts/${attemptId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'completed',
          score,
        }),
      });
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
    if (test && !attemptId && !startAttemptMutation.isPending && !startAttemptMutation.isError) {
      console.log('Attempting to start test for:', test.id);
      startAttemptMutation.mutate();
    }
  }, [test, attemptId, startAttemptMutation.isPending, startAttemptMutation.isError]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    if (attemptId) {
      submitAnswerMutation.mutate({ questionId, answer });
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
      <ResponsiveDashboard userRole="student" sections={[]} currentPage="Test">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{startAttemptMutation.isPending ? 'Test boshlanmoqda...' : 'Test yuklanmoqda...'}</p>
          </div>
        </div>
      </ResponsiveDashboard>
    );
  }

  if (!test || !questions || questions.length === 0) {
    return (
      <ResponsiveDashboard userRole="student" sections={[]} currentPage="Test">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Test topilmadi</h2>
          <Button onClick={() => setLocation('/student/tests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Testlarga qaytish
          </Button>
        </div>
      </ResponsiveDashboard>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <ResponsiveDashboard userRole="student" sections={[]} currentPage={test.title}>
      <div className="max-w-4xl mx-auto p-2 md:p-4">
        {/* Test Header */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                <CardTitle className="text-lg md:text-xl">{test.title}</CardTitle>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">{test.description}</p>
                <Badge className="mt-2">{test.type}</Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/student/tests')}
                className="self-start"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Chiqish</span>
                <span className="sm:hidden">Orqaga</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Bar */}
        <Card className="mb-4">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Savol {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-sm text-gray-600">
                Javob berilgan: {answeredCount} / {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Question Overview Panel */}
          <div className={`lg:col-span-1 ${showQuestionOverview ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Savollar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {questions.map((question, index) => {
                    const isAnswered = answers[question.id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={question.id}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${
                          isAnswered ? 'bg-green-100 border-green-300 text-green-700' : ''
                        } ${
                          isCurrent ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                        {isAnswered && <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-600" />}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span>Javob berilgan</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 border border-gray-300 rounded"></div>
                    <span>Javob berilmagan</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Joriy savol</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">
                    Savol {currentQuestionIndex + 1}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuestionOverview(!showQuestionOverview)}
                    className="lg:hidden"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {/* Question Text */}
                <div className="mb-6">
                  <p className="text-base md:text-lg font-medium mb-4">
                    {currentQuestion.questionText}
                  </p>
                  
                  {/* Question Image */}
                  {currentQuestion.questionImage && (
                    <div className="mb-4">
                      <img
                        src={currentQuestion.questionImage}
                        alt="Savol rasmi"
                        className="max-w-full h-auto max-h-60 md:max-h-80 object-contain rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          // Handle image click for full view
                          window.open(currentQuestion.questionImage, '_blank');
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options && JSON.parse(currentQuestion.options as string).map((option: string, index: number) => {
                    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                    const isSelected = answers[currentQuestion.id] === optionLetter;
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full p-4 h-auto text-left justify-start text-sm md:text-base ${
                          isSelected ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, optionLetter)}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 text-xs font-semibold ${
                          isSelected ? 'bg-white text-blue-500 border-white' : 'border-gray-300'
                        }`}>
                          {optionLetter}
                        </span>
                        <span className="flex-1">{option}</span>
                      </Button>
                    );
                  })}
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
                  {answeredCount === questions.length && (
                    <Button
                      onClick={handleCompleteTest}
                      disabled={completeTestMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {completeTestMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Yakunlanmoqda...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Testni yakunlash
                        </>
                      )}
                    </Button>
                  )}
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