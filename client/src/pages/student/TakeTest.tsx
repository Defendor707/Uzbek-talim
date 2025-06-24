import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ChevronLeft, ChevronRight, Flag, Check, ArrowLeft, Image as ImageIcon, Grid3X3, Eye } from 'lucide-react';
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
  const testId = params.testId || params.id; // Handle both :testId and :id
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [showQuestionOverview, setShowQuestionOverview] = useState(false);

  // Debug testId and params
  console.log('TakeTestPage rendered with params:', params);
  console.log('TakeTestPage testId:', testId);

  // Fetch test details
  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ['/api/tests', testId],
    queryFn: async () => {
      if (!testId || testId === 'undefined') {
        throw new Error('Test ID mavjud emas');
      }
      const response = await fetch(`/api/tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Test topilmadi');
      return response.json();
    },
    enabled: !!testId && testId !== 'undefined',
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    queryFn: async () => {
      if (!testId || testId === 'undefined') {
        throw new Error('Test ID mavjud emas');
      }
      const response = await fetch(`/api/tests/${testId}/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Savollar topilmadi');
      return response.json();
    },
    enabled: !!testId && testId !== 'undefined',
  });

  // Start test attempt
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/tests/${testId}/start`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      toast({
        title: "Test boshlandi",
        description: "Omad tilaymiz!",
      });
    },
    onError: () => {
      toast({
        title: "Xato",
        description: "Testni boshlashda xatolik",
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
      return apiRequest(`/api/test-attempts/${attemptId}/complete`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Test yakunlandi",
        description: `Sizning natijangiz: ${data.score}%`,
      });
      setLocation('/student/tests');
    },
    onError: () => {
      toast({
        title: "Xato",
        description: "Testni yakunlashda xatolik",
        variant: "destructive",
      });
    },
  });

  // Start test attempt on component mount
  useEffect(() => {
    if (test && !attemptId) {
      startAttemptMutation.mutate();
    }
  }, [test]);

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
    if (attemptId) {
      completeTestMutation.mutate();
    }
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

  if (testLoading || questionsLoading) {
    return (
      <ResponsiveDashboard userRole="student" sections={[]} currentPage="Test">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Test yuklanmoqda...</p>
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
      <div className="max-w-4xl mx-auto p-4">
        {/* Test Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{test.title}</CardTitle>
                <p className="text-gray-600 mt-2">{test.description}</p>
                <Badge className="mt-2">{test.type}</Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/student/tests')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Savol {currentQuestionIndex + 1} / {questions.length}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Javob berilgan: {answeredCount} / {questions.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuestionOverview(!showQuestionOverview)}
                  className="flex items-center gap-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                  {showQuestionOverview ? 'Yashirish' : 'Barcha savollar'}
                </Button>
              </div>
            </div>
            <Progress value={progress} className="mb-2" />
          </CardContent>
        </Card>

        {/* Question Overview Panel */}
        {showQuestionOverview && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-purple-600" />
                Barcha savollar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {questions.map((question, index) => {
                  const isAnswered = answers[question.id];
                  const isCurrent = currentQuestionIndex === index;
                  
                  return (
                    <div
                      key={question.id}
                      className={`
                        relative w-12 h-12 rounded-lg border-2 cursor-pointer transition-all duration-200 
                        flex items-center justify-center text-sm font-bold
                        ${isCurrent 
                          ? 'border-blue-500 bg-blue-500 text-white shadow-lg' 
                          : isAnswered 
                            ? 'border-green-500 bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setCurrentQuestionIndex(index)}
                      title={`Savol ${index + 1}${isAnswered ? ' - Javob berilgan' : ' - Javobsiz'}`}
                    >
                      {index + 1}
                      {isAnswered && !isCurrent && (
                        <Check className="w-3 h-3 absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Joriy savol</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-500 rounded"></div>
                  <span>Javob berilgan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                  <span>Javobsiz</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestionIndex + 1}. {currentQuestion.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Question Image */}
            {currentQuestion.questionImage && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Savol rasmi:</span>
                </div>
                <img 
                  src={`/${currentQuestion.questionImage}`}
                  alt="Savol rasmi" 
                  className="max-w-full h-auto rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.open(`/${currentQuestion.questionImage}`, '_blank')}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Rasmni kattalashtirish uchun ustiga bosing
                </p>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = answers[currentQuestion.id] === optionLetter;
                
                return (
                  <div 
                    key={index}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, optionLetter)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500 text-white scale-110' 
                          : 'border-gray-400 bg-white text-gray-600'
                      }`}>
                        {optionLetter}
                      </div>
                      <span className={`flex-1 ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Oldingi
          </Button>

          <div className="flex items-center gap-3">
            {/* Quick jump to unanswered questions */}
            {answeredCount < questions.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const unansweredIndex = questions.findIndex((q, index) => 
                    !answers[q.id] && index !== currentQuestionIndex
                  );
                  if (unansweredIndex !== -1) {
                    setCurrentQuestionIndex(unansweredIndex);
                  }
                }}
                className="text-orange-600 hover:text-orange-700"
              >
                Javobsiz savolga o'tish
              </Button>
            )}

            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={handleCompleteTest}
                disabled={answeredCount < questions.length}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Testni yakunlash
                {answeredCount < questions.length && (
                  <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                    {questions.length - answeredCount} javobsiz
                  </span>
                )}
              </Button>
            ) : (
              <Button 
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2"
              >
                Keyingi
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Test Images - Display at top for better visibility */}
        {test.testImages && test.testImages.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Test materiallari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {test.testImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={`/${image}`}
                      alt={`Test materiali ${index + 1}`}
                      className="w-full h-auto rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(`/${image}`, '_blank')}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Rasmlarni kattalashtirish uchun ustiga bosing
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Helper */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Test jarayoni</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>A, B, C, D harflarini tanlang</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuestionOverview(!showQuestionOverview)}
                  className="h-8 px-3 text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Savollar ko'rinishi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveDashboard>
  );
};

export default TakeTestPage;