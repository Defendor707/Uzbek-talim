import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProgressStats from '@/components/student/ProgressStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface TestAttempt {
  id: number;
  testId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  totalCorrect?: number;
  totalQuestions: number;
  status: string;
  testTitle?: string;
  subjectName?: string;
}

interface Subject {
  id: number;
  name: string;
  description?: string;
}

const StudentResultsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  
  // Fetch test attempts
  const { data: attempts, isLoading } = useQuery<TestAttempt[]>({
    queryKey: ['/api/student/attempts'],
  });
  
  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });
  
  // Sample subjects if API doesn't return any
  const sampleSubjects = [
    { id: 1, name: 'Algebra' },
    { id: 2, name: 'Geometriya' },
    { id: 3, name: 'Fizika' },
    { id: 4, name: 'Kimyo' },
    { id: 5, name: 'Ona tili' },
  ];
  
  const subjectsList = subjects || sampleSubjects;
  
  // Sample progress items
  const progressItems = [
    { subject: 'Algebra', percentage: 85 },
    { subject: 'Geometriya', percentage: 72 },
    { subject: 'Fizika', percentage: 68 },
    { subject: 'Kimyo', percentage: 60, status: 'warning' },
    { subject: 'Ona tili', percentage: 90, status: 'success' },
  ];
  
  // Generate recent results from attempts
  const generateRecentResults = () => {
    if (!attempts || attempts.length === 0) {
      return [
        {
          id: 1,
          title: 'Kvadrat tenglamalar',
          correct: 17,
          total: 20,
          percentage: 85,
          type: 'primary' as const,
        },
        {
          id: 2,
          title: 'So\'z yasalishi',
          correct: 23,
          total: 25,
          percentage: 92,
          type: 'secondary' as const,
        },
        {
          id: 3,
          title: 'Kimyoviy reaksiyalar',
          correct: 14,
          total: 20,
          percentage: 70,
          type: 'accent' as const,
        },
      ];
    }
    
    return attempts
      .filter(a => a.status === 'completed')
      .sort((a, b) => new Date(b.endTime || '').getTime() - new Date(a.endTime || '').getTime())
      .slice(0, 3)
      .map((attempt, index) => {
        const score = attempt.score ? parseFloat(attempt.score.toString()) : 0;
        let type: 'primary' | 'secondary' | 'accent';
        
        if (score >= 80) {
          type = 'secondary';
        } else if (score >= 60) {
          type = 'primary';
        } else {
          type = 'accent';
        }
        
        return {
          id: attempt.id,
          title: attempt.testTitle || `Test ${attempt.id}`,
          correct: attempt.totalCorrect || 0,
          total: attempt.totalQuestions,
          percentage: score,
          type,
        };
      });
  };
  
  // Generate performance data for charts
  const generatePerformanceData = () => {
    // Sample data - would come from actual attempts in a real app
    const performanceData = [
      { period: 'Yanvar', score: 78 },
      { period: 'Fevral', score: 80 },
      { period: 'Mart', score: 82 },
      { period: 'Aprel', score: 85 },
      { period: 'May', score: 88 },
    ];
    
    return performanceData;
  };
  
  // Generate subject comparison data
  const generateSubjectComparison = () => {
    // Sample data - would come from actual attempts in a real app
    return [
      { subject: 'Algebra', score: 85, average: 72 },
      { subject: 'Geometriya', score: 72, average: 68 },
      { subject: 'Fizika', score: 68, average: 65 },
      { subject: 'Kimyo', score: 60, average: 62 },
      { subject: 'Ona tili', score: 90, average: 75 },
    ];
  };
  
  return (
    <DashboardLayout title="Natijalar">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Progress Stats */}
        <ProgressStats 
          progressItems={progressItems}
          recentResults={generateRecentResults()}
        />
        
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-heading font-medium text-neutral-dark">
                  O'zlashtirish dinamikasi
                </CardTitle>
                <div className="flex gap-2">
                  <Select 
                    value={selectedPeriod} 
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Davr" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Hafta</SelectItem>
                      <SelectItem value="month">Oy</SelectItem>
                      <SelectItem value="year">Yil</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={selectedSubject} 
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Fan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha fanlar</SelectItem>
                      {subjectsList.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generatePerformanceData()}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      name="Ball (%)" 
                      stroke="hsl(var(--primary))" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading font-medium text-neutral-dark">
              Fanlar bo'yicha o'zlashtirish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={generateSubjectComparison()}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Mening ballim" fill="hsl(var(--primary))" />
                  <Bar dataKey="average" name="O'rtacha ball" fill="hsl(var(--muted-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Detailed Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading font-medium text-neutral-dark">
              Batafsil statistika
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="summary" className="flex-1">Umumiy</TabsTrigger>
                <TabsTrigger value="tests" className="flex-1">Testlar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-neutral-dark">Topshirilgan testlar</span>
                      <span className="text-sm font-medium text-neutral-dark">
                        {attempts?.filter(a => a.status === 'completed').length || 0}
                      </span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-neutral-dark">O'rtacha ball</span>
                      <span className="text-sm font-medium text-neutral-dark">
                        {attempts && attempts.length > 0
                          ? Math.round(
                              attempts
                                .filter(a => a.status === 'completed')
                                .reduce((sum, a) => sum + (a.score ? parseFloat(a.score.toString()) : 0), 0) /
                              attempts.filter(a => a.status === 'completed').length
                            )
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={attempts && attempts.length > 0
                        ? Math.round(
                            attempts
                              .filter(a => a.status === 'completed')
                              .reduce((sum, a) => sum + (a.score ? parseFloat(a.score.toString()) : 0), 0) /
                            attempts.filter(a => a.status === 'completed').length
                          )
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-neutral-dark">Eng yuqori ball</span>
                      <span className="text-sm font-medium text-neutral-dark">
                        {attempts && attempts.length > 0
                          ? Math.max(
                              ...attempts
                                .filter(a => a.status === 'completed')
                                .map(a => a.score ? parseFloat(a.score.toString()) : 0)
                            )
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={attempts && attempts.length > 0
                        ? Math.max(
                            ...attempts
                              .filter(a => a.status === 'completed')
                              .map(a => a.score ? parseFloat(a.score.toString()) : 0)
                          )
                        : 0} 
                      className="h-2 bg-secondary" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-neutral-dark">To'g'ri javoblar</span>
                      <span className="text-sm font-medium text-neutral-dark">
                        {attempts && attempts.length > 0
                          ? Math.round(
                              attempts
                                .filter(a => a.status === 'completed')
                                .reduce((sum, a) => sum + (a.totalCorrect || 0), 0) /
                              attempts
                                .filter(a => a.status === 'completed')
                                .reduce((sum, a) => sum + a.totalQuestions, 0) * 100
                            )
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={attempts && attempts.length > 0
                        ? Math.round(
                            attempts
                              .filter(a => a.status === 'completed')
                              .reduce((sum, a) => sum + (a.totalCorrect || 0), 0) /
                            attempts
                              .filter(a => a.status === 'completed')
                              .reduce((sum, a) => sum + a.totalQuestions, 0) * 100
                          )
                        : 0} 
                      className="h-2 bg-accent" 
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tests">
                {isLoading ? (
                  <div className="flex justify-center items-center p-10">
                    <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
                    <span>Ma'lumotlar yuklanmoqda...</span>
                  </div>
                ) : attempts && attempts.filter(a => a.status === 'completed').length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {attempts
                      .filter(a => a.status === 'completed')
                      .sort((a, b) => new Date(b.endTime || '').getTime() - new Date(a.endTime || '').getTime())
                      .map((attempt) => {
                        const score = attempt.score ? parseFloat(attempt.score.toString()) : 0;
                        let badgeClass = '';
                        
                        if (score >= 80) {
                          badgeClass = 'bg-green-100 text-status-success';
                        } else if (score >= 60) {
                          badgeClass = 'bg-blue-100 text-primary';
                        } else {
                          badgeClass = 'bg-amber-100 text-status-warning';
                        }
                        
                        return (
                          <div key={attempt.id} className="p-3 border rounded-md">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{attempt.testTitle || `Test ${attempt.id}`}</h4>
                                <p className="text-xs text-neutral-medium">
                                  {attempt.subjectName || 'Fan'} • {attempt.endTime && new Date(attempt.endTime).toLocaleDateString()}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm ${badgeClass}`}>
                                {attempt.totalCorrect || 0}/{attempt.totalQuestions} ({score}%)
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <Progress 
                                value={score} 
                                className={`h-1 ${
                                  score >= 80 ? 'bg-status-success' : 
                                  score >= 60 ? 'bg-primary' : 'bg-status-warning'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-neutral-50 rounded-md">
                    <p className="text-neutral-medium">Hali test topshirilmagan</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentResultsPage;
