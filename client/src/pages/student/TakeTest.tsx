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
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertCircle } from 'lucide-react';
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
  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['/api/tests', testId],
    enabled: testId > 0,
  });

  // Fetch test questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    enabled: testId > 0,
  });

  // Start test attempt mutation
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/test-attempts`, {
        method: 'POST',
        body: {
          testId,
          studentId: user?.id,
        },
      });
    },
    onSuccess: (data) => {
      setTestAttempt(data);
      setTimeLeft(test?.duration * 60 || 0); // Convert minutes to seconds
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
      return apiRequest(`/api/student-answers`, {
        method: 'POST',
        body: {
          attemptId: testAttempt?.id,
          questionId,
          answer,
        },
      });
    },
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/test-attempts/${testAttempt?.id}/submit`, {
        method: 'POST',
        body: { answers },
      });
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

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && testAttempt && !isSubmitting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && testAttempt && !isSubmitting) {
      // Auto-submit when time is up
      handleSubmitTest();
    }
  }, [timeLeft, testAttempt, isSubmitting]);

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
            <CardTitle className="text-2xl">{test.title}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold">Vaqt</p>
                <p className="text-sm text-gray-600">{test.duration} daqiqa</p>
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
                <strong>Diqqat:</strong> Test boshlanganidan keyin vaqt o'ta boshlaydi. 
                Testni yakunlashdan oldin barcha savollarni ko'rib chiqishingiz tavsiya etiladi.
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
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600">
                Savol {currentQuestionIndex + 1} / {questions?.length || 0}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
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
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Oldingi savol
          </Button>

          <div className="flex gap-2">
            {questions?.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 p-0 ${
                  answers[questions[index].id] 
                    ? 'bg-green-100 border-green-500 text-green-700' 
                    : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.min((questions?.length || 1) - 1, currentQuestionIndex + 1))}
            disabled={isLastQuestion}
          >
            Keyingi savol
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TakeTestPage;