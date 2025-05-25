import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface Question {
  id: number;
  questionText: string;
  questionType: string;
  options?: any[];
  points: number;
  order: number;
}

interface TestTakingProps {
  testId: number;
  onComplete: () => void;
}

const TestTaking: React.FC<TestTakingProps> = ({ testId, onComplete }) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch test details
  const { data: test, isLoading: isLoadingTest } = useQuery({
    queryKey: [`/api/tests/${testId}`],
  });
  
  // Fetch test questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: [`/api/tests/${testId}/questions`],
    enabled: !!testId,
  });
  
  // Start test attempt
  const { mutate: startAttempt } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/tests/${testId}/attempts`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
      if (test?.duration) {
        setTimeLeft(test.duration * 60); // Convert minutes to seconds
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Testni boshlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    },
  });
  
  // Save answer
  const { mutate: saveAnswer } = useMutation({
    mutationFn: async ({ questionId, answer, isCorrect }: { questionId: number, answer: any, isCorrect?: boolean }) => {
      if (!attemptId) return null;
      
      const response = await apiRequest('POST', `/api/attempts/${attemptId}/answers`, {
        questionId,
        answer,
        isCorrect,
      });
      return await response.json();
    },
  });
  
  // Complete test attempt
  const { mutate: completeAttempt } = useMutation({
    mutationFn: async () => {
      if (!attemptId) return null;
      
      const response = await apiRequest('PUT', `/api/tests/attempts/${attemptId}`, {
        status: 'completed',
        endTime: new Date(),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Test muvaffaqiyatli yakunlandi!',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/attempts'] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || 'Testni yakunlashda xatolik yuz berdi',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });
  
  // Start test on component mount
  useEffect(() => {
    if (testId && !attemptId) {
      startAttempt();
    }
  }, [testId]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  if (isLoadingTest || isLoadingQuestions || !questions) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
        <span>Test yuklanmoqda...</span>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <Alert>
        <AlertTitle>Xatolik</AlertTitle>
        <AlertDescription>Test savollari topilmadi</AlertDescription>
      </Alert>
    );
  }
  
  const handleAnswerChange = (value: any) => {
    const newAnswers = { ...answers };
    newAnswers[currentQuestion.id] = value;
    setAnswers(newAnswers);
    
    // Save answer to server
    saveAnswer({
      questionId: currentQuestion.id,
      answer: value,
    });
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmitTest = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    completeAttempt();
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const renderQuestionContent = () => {
    const { questionType } = currentQuestion;
    const answer = answers[currentQuestion.id];
    
    switch (questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answer}
            onValueChange={handleAnswerChange}
            className="space-y-2"
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border border-neutral-200 rounded-md">
                <RadioGroupItem value={option.value || index.toString()} id={`option-${index}`} />
                <label htmlFor={`option-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'true_false':
        return (
          <RadioGroup
            value={answer}
            onValueChange={handleAnswerChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-2 border border-neutral-200 rounded-md">
              <RadioGroupItem value="true" id="option-true" />
              <label htmlFor="option-true" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full cursor-pointer">
                To'g'ri
              </label>
            </div>
            <div className="flex items-center space-x-2 p-2 border border-neutral-200 rounded-md">
              <RadioGroupItem value="false" id="option-false" />
              <label htmlFor="option-false" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full cursor-pointer">
                Noto'g'ri
              </label>
            </div>
          </RadioGroup>
        );
        
      case 'matching':
        // Simplified matching UI
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-neutral-200 rounded-md bg-neutral-50">
                  {item.left}
                </div>
                <select
                  className="p-2 border border-neutral-200 rounded-md"
                  value={answer?.[index] || ''}
                  onChange={(e) => {
                    const newMatchAnswers = [...(answer || [])];
                    newMatchAnswers[index] = e.target.value;
                    handleAnswerChange(newMatchAnswers);
                  }}
                >
                  <option value="">Tanlang...</option>
                  {currentQuestion.options?.map((rightItem, rightIndex) => (
                    <option key={rightIndex} value={rightIndex}>
                      {rightItem.right}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
        
      case 'short_answer':
        return (
          <Input
            placeholder="Javobni kiriting..."
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full"
          />
        );
        
      case 'essay':
        return (
          <Textarea
            placeholder="Javobni kiriting..."
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full min-h-[150px]"
          />
        );
        
      default:
        return (
          <Alert>
            <AlertTitle>Xatolik</AlertTitle>
            <AlertDescription>Noma'lum savol turi</AlertDescription>
          </Alert>
        );
    }
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Test timer and progress */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">
            Savol {currentQuestionIndex + 1}/{questions.length}
          </span>
          <Progress value={(currentQuestionIndex + 1) / questions.length * 100} className="w-24" />
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center ${timeLeft < 60 ? 'text-status-error' : timeLeft < 300 ? 'text-status-warning' : ''}`}>
            <span className="material-icons mr-1">timer</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>
      
      {/* Question card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            {currentQuestion.order}. {currentQuestion.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderQuestionContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <span className="material-icons mr-1">arrow_back</span>
            Oldingi
          </Button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={goToNextQuestion}
            >
              Keyingi
              <span className="material-icons ml-1">arrow_forward</span>
            </Button>
          ) : (
            <Button
              className="bg-secondary hover:bg-secondary-dark text-white"
              onClick={handleSubmitTest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  Topshirilmoqda...
                </>
              ) : (
                <>
                  Testni yakunlash
                  <span className="material-icons ml-1">check_circle</span>
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Question navigation */}
      <div className="grid grid-cols-10 gap-2">
        {questions.map((q, index) => (
          <button
            key={index}
            className={`p-2 rounded-md text-center ${
              index === currentQuestionIndex
                ? 'bg-primary text-white'
                : answers[q.id]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-neutral-100 text-neutral-800'
            }`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestTaking;
