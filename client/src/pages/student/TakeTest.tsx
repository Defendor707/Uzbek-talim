import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);

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
      
      return response.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
    },
  });

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
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
  });

  // Complete test
  const completeTestMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error('No attempt ID');
      
      // Calculate score
      let score = 0;
      if (questions) {
        questions.forEach((question: any) => {
          const userAnswer = answers[question.id];
          if (userAnswer === question.correctAnswer) {
            score++;
          }
        });
      }
      
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
      const totalQuestions = questions?.length || 0;
      const correctAnswers = data.score || 0;
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      toast({
        title: "Test yakunlandi",
        description: `${correctAnswers}/${totalQuestions} (${percentage}%)`,
      });
      
      setTimeout(() => {
        setLocation('/dashboard/student');
      }, 2000);
    },
  });

  // Start test on mount
  useEffect(() => {
    if (test && !attemptId && !startAttemptMutation.isPending) {
      startAttemptMutation.mutate();
    }
  }, [test, attemptId]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    if (attemptId) {
      submitAnswerMutation.mutate({ questionId, answer });
    }
  };

  // Navigation
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
    if (Object.keys(answers).length !== questions?.length) {
      toast({
        title: "Diqqat",
        description: `Barcha savollarga javob bering`,
        variant: "destructive",
      });
      return;
    }
    
    completeTestMutation.mutate();
  };

  // Loading state
  if (testLoading || questionsLoading || startAttemptMutation.isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!test || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Test topilmadi</h2>
          <Button onClick={() => setLocation('/student/tests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{test.title}</h1>
            <p className="text-sm text-gray-600">Savol {currentQuestionIndex + 1} / {questions.length}</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/student/tests')}>
            Chiqish
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(progress)}% bajarildi</span>
            <span>Javob berilgan: {answeredCount}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-2xl font-medium mb-4">
                {currentQuestion?.questionText}
              </h2>
              
              {/* Question Image */}
              {currentQuestion?.questionImage && (
                <div className="mb-6">
                  <img
                    src={currentQuestion.questionImage}
                    alt="Savol rasmi"
                    className="max-w-full h-auto max-h-96 object-contain rounded border mx-auto"
                    onClick={() => window.open(currentQuestion.questionImage, '_blank')}
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {['A', 'B', 'C', 'D'].map((optionLetter, index) => {
                const isSelected = currentQuestion ? answers[currentQuestion.id] === optionLetter : false;
                const options = currentQuestion?.options ? JSON.parse(currentQuestion.options as string) : [];
                const optionText = options[index];
                
                if (!optionText) return null;
                
                return (
                  <div
                    key={optionLetter}
                    className={`p-4 rounded border-2 cursor-pointer transition-all min-h-[100px] flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                    onClick={() => currentQuestion && handleAnswerSelect(currentQuestion.id, optionLetter)}
                  >
                    <div className="text-center">
                      <div className={`w-8 h-8 rounded border-2 mx-auto mb-3 flex items-center justify-center font-bold ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'border-gray-400 text-gray-600'
                      }`}>
                        {optionLetter}
                      </div>
                      <div className="text-sm font-medium">
                        {optionText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleCompleteTest}
                  disabled={answeredCount !== questions.length || completeTestMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TakeTestPage;