import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StatsRow from '@/components/shared/Stats';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Types
interface Teacher {
  id: number;
  fullName: string;
  subjects: string[];
  studentsCount: number;
  rating: number;
}

interface Student {
  id: number;
  fullName: string;
  grade: string;
  classroom: string;
  parentName?: string;
  joinedDate: string;
}

interface PerformanceData {
  month: string;
  attendance: number;
  scores: number;
}

const CenterDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // Sample data - would be fetched from API in real app
  const teachers: Teacher[] = [
    {
      id: 1,
      fullName: 'Nilufar Qodirova',
      subjects: ['Matematika'],
      studentsCount: 45,
      rating: 4.8
    },
    {
      id: 2,
      fullName: 'Akmal Karimov',
      subjects: ['Fizika', 'Informatika'],
      studentsCount: 32,
      rating: 4.5
    },
    {
      id: 3,
      fullName: 'Dilorom Aliyeva',
      subjects: ['Ona tili', 'Adabiyot'],
      studentsCount: 38,
      rating: 4.9
    }
  ];
  
  const students: Student[] = [
    {
      id: 1,
      fullName: 'Olim Karimov',
      grade: '9',
      classroom: 'A',
      parentName: 'Javlon Karimov',
      joinedDate: '2022-09-01'
    },
    {
      id: 2,
      fullName: 'Nargiza Aliyeva',
      grade: '8',
      classroom: 'B',
      parentName: 'Nodira Aliyeva',
      joinedDate: '2022-09-01'
    },
    {
      id: 3,
      fullName: 'Jasur Toshmatov',
      grade: '11',
      classroom: 'A',
      parentName: 'Sherzod Toshmatov',
      joinedDate: '2022-09-01'
    }
  ];
  
  const performanceData: PerformanceData[] = [
    { month: 'Yanvar', attendance: 92, scores: 78 },
    { month: 'Fevral', attendance: 90, scores: 80 },
    { month: 'Mart', attendance: 94, scores: 82 },
    { month: 'Aprel', attendance: 95, scores: 85 },
    { month: 'May', attendance: 93, scores: 88 }
  ];
  
  // Stats data
  const statsData = [
    {
      title: 'O\'qituvchilar',
      value: teachers.length,
      icon: 'school',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-primary',
      trend: {
        value: '+1',
        label: 'O\'tgan oyga nisbatan',
        isPositive: true,
      },
      progressValue: 75,
    },
    {
      title: 'O\'quvchilar',
      value: students.length,
      icon: 'people',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-secondary',
      trend: {
        value: '+5',
        label: 'O\'tgan oyga nisbatan',
        isPositive: true,
      },
      progressValue: 60,
      progressColor: 'bg-secondary',
    },
    {
      title: 'O\'rtacha o\'zlashtirish',
      value: '88%',
      icon: 'analytics',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-accent',
      trend: {
        value: '+3%',
        label: 'O\'tgan oyga nisbatan',
        isPositive: true,
      },
      progressValue: 88,
      progressColor: 'bg-accent',
    },
  ];
  
  // Teachers table columns
  const teacherColumns = [
    {
      id: 'teacher',
      header: 'O\'qituvchi',
      cell: (teacher: Teacher) => (
        <div className="flex items-center">
          <span className="material-icons mr-2 text-primary">person</span>
          <div>
            <div className="text-sm font-medium text-neutral-dark">{teacher.fullName}</div>
            <div className="text-xs text-neutral-medium">{teacher.subjects.join(', ')}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'students',
      header: 'O\'quvchilar',
      cell: (teacher: Teacher) => (
        <span className="text-sm text-neutral-medium">{teacher.studentsCount}</span>
      ),
    },
    {
      id: 'rating',
      header: 'Reyting',
      cell: (teacher: Teacher) => (
        <div className="flex items-center">
          <span className="text-sm font-medium text-neutral-dark mr-2">{teacher.rating}</span>
          <div className="flex text-accent">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} className="material-icons text-sm">
                {index < Math.floor(teacher.rating) ? 'star' : index < teacher.rating ? 'star_half' : 'star_outline'}
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ];
  
  // Students table columns
  const studentColumns = [
    {
      id: 'student',
      header: 'O\'quvchi',
      cell: (student: Student) => (
        <div className="flex items-center">
          <span className="material-icons mr-2 text-primary">person</span>
          <div>
            <div className="text-sm font-medium text-neutral-dark">{student.fullName}</div>
            <div className="text-xs text-neutral-medium">{student.grade}-{student.classroom} sinf</div>
          </div>
        </div>
      ),
    },
    {
      id: 'parent',
      header: 'Ota-ona',
      cell: (student: Student) => (
        <span className="text-sm text-neutral-medium">{student.parentName || 'Ko\'rsatilmagan'}</span>
      ),
    },
    {
      id: 'joinedDate',
      header: 'Qo\'shilgan sana',
      cell: (student: Student) => (
        <span className="text-sm text-neutral-medium">
          {new Date(student.joinedDate).toLocaleDateString()}
        </span>
      ),
    },
  ];
  
  return (
    <DashboardLayout title="O'quv markaz paneli">
      {/* Stats Row */}
      <StatsRow stats={statsData} />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Teachers Table */}
        <div className="lg:col-span-2">
          <DataTable
            data={teachers}
            columns={teacherColumns}
            title="O'qituvchilar"
            enableSearch={true}
            searchPlaceholder="O'qituvchilarni qidirish..."
            actionButton={{
              label: "O'qituvchi qo'shish",
              icon: "add",
              onClick: () => {
                toast({
                  title: 'Amal',
                  description: "O'qituvchi qo'shish sahifasiga o'tilmoqda",
                });
              },
            }}
          />
        </div>
        
        {/* Performance Chart */}
        <div>
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading font-medium text-neutral-dark">O'quv markaz ko'rsatkichlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="attendance" name="Davomad (%)" fill="hsl(var(--primary))" />
                    <Bar dataKey="scores" name="Ball (%)" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-neutral-dark mb-3">Umumiy ko'rsatkichlar</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-medium">Davomad</span>
                      <span className="text-sm text-neutral-medium">93%</span>
                    </div>
                    <Progress value={93} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-medium">O'zlashtirish</span>
                      <span className="text-sm text-neutral-medium">88%</span>
                    </div>
                    <Progress value={88} className="h-2 bg-secondary" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-medium">Ota-onalar ishtiroki</span>
                      <span className="text-sm text-neutral-medium">76%</span>
                    </div>
                    <Progress value={76} className="h-2 bg-accent" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Students Table */}
      <div>
        <DataTable
          data={students}
          columns={studentColumns}
          title="O'quvchilar"
          enableSearch={true}
          searchPlaceholder="O'quvchilarni qidirish..."
          actionButton={{
            label: "O'quvchi qo'shish",
            icon: "add",
            onClick: () => {
              toast({
                title: 'Amal',
                description: "O'quvchi qo'shish sahifasiga o'tilmoqda",
              });
            },
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default CenterDashboard;
