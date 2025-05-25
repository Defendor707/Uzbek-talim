import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TestCard from '@/components/student/TestCard';
import TestTaking from '@/components/student/TestTaking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Test {
  id: number;
  title: string;
  description?: string;
  type: string;
  duration: number;
  totalQuestions: number;
  grade: string;
  classroom?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  teacherId: number;
}

interface Teacher {
  id: number;
  fullName: string;
}

interface TestAttempt {
  id: number;
  testId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  totalCorrect?: number;
  totalQuestions: number;
  status: string;
}

const StudentTestsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTestId, setActiveTestId] = useState<number | null>(null);
  const [isTestTaking, setIsTestTaking] = useState(false);
  
  // Fetch tests
  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests'],
  });
  
  // Fetch teachers
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/users', { role: 'teacher' }],
  });
  
  // Fetch test attempts
  const { data: attempts, isLoading: isLoadingAttempts } = useQuery<TestAttempt[]>({
    queryKey: ['/api/student/attempts'],
  });
  
  // Filter tests by search query
  const filteredTests = tests?.filter(test => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      test.title.toLowerCase().includes(query) ||
      (test.description && test.description.toLowerCase().includes(query))
    );
  });
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number): string => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.fullName || 'O\'qituvchi';
  };
  
  // Calculate days left for a test
  const getDaysLeft = (endDate?: string): number | undefined => {
    if (!endDate) return undefined;
    
    const end = new Date(endDate);
    const today = new Date();
    
    // Reset hours to compare dates only
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : undefined;
  };
  
  // Check if a test has been attempted
  const hasAttempted = (testId: number): boolean => {
    return !!attempts?.some(a => a.testId === testId);
  };
  
  // Check if a test is completed
  const isCompleted = (testId: number): boolean => {
    return !!attempts?.some(a => a.testId === testId && a.status === 'completed');
  };
  
  // Categorize tests
  const activeTests = filteredTests?.filter(test => 
    test.status === 'active' && !isCompleted(test.id)
  ) || [];
  
  const completedTests = filteredTests?.filter(test => 
    isCompleted(test.id)
  ) || [];
  
  const handleStartTest = (testId: number) => {
    setActiveTestId(testId);
    setIsTestTaking(true);
  };
  
  const handleCompleteTest = () => {
    setIsTestTaking(false);
    setActiveTestId(null);
    toast({
      title: 'Muvaffaqiyatli',
      description: 'Test muvaffaqiyatli yakunlandi',
      variant: 'default',
    });
  };
  
  if (isTestTaking && activeTestId) {
    return (
      <DashboardLayout title="Test topshirish">
        <TestTaking 
          testId={activeTestId} 
          onComplete={handleCompleteTest} 
        />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Testlar">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold text-neutral-dark">Mavjud testlar</h2>
          <Input
            type="search"
            placeholder="Testlarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        
        {isLoading || isLoadingAttempts ? (
          <div className="flex justify-center items-center p-10">
            <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
            <span>Testlar yuklanmoqda...</span>
          </div>
        ) : filteredTests && filteredTests.length > 0 ? (
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Faol testlar</TabsTrigger>
              <TabsTrigger value="completed">Yakunlangan testlar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {activeTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTests.map((test) => (
                    <TestCard
                      key={test.id}
                      id={test.id}
                      title={test.title}
                      subject={test.description}
                      grade={test.grade}
                      classroom={test.classroom}
                      teacherName={getTeacherName(test.teacherId)}
                      questionCount={test.totalQuestions}
                      duration={test.duration}
                      daysLeft={getDaysLeft(test.endDate)}
                      isActive={test.status === 'active'}
                      onStartTest={handleStartTest}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 bg-white rounded-lg card-shadow">
                  <span className="material-icons text-4xl text-neutral-medium mb-2">quiz</span>
                  <p className="text-neutral-medium">Hozirda faol testlar mavjud emas</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {completedTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedTests.map((test) => {
                    const attempt = attempts?.find(a => a.testId === test.id && a.status === 'completed');
                    const score = attempt?.score ? parseFloat(attempt.score.toString()) : 0;
                    
                    return (
                      <div key={test.id} className="bg-white rounded-lg card-shadow p-4">
                        <div className="mb-3">
                          <h3 className="text-lg font-medium text-neutral-dark">{test.title}</h3>
                          {test.description && (
                            <p className="text-sm text-neutral-medium">{test.description}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center text-sm text-neutral-medium">
                            <span className="material-icons text-sm mr-1">person</span>
                            {getTeacherName(test.teacherId)}
                          </div>
                          <div className="flex items-center text-sm text-neutral-medium">
                            <span className="material-icons text-sm mr-1">event</span>
                            {attempt?.endTime ? new Date(attempt.endTime).toLocaleDateString() : 'Noma\'lum'}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-neutral-50 rounded-md mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Natija:</span>
                            <span className={`text-sm font-medium ${
                              score >= 80 ? 'text-status-success' : 
                              score >= 60 ? 'text-primary' : 'text-status-warning'
                            }`}>
                              {attempt?.totalCorrect || 0}/{attempt?.totalQuestions || 0} ({score}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-ultralight rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                score >= 80 ? 'bg-status-success' : 
                                score >= 60 ? 'bg-primary' : 'bg-status-warning'
                              }`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
                          onClick={() => {
                            toast({
                              title: 'Ma\'lumot',
                              description: 'Test natijalarini ko\'rish imkoniyati hozircha mavjud emas',
                            });
                          }}
                        >
                          <span className="material-icons mr-2 text-sm">assignment</span>
                          Natijalarni ko'rish
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-10 bg-white rounded-lg card-shadow">
                  <span className="material-icons text-4xl text-neutral-medium mb-2">task_alt</span>
                  <p className="text-neutral-medium">Siz hali birorta ham testni yakunlamagansiz</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center p-10 bg-white rounded-lg card-shadow">
            <span className="material-icons text-4xl text-neutral-medium mb-2">quiz</span>
            <p className="text-neutral-medium">Testlar topilmadi</p>
            {searchQuery && (
              <p className="text-sm text-neutral-medium mt-2">
                "{searchQuery}" so'rovi bo'yicha natijalar yo'q
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentTestsPage;
