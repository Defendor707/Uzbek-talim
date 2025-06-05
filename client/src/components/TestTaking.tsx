import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";

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
  testImage?: string;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      return await apiRequest(`/api/tests/${testId}/attempts`, {
        method: "POST",
      });
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
      return await apiRequest(`/api/tests/attempts/${attemptId}/answers`, {
        method: "POST",
        body: JSON.stringify(answerData),
      });
    },
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/tests/attempts/${attemptId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "completed",
          endTime: new Date().toISOString(),
        }),
      });
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
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
            {test.testImage && (
              <div className="text-center">
                <img
                  src={`/${test.testImage}`}
                  alt="Test rasmi"
                  className="max-w-full h-auto max-h-64 mx-auto rounded-lg"
                />
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

  if (!currentQuestion) {
    return <div className="text-center">Savollar yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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
            <span>Savol {currentQuestionIndex + 1} / {questions.length}</span>
            <span>Javob berilgan: {answeredQuestions} / {questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestionIndex + 1}. {currentQuestion.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.questionImage && (
            <div className="text-center">
              <img
                src={`/${currentQuestion.questionImage}`}
                alt="Savol rasmi"
                className="max-w-full h-auto max-h-96 mx-auto rounded-lg"
              />
            </div>
          )}
          
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer font-medium"
                >
                  <span className="inline-block w-8 text-center font-bold">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Oldingi savol
        </Button>

        <div className="text-sm text-gray-600">
          {answers[currentQuestion.id] ? (
            <span className="text-green-600 font-medium">
              Javob berilgan: {answers[currentQuestion.id]}
            </span>
          ) : (
            <span className="text-gray-400">Javob berilmagan</span>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleNextQuestion}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Keyingi savol
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Question overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Savollar ko'rinishi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-blue-600 text-white border-blue-600"
                    : answers[questions[index]?.id]
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}