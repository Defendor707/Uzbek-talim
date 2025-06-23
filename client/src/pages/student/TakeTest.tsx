import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertCircle, Check } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';

interface Question {
  id: number;
  questionText: string;
  questionImage?: string;
  questionType: string;
  options?: string[];
  correctAnswer: any;
  points: number;
  order: number;
}

interface TestAttempt {
  id: number;
  testId: number;
  studentId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  status: 'in_progress' | 'completed' | 'submitted';
}

const TakeTestPage: React.FC = () => {
  const [, params] = useRoute('/student/test/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const testId = params?.id ? parseInt(params.id) : 0;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch test details
  const { data: test, isLoading: testLoading } = useQuery<any>({
    queryKey: ['/api/tests', testId],
    enabled: testId > 0,
  });

  // Fetch test questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    enabled: testId > 0,
  });

  // Start test attempt mutation
  const startAttemptMutation = useMutation<TestAttempt, Error, void>({
    mutationFn: async () => {
      const response = await fetch('/api/test-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          studentId: user?.id,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start test');
      }
      
      return response.json();
    },
    onSuccess: (data: TestAttempt) => {
      setTestAttempt(data);
      // Only set timer for tests with duration > 0 and not simple type
      if (test?.type !== 'simple' && test?.duration > 0) {
        setTimeLeft(test.duration * 60); // Convert minutes to seconds
      } else {
        setTimeLeft(0); // No time limit for simple tests
      }
    },
    onError: (error) => {
      toast({
        title: "Xato",
        description: "Testni boshlashda xato yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: any }) => {
      const response = await fetch('/api/student-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: testAttempt?.id,
          questionId,
          answer,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to save answer');
      }
      
      return response.json();
    },
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/test-attempts/${testAttempt?.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit test');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Muvaffaqiyat",
        description: "Test muvaffaqiyatli topshirildi",
      });
      setLocation('/student/tests');
    },
    onError: (error) => {
      toast({
        title: "Xato",
        description: "Testni topshirishda xato yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Timer effect - only for timed tests
  useEffect(() => {
    // Only run timer for non-simple tests with duration > 0
    if (test?.type !== 'simple' && test?.duration > 0) {
      if (timeLeft > 0 && testAttempt && !isSubmitting) {
        const timer = setTimeout(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (timeLeft === 0 && testAttempt && !isSubmitting) {
        // Auto-submit when time is up (only for timed tests)
        handleSubmitTest();
      }
    }
  }, [timeLeft, testAttempt, isSubmitting, test?.type, test?.duration]);

  // Handle answer selection
  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Submit answer immediately
    submitAnswerMutation.mutate({ questionId, answer });
  };

  // Handle test submission
  const handleSubmitTest = async () => {
    if (!testAttempt) return;
    
    setIsSubmitting(true);
    submitTestMutation.mutate();
  };

  // Start test
  const handleStartTest = () => {
    startAttemptMutation.mutate();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const getProgress = () => {
    if (!questions?.length) return 0;
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / questions.length) * 100;
  };

  if (testLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Test topilmadi</h2>
            <p className="text-gray-600 mb-4">Kechirasiz, bu test mavjud emas yoki sizga ruxsat berilmagan.</p>
            <Button onClick={() => setLocation('/student/tests')}>
              Testlarga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-test screen
  if (!testAttempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{test?.title || 'Test'}</CardTitle>
            <CardDescription>{test?.description || ''}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold">Vaqt</p>
                <p className="text-sm text-gray-600">
                  {test?.type === 'simple' || test?.duration === 0 
                    ? 'Cheklanmagan' 
                    : `${test?.duration || 0} daqiqa`
                  }
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Flag className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold">Savollar</p>
                <p className="text-sm text-gray-600">{questions?.length || 0} ta savol</p>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Diqqat:</strong> 
                {test?.type === 'simple' || test?.duration === 0 
                  ? 'Bu oddiy test bo\'lib, vaqt cheklanmagan. O\'z vaqtingizda savollarni yechib, javoblarni tekshirib topshiring.'
                  : 'Test boshlanganidan keyin vaqt o\'ta boshlaydi. Testni yakunlashdan oldin barcha savollarni ko\'rib chiqishingiz tavsiya etiladi.'
                }
              </AlertDescription>
            </Alert>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setLocation('/student/tests')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
              <Button
                onClick={handleStartTest}
                disabled={startAttemptMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {startAttemptMutation.isPending ? 'Boshlanmoqda...' : 'Testni boshlash'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (questions?.length || 0) - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with timer and progress */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test?.title || 'Test'}</h1>
              <p className="text-sm text-gray-600">
                Savol {currentQuestionIndex + 1} / {questions?.length || 0}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Only show timer for timed tests */}
              {test?.type !== 'simple' && test?.duration > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              {/* Show "No time limit" for simple tests */}
              {(test?.type === 'simple' || test?.duration === 0) && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    Vaqt cheklanmagan
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Testni yakunlash
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={getProgress()} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Javob berilgan: {Object.keys(answers).length} / {questions?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {currentQuestion.questionText}
                </CardTitle>
                <Badge variant="outline">
                  {currentQuestion.points} ball
                </Badge>
              </div>
              {currentQuestion.questionImage && (
                <div className="mt-4">
                  <img
                    src={currentQuestion.questionImage}
                    alt="Savol rasmi"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentQuestion.questionType === 'open' ? (
                  <Textarea
                    placeholder="Javobingizni yozing..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    rows={4}
                  />
                ) : (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    {currentQuestion.options?.map((option, index) => {
                      const optionLabels = ['A', 'B', 'C', 'D', 'E'];
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer hover:bg-gray-50 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200'
                          }`}
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                        >
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500 text-white' 
                              : 'border-gray-300 text-gray-500'
                          }`}>
                            {optionLabels[index] || index + 1}
                          </div>
                          <RadioGroupItem value={option} id={`option-${index}`} className="sr-only" />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-gray-900">
                            {option}
                          </Label>
                          {isSelected && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Navigation */}
        <div className="flex flex-col gap-6 mt-8">
          {/* Question Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              size="lg"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Oldingi savol
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                {currentQuestionIndex + 1} / {questions?.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQuestionIndex(Math.min((questions?.length || 1) - 1, currentQuestionIndex + 1))}
                disabled={isLastQuestion}
              >
                Keyingi
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.min((questions?.length || 1) - 1, currentQuestionIndex + 1))}
              disabled={isLastQuestion}
              size="lg"
            >
              Keyingi savol
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Question Overview Grid */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Savollar holati:</h4>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {questions?.map((_, index) => {
                const isAnswered = answers[questions[index].id];
                const isCurrent = index === currentQuestionIndex;
                return (
                  <Button
                    key={index}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 p-0 relative ${
                      isAnswered 
                        ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200' 
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {index + 1}
                    {isAnswered && !isCurrent && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Javob berilgan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Joriy savol</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-gray-300 rounded-full"></div>
                <span>Javob berilmagan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTestPage;