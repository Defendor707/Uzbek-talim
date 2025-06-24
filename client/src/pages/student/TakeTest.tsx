import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ChevronLeft, ChevronRight, Flag, Check, ArrowLeft } from 'lucide-react';
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
  const { testId } = useParams<{ testId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // Fetch test details
  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ['/api/tests', testId],
    queryFn: async () => {
      const response = await fetch(`/api/tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Test topilmadi');
      return response.json();
    },
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/tests', testId, 'questions'],
    queryFn: async () => {
      const response = await fetch(`/api/tests/${testId}/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Savollar topilmadi');
      return response.json();
    },
    enabled: !!testId,
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
              <span className="text-sm text-gray-600">
                Javob berilgan: {answeredCount} / {questions.length}
              </span>
            </div>
            <Progress value={progress} className="mb-2" />
          </CardContent>
        </Card>

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
              <div className="mb-4">
                <img 
                  src={currentQuestion.questionImage} 
                  alt="Savol rasmi" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = answers[currentQuestion.id] === option;
                
                return (
                  <div 
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500 text-white' 
                          : 'border-gray-300'
                      }`}>
                        {optionLetter}
                      </div>
                      <span>{option}</span>
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
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Oldingi
          </Button>

          <div className="flex space-x-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={handleCompleteTest}
                disabled={answeredCount < questions.length}
                className="bg-green-600 hover:bg-green-700"
              >
                <Flag className="w-4 h-4 mr-2" />
                Testni yakunlash
              </Button>
            ) : (
              <Button 
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Keyingi
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Test Images */}
        {test.testImages && test.testImages.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Test materiallari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {test.testImages.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Test materiali ${index + 1}`}
                    className="w-full h-auto rounded-lg border"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveDashboard>
  );
};

export default TakeTestPage;