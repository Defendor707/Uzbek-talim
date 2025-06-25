import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, X, Image as ImageIcon } from 'lucide-react';
import TestImageModal from '@/components/TestImageModal';
import TestImageGallery from '@/components/TestImageGallery';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showTestDescription, setShowTestDescription] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Pagination settings
  const questionsPerPage = 5; // Show 5 questions per page

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

  // Calculate pagination
  const totalPages = questions ? Math.ceil(questions.length / questionsPerPage) : 0;
  const currentPageQuestions = questions ? questions.slice(
    currentPage * questionsPerPage, 
    (currentPage + 1) * questionsPerPage
  ) : [];

  // Navigation
  const goToNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextPage = Math.floor(nextIndex / questionsPerPage);
      
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      }
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevPage = Math.floor(prevIndex / questionsPerPage);
      
      if (prevPage !== currentPage) {
        setCurrentPage(prevPage);
      }
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setCurrentQuestionIndex(page * questionsPerPage);
  };

  const goToQuestion = (questionIndex: number) => {
    const page = Math.floor(questionIndex / questionsPerPage);
    setCurrentPage(page);
    setCurrentQuestionIndex(questionIndex);
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
          <p className="text-gray-600">Test yuklanmoqda...</p>
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
          <Button onClick={() => setLocation('/student/tests')} variant="outline">
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
      {/* Minimal Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-medium text-gray-900">{test.title}</h1>
            {test.description && (
              <>
                <span className="text-sm text-gray-500 hidden md:block">• {test.description}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestDescription(true)}
                  className="md:hidden text-xs text-blue-600"
                >
                  Tavsif
                </Button>
              </>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/student/tests')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 px-4 py-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>{currentQuestionIndex + 1} / {questions.length}</span>
            <span>{Math.round(progress)}% yakunlandi</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Page Navigation for large tests */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-3 space-x-1">
              <span className="text-xs text-gray-500 mr-2">Sahifa:</span>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    i === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-blue-50 border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex gap-6">
          {/* Left: Test Images with Helper Modal */}
          {test.testImages && test.testImages.length > 0 && (
            <div className="w-1/2">
              <div className="bg-gray-50 rounded-lg p-4 sticky top-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Test rasmlari</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImageGallery(true)}
                    className="text-xs"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Barcha rasmlar
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {test.testImages.map((image, index) => (
                    <div key={index} className="bg-white rounded border group relative">
                      <img
                        src={`/uploads/${image}`}
                        alt={`Test rasmi ${index + 1}`}
                        className="w-full h-auto max-h-[300px] object-contain rounded cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setImageModalOpen(true);
                        }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src.includes('/uploads/')) {
                            img.src = `/${image}`;
                          }
                        }}
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {index + 1} / {test.testImages.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right: Question and Answers */}
          <div className={test.testImages && test.testImages.length > 0 ? "w-1/2" : "w-full"}>
            <div className="bg-white">
              {/* Question Overview for current page */}
              {totalPages > 1 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Sahifa {currentPage + 1} savollari ({currentPage * questionsPerPage + 1}-{Math.min((currentPage + 1) * questionsPerPage, questions.length)})
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {currentPageQuestions.map((question, index) => {
                      const questionIndex = currentPage * questionsPerPage + index;
                      const isAnswered = answers[question.id];
                      const isCurrent = questionIndex === currentQuestionIndex;
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => goToQuestion(questionIndex)}
                          className={`p-2 text-xs rounded border transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isAnswered
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {questionIndex + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Current Question */}
              <div className="mb-6">
                <h2 className="text-xl font-medium text-gray-900 mb-4">
                  {currentQuestionIndex + 1}. {currentQuestion?.questionText || `${currentQuestionIndex + 1}-savol`}
                </h2>
                
                {/* Question Image (if no test images) */}
                {currentQuestion?.questionImage && (!test.testImages || test.testImages.length === 0) && (
                  <div className="mb-4">
                    <img
                      src={currentQuestion.questionImage}
                      alt="Savol rasmi"
                      className="max-w-full h-auto max-h-[400px] object-contain rounded border cursor-pointer"
                      onClick={() => window.open(currentQuestion.questionImage, '_blank')}
                    />
                  </div>
                )}
              </div>

              {/* Answer Options - Simplified A,B,C,D Layout */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                {['A', 'B', 'C', 'D'].map((optionLetter) => {
                  if (!currentQuestion) return null;
                  
                  const isSelected = answers[currentQuestion.id] === optionLetter;
                  
                  return (
                    <button
                      key={optionLetter}
                      className={`p-6 rounded-lg border-2 transition-all duration-200 text-center min-h-[100px] flex items-center justify-center font-bold text-2xl ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg scale-105' 
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-25 hover:shadow-md'
                      }`}
                      onClick={() => handleAnswerSelect(currentQuestion.id, optionLetter)}
                    >
                      {optionLetter}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Oldingi
                </Button>

                <div className="flex items-center space-x-2">
                  {/* Page navigation buttons */}
                  {totalPages > 1 && currentPage > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      className="text-xs"
                    >
                      Oldingi sahifa
                    </Button>
                  )}
                  
                  {totalPages > 1 && currentPage < totalPages - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      className="text-xs"
                    >
                      Keyingi sahifa
                    </Button>
                  )}
                </div>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleCompleteTest}
                    disabled={answeredCount !== questions.length || completeTestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 px-6"
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
                    className="px-6"
                  >
                    Keyingi
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Image Modal */}
      {test.testImages && test.testImages.length > 0 && (
        <TestImageModal
          images={test.testImages}
          currentIndex={currentImageIndex}
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          onNext={() => setCurrentImageIndex(prev => Math.min(prev + 1, test.testImages!.length - 1))}
          onPrev={() => setCurrentImageIndex(prev => Math.max(prev - 1, 0))}
        />
      )}

      {/* Test Image Gallery */}
      {test.testImages && test.testImages.length > 0 && (
        <TestImageGallery
          images={test.testImages}
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
        />
      )}

      {/* Test Description Modal */}
      {showTestDescription && test.description && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Test haqida</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestDescription(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-700">{test.description}</p>
            <Button
              onClick={() => setShowTestDescription(false)}
              className="w-full mt-4"
            >
              Yopish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTestPage;