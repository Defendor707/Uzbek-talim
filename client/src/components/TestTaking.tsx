import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, ChevronLeft, ChevronRight, Flag, Check } from "lucide-react";

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
  duration: number;
  totalQuestions: number;
  status: string;
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

interface StudentAnswer {
  questionId: number;
  answer: string;
}

export function TestTaking() {
  const { testId } = useParams<{ testId: string }>();
  const [, setLocation] = useLocation();
  const [currentBatch, setCurrentBatch] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionsView, setShowQuestionsView] = useState(false);
  const BATCH_SIZE = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch test details
  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ["/api/tests", testId],
    enabled: !!testId,
  });

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/tests", testId, "questions"],
    enabled: !!testId,
  });

  // Start test attempt mutation
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tests/${testId}/attempts`);
      return await response.json();
    },
    onSuccess: (data: TestAttempt) => {
      setAttemptId(data.id);
      setTimeRemaining(test?.duration ? test.duration * 60 : 1800); // Convert minutes to seconds
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Test boshlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answerData: StudentAnswer) => {
      const response = await apiRequest("POST", `/api/tests/attempts/${attemptId}/answers`, answerData);
      return await response.json();
    },
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/tests/attempts/${attemptId}`, {
        status: "completed",
        endTime: new Date().toISOString(),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test tugallandi",
        description: "Test muvaffaqiyatli topshirildi!",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Test topshirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && attemptId) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, attemptId]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    startAttemptMutation.mutate();
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Submit answer immediately
    if (attemptId) {
      submitAnswerMutation.mutate({
        questionId,
        answer,
      });
    }
  };

  const handleNextBatch = () => {
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
    if (currentBatch < totalBatches - 1) {
      setCurrentBatch(prev => prev + 1);
    }
  };

  const handlePrevBatch = () => {
    if (currentBatch > 0) {
      setCurrentBatch(prev => prev - 1);
    }
  };

  const getCurrentBatchQuestions = () => {
    const start = currentBatch * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    return questions.slice(start, end);
  };

  const getBatchAnsweredCount = (batchIndex: number) => {
    const start = batchIndex * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const batchQuestions = questions.slice(start, end);
    return batchQuestions.filter(q => answers[q.id]).length;
  };

  const canProceedToNextBatch = () => {
    const currentBatchQuestions = getCurrentBatchQuestions();
    return currentBatchQuestions.every(q => answers[q.id]);
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await submitTestMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBatchQuestions = getCurrentBatchQuestions();
  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
  const progress = questions.length > 0 ? ((currentBatch + 1) / totalBatches) * 100 : 0;
  const answeredQuestions = Object.keys(answers).length;

  if (testLoading || questionsLoading) {
    return <div className="flex justify-center items-center h-64">Yuklanmoqda...</div>;
  }

  if (!test) {
    return <div className="text-center">Test topilmadi</div>;
  }

  // Show test info before starting
  if (!attemptId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{test.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {test.testImages && test.testImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Test rasmlari</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.testImages.map((image, index) => (
                    <div key={index} className="text-center">
                      <img
                        src={`/${image}`}
                        alt={`Test rasmi ${index + 1}`}
                        className="max-w-full h-auto max-h-48 mx-auto rounded-lg border"
                      />
                      <p className="text-sm text-gray-500 mt-2">Rasm {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {test.description && (
              <p className="text-gray-600 text-center">{test.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{test.totalQuestions}</div>
                <div className="text-sm text-gray-600">Savollar soni</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{test.duration}</div>
                <div className="text-sm text-gray-600">Daqiqa</div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Test boshlangandan so'ng {test.duration} daqiqa vaqtingiz bor
              </p>
              <Button 
                onClick={handleStartTest} 
                className="w-full"
                disabled={startAttemptMutation.isPending}
              >
                {startAttemptMutation.isPending ? "Boshlanmoqda..." : "Testni boshlash"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with timer and progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{test.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-red-600">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <Button
              onClick={handleSubmitTest}
              variant="outline"
              disabled={isSubmitting}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Flag className="h-4 w-4 mr-2" />
              {isSubmitting ? "Topshirilmoqda..." : "Testni tugatish"}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Savollar to'plami {currentBatch + 1} / {totalBatches}</span>
            <span>Javob berilgan: {answeredQuestions} / {questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Batch navigation */}
      {totalBatches > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: totalBatches }, (_, index) => (
              <Button
                key={index}
                variant={index === currentBatch ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentBatch(index)}
                className="min-w-[80px]"
              >
                {index * BATCH_SIZE + 1} - {Math.min((index + 1) * BATCH_SIZE, questions.length)}
                <span className="ml-2 text-xs">
                  ({getBatchAnsweredCount(index)}/{Math.min(BATCH_SIZE, questions.length - index * BATCH_SIZE)})
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Questions batch display */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Savollar {currentBatch * BATCH_SIZE + 1} - {Math.min((currentBatch + 1) * BATCH_SIZE, questions.length)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentBatchQuestions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  {currentBatch * BATCH_SIZE + index + 1}. {question.questionText}
                </h3>
                {question.questionImage && (
                  <div className="mb-4">
                    <img
                      src={`/${question.questionImage}`}
                      alt="Savol rasmi"
                      className="max-w-full h-auto max-h-64 rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <Button
                    key={option}
                    variant={answers[question.id] === option ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleAnswerChange(question.id, option)}
                    className={`h-12 text-lg font-bold ${
                      answers[question.id] === option 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {answers[question.id] === option && <Check className="h-4 w-4 mr-2" />}
                    {option}
                  </Button>
                ))}
              </div>
              
              {answers[question.id] && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  Tanlangan javob: {answers[question.id]}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevBatch}
          disabled={currentBatch === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Oldingi to'plam
        </Button>

        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            Joriy to'plamda javob berilgan: {getBatchAnsweredCount(currentBatch)} / {currentBatchQuestions.length}
          </div>
          {!canProceedToNextBatch() && currentBatch < totalBatches - 1 && (
            <div className="text-sm text-orange-600">
              Keyingi to'plamga o'tish uchun barcha savollarga javob bering
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleNextBatch}
          disabled={currentBatch === totalBatches - 1 || !canProceedToNextBatch()}
        >
          Keyingi to'plam
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Progress overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Umumiy progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className={`w-8 h-8 rounded border text-xs flex items-center justify-center font-medium ${
                  answers[question.id]
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                }`}
                title={`Savol ${index + 1}: ${answers[question.id] || 'Javob berilmagan'}`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}