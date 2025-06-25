import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';

interface TestResult {
  id: number;
  testId: number;
  studentId: number;
  startTime: string;
  endTime: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completed: boolean;
  test: {
    title: string;
    description?: string;
  };
}

const TestResult: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();

  console.log("TestResult - attemptId:", attemptId);

  const { data: result, isLoading, error } = useQuery<TestResult>({
    queryKey: [`/api/test-attempts/${attemptId}/result`],
    enabled: !!attemptId && !isNaN(Number(attemptId)),
  });

  console.log("TestResult - query result:", { result, isLoading, error });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Natija yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    console.error("TestResult error:", error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Test natijasi topilmadi</p>
          <p className="text-gray-500 mb-4">Attempt ID: {attemptId}</p>
          <Button onClick={() => setLocation('/student/dashboard')}>
            Dashboard'ga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const percentage = result.totalQuestions > 0 ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0;
  const duration = result.endTime && result.startTime ? new Date(result.endTime).getTime() - new Date(result.startTime).getTime() : 0;
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = Math.floor((duration % 60000) / 1000);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="w-8 h-8 text-green-600" />;
    if (score >= 60) return <CheckCircle className="w-8 h-8 text-yellow-600" />;
    return <XCircle className="w-8 h-8 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Test natijalari</h1>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Main Result Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {getScoreIcon(percentage)}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {result.test.title}
            </h2>
            {result.test.description && (
              <p className="text-gray-600">{result.test.description}</p>
            )}
          </div>

          {/* Score Display */}
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(percentage)}`}>
              {percentage}%
            </div>
            <p className="text-gray-600 text-lg">
              {result.correctAnswers} / {result.totalQuestions} to'g'ri javob
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Questions */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {result.totalQuestions}
              </div>
              <p className="text-blue-700 font-medium">Jami savollar</p>
            </div>

            {/* Correct Answers */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {result.correctAnswers}
              </div>
              <p className="text-green-700 font-medium">To'g'ri javoblar</p>
            </div>

            {/* Duration */}
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-purple-600">
                  {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-purple-700 font-medium">Sarflangan vaqt</p>
            </div>
          </div>

          {/* Performance Message */}
          <div className="text-center mb-8">
            <div className={`inline-block px-6 py-3 rounded-full text-white font-medium ${
              percentage >= 80 ? 'bg-green-500' :
              percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {percentage >= 80 ? 'Ajoyib natija!' :
               percentage >= 60 ? 'Yaxshi natija!' : 'Ko\'proq mashq qiling!'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/student/tests')}
              className="px-8 py-3"
            >
              Boshqa testlarni ko'rish
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log('Dashboard tugmasi bosildi');
                setLocation('/student/dashboard');
              }}
              className="px-8 py-3"
            >
              Dashboard'ga qaytish
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test ma'lumotlari
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Boshlangan vaqt:</span>
              <span className="ml-2 text-gray-600">
                {new Date(result.startTime).toLocaleString('uz-UZ')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tugagan vaqt:</span>
              <span className="ml-2 text-gray-600">
                {new Date(result.endTime).toLocaleString('uz-UZ')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Test ID:</span>
              <span className="ml-2 text-gray-600">{result.testId}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Urinish ID:</span>
              <span className="ml-2 text-gray-600">{result.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResult;