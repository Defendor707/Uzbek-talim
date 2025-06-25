import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface Question {
  id: number;
  questionText: string;
  questionImage?: string;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

interface Test {
  id: number;
  title: string;
  description?: string;
  totalQuestions: number;
  testImages?: string[];
}

interface TestAttempt {
  id: number;
  testId: number;
  studentId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  completed: boolean;
}

const TakeTestNew: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // Fetch test
  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ['/api/tests', testId],
    enabled: !!testId,
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: [`/api/tests/${testId}/questions`],
    enabled: !!testId,
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
        throw new Error('Test boshlashda xatolik');
      }
      
      return response.json();
    },
    onSuccess: (data: TestAttempt) => {
      setAttemptId(data.id);
      toast({
        title: "Test boshlandi",
        description: "Testga javob berishni boshlashingiz mumkin",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Test boshlashda xatolik yuz berdi",
        variant: "destructive",
      });
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
        throw new Error('Javob saqlashda xatolik');
      }
      
      return response.json();
    },
  });

  // Complete test
  const completeTestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/test-attempts/${attemptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ completed: true }),
      });
      
      if (!response.ok) {
        throw new Error('Test yakunlashda xatolik');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test yakunlandi",
        description: "Sizning javoblaringiz saqlandi",
      });
      // Redirect to results page
      setLocation(`/student/test-result/${attemptId}`);
    },
  });

  // Start test on load
  useEffect(() => {
    if (test && !attemptId && !startAttemptMutation.isPending) {
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
    if (attemptId) {
      completeTestMutation.mutate();
    }
  };

  if (testLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Test yuklanmoqda...</p>
          {test && <p className="text-sm text-gray-500 mt-2">Test ID: {test.id}, Jami: {test.totalQuestions}</p>}
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Test topilmadi</p>
          <Button onClick={() => setLocation('/student/dashboard')}>
            Orqaga
          </Button>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Testda savollar mavjud emas</p>
          <p className="text-gray-600 mb-4">Test ID: {test.id}, Jami savollar: {test.totalQuestions}</p>
          <Button onClick={() => setLocation('/student/dashboard')}>
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">{test.title}</h1>
          {test.description && (
            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gray-50 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Savol {currentQuestionIndex + 1} / {questions.length}</span>
            <span>{answeredCount} ta javob berildi</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">
            {currentQuestion.questionText}
          </h2>
          
          {/* Question Image */}
          {currentQuestion.questionImage && (
            <div className="mb-6">
              <img
                src={currentQuestion.questionImage}
                alt="Savol rasmi"
                className="max-w-full h-auto rounded border"
              />
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className="mb-8">
          {(() => {
            let options: string[] = [];
            try {
              if (Array.isArray(currentQuestion.options)) {
                options = currentQuestion.options;
              } else if (typeof currentQuestion.options === 'string') {
                options = JSON.parse(currentQuestion.options);
              } else {
                options = ['A variant', 'B variant', 'C variant', 'D variant'];
              }
            } catch {
              options = ['A variant', 'B variant', 'C variant', 'D variant'];
            }

            const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, options.length);
            
            return (
              <div className="space-y-3">
                {optionLetters.map((letter) => {
                  const isSelected = answers[currentQuestion.id] === letter;
                  
                  return (
                    <button
                      key={letter}
                      onClick={() => handleAnswerSelect(currentQuestion.id, letter)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold mr-4">
                          {letter}
                        </span>
                        <span>{options[optionLetters.indexOf(letter)] || `${letter} variant`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
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
              disabled={completeTestMutation.isPending}
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

        {/* Test Images */}
        {test.testImages && test.testImages.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Test rasmlari</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {test.testImages.map((image, index) => (
                <img
                  key={index}
                  src={`/uploads/${image}`}
                  alt={`Test rasmi ${index + 1}`}
                  className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-75"
                  onClick={() => window.open(`/uploads/${image}`, '_blank')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeTestNew;