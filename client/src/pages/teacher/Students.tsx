import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Types
interface Student {
  id: number;
  fullName: string;
  username: string;
  email: string;
  profileImage?: string;
  grade: string;
  classroom: string;
}

interface StudentProfile {
  userId: number;
  grade: string;
  classroom: string;
  parentId?: number;
}

interface TestResult {
  id: number;
  testId: number;
  studentId: number;
  startTime: string;
  endTime?: string;
  score?: number;
  totalCorrect?: number;
  totalQuestions: number;
  status: string;
  testTitle?: string;
}

const StudentsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Fetch students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/users', { role: 'student' }],
  });
  
  // Fetch student test results when a student is selected
  const { data: studentResults, isLoading: isLoadingResults } = useQuery<TestResult[]>({
    queryKey: [`/api/student/${selectedStudent?.id}/attempts`],
    enabled: !!selectedStudent,
  });
  
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedStudent(null);
  };
  
  // Calculate student's overall performance
  const calculatePerformance = () => {
    if (!studentResults || studentResults.length === 0) return { average: 0, completed: 0, total: 0 };
    
    const completedTests = studentResults.filter(r => r.status === 'completed');
    const totalScore = completedTests.reduce((sum, result) => {
      return sum + (result.score ? parseFloat(result.score.toString()) : 0);
    }, 0);
    
    const average = completedTests.length > 0 ? totalScore / completedTests.length : 0;
    
    return {
      average: Math.round(average),
      completed: completedTests.length,
      total: studentResults.length
    };
  };
  
  const performance = calculatePerformance();
  
  // Students table columns
  const studentColumns = [
    {
      id: 'student',
      header: 'O\'quvchi',
      cell: (student: Student) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={student.profileImage} alt={student.fullName} />
            <AvatarFallback>{student.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-neutral-dark">{student.fullName}</div>
            <div className="text-xs text-neutral-medium">{student.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'grade',
      header: 'Sinf',
      cell: (student: Student) => (
        <span className="text-sm text-neutral-medium">
          {student.grade}-{student.classroom}
        </span>
      ),
    },
    {
      id: 'username',
      header: 'Foydalanuvchi nomi',
      cell: (student: Student) => (
        <span className="text-sm text-neutral-medium">{student.username}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Amallar',
      cell: (student: Student) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewStudent(student)}
            className="text-primary hover:text-primary-dark"
          >
            <span className="material-icons text-sm">visibility</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Send message to student
              toast({
                title: 'Xabar',
                description: `${student.fullName}ga xabar yuborish imkoniyati hozircha mavjud emas`,
              });
            }}
            className="text-primary hover:text-primary-dark"
          >
            <span className="material-icons text-sm">email</span>
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <DashboardLayout title="O'quvchilar">
      <div className="mb-6">
        <DataTable
          data={students || []}
          columns={studentColumns}
          title="O'quvchilar ro'yxati"
          isLoading={isLoading}
          enableSearch={true}
          searchPlaceholder="O'quvchilarni qidirish..."
        />
      </div>
      
      {/* Student Detail Dialog */}
      {isViewDialogOpen && selectedStudent && (
        <Dialog open={isViewDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold text-neutral-dark">
                O'quvchi ma'lumotlari
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Student Profile */}
                <div className="md:w-1/3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={selectedStudent.profileImage} alt={selectedStudent.fullName} />
                          <AvatarFallback className="text-xl">{selectedStudent.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-medium text-neutral-dark">{selectedStudent.fullName}</h3>
                        <p className="text-sm text-neutral-medium mb-1">{selectedStudent.grade}-{selectedStudent.classroom} sinf</p>
                        <p className="text-sm text-neutral-medium">{selectedStudent.email}</p>
                        
                        <div className="mt-4 w-full">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-neutral-medium">O'zlashtirish</span>
                            <span className="text-sm font-medium">{performance.average}%</span>
                          </div>
                          <Progress value={performance.average} className="h-2" />
                        </div>
                        
                        <div className="mt-4 flex justify-between w-full text-sm">
                          <div className="text-center">
                            <div className="font-medium">{performance.completed}</div>
                            <div className="text-neutral-medium">Yakunlangan</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{performance.total - performance.completed}</div>
                            <div className="text-neutral-medium">Yakunlanmagan</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{performance.total}</div>
                            <div className="text-neutral-medium">Jami testlar</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Student Results */}
                <div className="md:w-2/3">
                  <Tabs defaultValue="results">
                    <TabsList className="w-full">
                      <TabsTrigger value="results" className="flex-1">Test natijalari</TabsTrigger>
                      <TabsTrigger value="lessons" className="flex-1">O'zlashtirilgan darslar</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="results" className="mt-4">
                      {isLoadingResults ? (
                        <div className="flex justify-center items-center p-10">
                          <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
                          <span>Ma'lumotlar yuklanmoqda...</span>
                        </div>
                      ) : studentResults && studentResults.length > 0 ? (
                        <div className="space-y-3">
                          {studentResults.map((result) => {
                            const isCompleted = result.status === 'completed';
                            const scorePercentage = isCompleted && result.score 
                              ? parseFloat(result.score.toString()) 
                              : 0;
                            
                            let statusBadge;
                            if (isCompleted) {
                              if (scorePercentage >= 80) {
                                statusBadge = "bg-green-100 text-status-success";
                              } else if (scorePercentage >= 60) {
                                statusBadge = "bg-blue-100 text-primary";
                              } else {
                                statusBadge = "bg-amber-100 text-status-warning";
                              }
                            } else {
                              statusBadge = "bg-neutral-100 text-neutral-medium";
                            }
                            
                            return (
                              <div key={result.id} className="p-3 border rounded-md">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-medium">{result.testTitle || 'Test'}</h4>
                                    <p className="text-sm text-neutral-medium">
                                      {new Date(result.startTime).toLocaleDateString()}{' '}
                                      {result.endTime && `- ${new Date(result.endTime).toLocaleTimeString()}`}
                                    </p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-sm ${statusBadge}`}>
                                    {isCompleted 
                                      ? `${result.totalCorrect || 0}/${result.totalQuestions} (${scorePercentage}%)` 
                                      : 'Jarayonda'}
                                  </div>
                                </div>
                                
                                {isCompleted && (
                                  <div className="mt-2">
                                    <Progress 
                                      value={scorePercentage} 
                                      className={`h-1 ${
                                        scorePercentage >= 80 ? 'bg-status-success' : 
                                        scorePercentage >= 60 ? 'bg-primary' : 'bg-status-warning'
                                      }`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center p-10 bg-neutral-50 rounded-md">
                          <p className="text-neutral-medium">Bu o'quvchi hali testlarni topshirmagan</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="lessons" className="mt-4">
                      <div className="text-center p-10 bg-neutral-50 rounded-md">
                        <p className="text-neutral-medium">O'zlashtirilgan darslar haqida ma'lumot mavjud emas</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleCloseDialog}
                className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              >
                Yopish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default StudentsPage;
