import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import StatsRow from '@/components/shared/Stats';
import { DataTable } from '@/components/ui/data-table';
import Calendar from '@/components/shared/Calendar';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Types
interface Lesson {
  id: number;
  title: string;
  description?: string;
  grade: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Schedule {
  id: number;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId?: number;
  subjectName?: string;
}

interface CalendarEvent {
  date: Date;
  type: 'primary' | 'secondary' | 'accent';
}

interface ScheduleItem {
  time: string;
  title: string;
  subtitle: string;
  type: 'primary' | 'secondary' | 'accent';
}

const TeacherDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch lessons
  const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });
  
  // Fetch schedules
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules/teacher'],
  });
  
  // Stats data
  const statsData = [
    {
      title: 'Jami darsliklar',
      value: lessons?.length || 0,
      icon: 'menu_book',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-primary',
      trend: {
        value: '+3',
        label: 'O\'tgan haftaga nisbatan',
        isPositive: true,
      },
      progressValue: 75,
    },
    {
      title: 'Faol testlar',
      value: 12,
      icon: 'quiz',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-secondary',
      trend: {
        value: '+2',
        label: 'O\'tgan haftaga nisbatan',
        isPositive: true,
      },
      progressValue: 60,
      progressColor: 'bg-secondary',
    },
    {
      title: 'O\'quvchilar',
      value: 86,
      icon: 'groups',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-accent',
      trend: {
        value: '0',
        label: 'O\'tgan haftaga nisbatan',
        isNeutral: true,
      },
      progressValue: 90,
      progressColor: 'bg-accent',
    },
  ];
  
  // Generate calendar events
  const generateCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const today = new Date();
    
    // Add some events for the current month
    events.push({
      date: new Date(today.getFullYear(), today.getMonth(), 4),
      type: 'primary',
    });
    events.push({
      date: new Date(today.getFullYear(), today.getMonth(), 8),
      type: 'primary',
    });
    events.push({
      date: new Date(today.getFullYear(), today.getMonth(), 12),
      type: 'secondary',
    });
    events.push({
      date: new Date(today.getFullYear(), today.getMonth(), 14),
      type: 'accent',
    });
    events.push({
      date: new Date(today.getFullYear(), today.getMonth(), 17),
      type: 'secondary',
    });
    events.push({
      date: new Date(today.getFullYear(), today.getMonth(), 25),
      type: 'primary',
    });
    
    return events;
  };
  
  // Generate today's schedule
  const generateTodaySchedule = (): ScheduleItem[] => {
    const todayItems: ScheduleItem[] = [
      {
        time: '8:30 - 9:15',
        title: 'Algebra',
        subtitle: '9-A sinf',
        type: 'primary',
      },
      {
        time: '10:00 - 10:45',
        title: 'Geometriya',
        subtitle: '10-B sinf',
        type: 'secondary',
      },
      {
        time: '12:30 - 13:15',
        title: 'Algebra',
        subtitle: '11-A sinf',
        type: 'accent',
      },
    ];
    
    return todayItems;
  };
  
  // Lessons table columns
  const lessonColumns = [
    {
      id: 'title',
      header: 'Nomi',
      cell: (lesson: Lesson) => (
        <div className="flex items-center">
          <span className="material-icons mr-2 text-primary">description</span>
          <div>
            <div className="text-sm font-medium text-neutral-dark">{lesson.title}</div>
            <div className="text-xs text-neutral-medium">{lesson.description || ''}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'grade',
      header: 'Sinf',
      cell: (lesson: Lesson) => (
        <span className="text-sm text-neutral-medium">{lesson.grade}-sinf</span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Yaratilgan',
      cell: (lesson: Lesson) => (
        <span className="text-sm text-neutral-medium">
          {new Date(lesson.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (lesson: Lesson) => {
        const statusClasses = {
          active: 'bg-green-100 text-status-success',
          draft: 'bg-amber-100 text-status-warning',
          archived: 'bg-neutral-200 text-neutral-medium',
        };
        
        const statusLabels = {
          active: 'Faol',
          draft: 'Qoralama',
          archived: 'Arxivlangan',
        };
        
        const statusClass = statusClasses[lesson.status as keyof typeof statusClasses] || statusClasses.draft;
        const statusLabel = statusLabels[lesson.status as keyof typeof statusLabels] || 'Noma\'lum';
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Amallar',
      cell: (lesson: Lesson) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark mr-1"
            title="Tahrirlash"
          >
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-medium hover:text-status-error"
            title="O'chirish"
          >
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <DashboardLayout title="Ustoz paneli">
      {/* Stats Row */}
      <StatsRow stats={statsData} />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Lessons */}
        <div className="col-span-2">
          <DataTable
            data={lessons?.slice(0, 3) || []}
            columns={lessonColumns}
            title="So'nggi darsliklar"
            isLoading={isLoadingLessons}
            actionButton={{
              label: "Barchasini ko'rish",
              onClick: () => {},
            }}
          />
          
          <div className="mt-4 flex justify-center">
            <Link href="/teacher/lessons">
              <Button className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition duration-200">
                <span className="material-icons mr-2">add</span>
                Yangi darslik qo'shish
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Calendar */}
        <div>
          <Calendar 
            events={generateCalendarEvents()} 
            todaySchedule={generateTodaySchedule()}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
