import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StatsRow from '@/components/shared/Stats';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Types
interface Child {
  id: number;
  name: string;
  grade: string;
  classroom: string;
  image?: string;
}

interface TestResult {
  id: number;
  childId: number;
  childName: string;
  testTitle: string;
  subject: string;
  score: number;
  totalScore: number;
  percentage: number;
  date: string;
}

interface ChildAttendance {
  id: number;
  childId: number;
  childName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

const ParentDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // Sample data - would be fetched from API in real app
  const children: Child[] = [
    {
      id: 1,
      name: 'Alisher Karimov',
      grade: '9',
      classroom: 'A',
      image: 'https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    },
    {
      id: 2,
      name: 'Dilnoza Karimova',
      grade: '7',
      classroom: 'B',
      image: 'https://images.unsplash.com/photo-1567568367490-5a58d1d775a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    }
  ];
  
  const testResults: TestResult[] = [
    {
      id: 1,
      childId: 1,
      childName: 'Alisher Karimov',
      testTitle: 'Kvadrat tenglamalar',
      subject: 'Algebra',
      score: 85,
      totalScore: 100,
      percentage: 85,
      date: '2023-05-15'
    },
    {
      id: 2,
      childId: 1,
      childName: 'Alisher Karimov',
      testTitle: 'Kimyoviy reaksiyalar',
      subject: 'Kimyo',
      score: 70,
      totalScore: 100,
      percentage: 70,
      date: '2023-05-12'
    },
    {
      id: 3,
      childId: 2,
      childName: 'Dilnoza Karimova',
      testTitle: 'So\'z yasalishi',
      subject: 'Ona tili',
      score: 90,
      totalScore: 100,
      percentage: 90,
      date: '2023-05-14'
    }
  ];
  
  const attendance: ChildAttendance[] = [
    {
      id: 1,
      childId: 1,
      childName: 'Alisher Karimov',
      date: '2023-05-22',
      status: 'present'
    },
    {
      id: 2,
      childId: 1,
      childName: 'Alisher Karimov',
      date: '2023-05-21',
      status: 'present'
    },
    {
      id: 3,
      childId: 2,
      childName: 'Dilnoza Karimova',
      date: '2023-05-22',
      status: 'present'
    },
    {
      id: 4,
      childId: 2,
      childName: 'Dilnoza Karimova',
      date: '2023-05-21',
      status: 'late'
    }
  ];
  
  // Stats data
  const statsData = [
    {
      title: 'Farzandlar',
      value: children.length,
      icon: 'family_restroom',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-primary',
      progressValue: 100,
    },
    {
      title: 'O\'rtacha o\'zlashtirish',
      value: '81%',
      icon: 'trending_up',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-secondary',
      trend: {
        value: '+3%',
        label: 'O\'tgan oyga nisbatan',
        isPositive: true,
      },
      progressValue: 81,
      progressColor: 'bg-secondary',
    },
    {
      title: 'O\'qish davomati',
      value: '96%',
      icon: 'event_available',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-accent',
      trend: {
        value: '-1%',
        label: 'O\'tgan oyga nisbatan',
        isPositive: false,
      },
      progressValue: 96,
      progressColor: 'bg-accent',
    },
  ];
  
  // Test results table columns
  const resultColumns = [
    {
      id: 'child',
      header: 'Farzand',
      cell: (result: TestResult) => (
        <span className="text-sm font-medium text-neutral-dark">{result.childName}</span>
      ),
    },
    {
      id: 'test',
      header: 'Test',
      cell: (result: TestResult) => (
        <div>
          <div className="text-sm font-medium text-neutral-dark">{result.testTitle}</div>
          <div className="text-xs text-neutral-medium">{result.subject}</div>
        </div>
      ),
    },
    {
      id: 'score',
      header: 'Ball',
      cell: (result: TestResult) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-neutral-dark">{result.score}/{result.totalScore}</span>
          <div className="w-20 mt-1">
            <Progress value={result.percentage} className="h-1" />
          </div>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Sana',
      cell: (result: TestResult) => (
        <span className="text-sm text-neutral-medium">
          {new Date(result.date).toLocaleDateString()}
        </span>
      ),
    },
  ];
  
  return (
    <DashboardLayout title="Ota-ona paneli">
      {/* Stats Row */}
      <StatsRow stats={statsData} />
      
      {/* Children Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {children.map((child) => (
          <Card key={child.id} className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src={child.image} alt={child.name} />
                  <AvatarFallback>{child.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium text-neutral-dark">{child.name}</h3>
                  <p className="text-sm text-neutral-medium">{child.grade}-{child.classroom} sinf o'quvchisi</p>
                  <div className="flex mt-2">
                    <div className="flex items-center mr-4 text-sm text-neutral-medium">
                      <span className="material-icons text-sm mr-1">school</span>
                      O'zlashtirish: 82%
                    </div>
                    <div className="flex items-center text-sm text-neutral-medium">
                      <span className="material-icons text-sm mr-1">event_available</span>
                      Davomad: 97%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-neutral-dark mb-2">Fanlar bo'yicha o'zlashtirish</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Matematika</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Ona tili</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-1 bg-secondary" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Tarix</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Recent Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DataTable
            data={testResults}
            columns={resultColumns}
            title="So'nggi test natijalari"
            enableSearch={true}
            searchPlaceholder="Natijalarni qidirish..."
          />
        </div>
        
        {/* Attendance Card */}
        <div>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-heading font-medium text-neutral-dark">Davomad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendance.map((record) => {
                  const statusColors = {
                    present: 'bg-green-100 text-status-success',
                    absent: 'bg-red-100 text-status-error',
                    late: 'bg-amber-100 text-status-warning',
                  };
                  
                  const statusIcons = {
                    present: 'check_circle',
                    absent: 'cancel',
                    late: 'schedule',
                  };
                  
                  const statusLabels = {
                    present: 'Keldi',
                    absent: 'Kelmadi',
                    late: 'Kech qoldi',
                  };
                  
                  return (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium">{record.childName}</p>
                        <p className="text-xs text-neutral-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded-full ${statusColors[record.status]}`}>
                        <span className="material-icons text-sm mr-1">{statusIcons[record.status]}</span>
                        <span className="text-xs">{statusLabels[record.status]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
