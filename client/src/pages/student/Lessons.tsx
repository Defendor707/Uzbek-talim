import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  content: string;
  subjectId?: number;
  grade: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  teacherId: number;
}

interface Teacher {
  id: number;
  fullName: string;
}

const StudentLessonsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch lessons
  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });
  
  // Fetch teachers
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['/api/users', { role: 'teacher' }],
  });
  
  const handleViewLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonOpen(true);
  };
  
  const handleCloseLesson = () => {
    setIsLessonOpen(false);
    setSelectedLesson(null);
  };
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number): string => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.fullName || 'O\'qituvchi';
  };
  
  // Filter lessons by search query
  const filteredLessons = lessons?.filter(lesson => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(query) ||
      (lesson.description && lesson.description.toLowerCase().includes(query))
    );
  });
  
  // Group lessons by subject/category
  const lessonsBySubject: Record<string, Lesson[]> = {};
  
  filteredLessons?.forEach(lesson => {
    // For now, we'll just use a generic subject/category
    const subject = lesson.description || 'Umumiy';
    
    if (!lessonsBySubject[subject]) {
      lessonsBySubject[subject] = [];
    }
    
    lessonsBySubject[subject].push(lesson);
  });
  
  return (
    <DashboardLayout title="Darsliklar">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold text-neutral-dark">Barcha darsliklar</h2>
          <Input
            type="search"
            placeholder="Darsliklarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mr-2"></div>
            <span>Darsliklar yuklanmoqda...</span>
          </div>
        ) : filteredLessons && filteredLessons.length > 0 ? (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Hammasi</TabsTrigger>
              {Object.keys(lessonsBySubject).map((subject, index) => (
                <TabsTrigger key={index} value={subject}>{subject}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    teacherName={getTeacherName(lesson.teacherId)}
                    onView={handleViewLesson}
                  />
                ))}
              </div>
            </TabsContent>
            
            {Object.entries(lessonsBySubject).map(([subject, subjectLessons], index) => (
              <TabsContent key={index} value={subject}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjectLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      teacherName={getTeacherName(lesson.teacherId)}
                      onView={handleViewLesson}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center p-10 bg-white rounded-lg card-shadow">
            <span className="material-icons text-4xl text-neutral-medium mb-2">menu_book</span>
            <p className="text-neutral-medium">Darsliklar topilmadi</p>
            {searchQuery && (
              <p className="text-sm text-neutral-medium mt-2">
                "{searchQuery}" so'rovi bo'yicha natijalar yo'q
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Lesson Detail Dialog */}
      {isLessonOpen && selectedLesson && (
        <Dialog open={isLessonOpen} onOpenChange={handleCloseLesson}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold text-neutral-dark">
                {selectedLesson.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center mb-4">
                <span className="material-icons text-primary mr-2">person</span>
                <span className="text-sm text-neutral-medium">{getTeacherName(selectedLesson.teacherId)}</span>
                <span className="mx-2">•</span>
                <span className="text-sm text-neutral-medium">{selectedLesson.grade}-sinf</span>
                <span className="mx-2">•</span>
                <span className="text-sm text-neutral-medium">
                  {new Date(selectedLesson.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {selectedLesson.description && (
                <p className="text-neutral-dark mb-4 italic">{selectedLesson.description}</p>
              )}
              
              <div className="border-t border-b py-4 my-4">
                <div className="prose max-w-none">
                  {selectedLesson.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleCloseLesson}
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

interface LessonCardProps {
  lesson: Lesson;
  teacherName: string;
  onView: (lesson: Lesson) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, teacherName, onView }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{lesson.title}</CardTitle>
        {lesson.description && (
          <CardDescription>{lesson.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-neutral-medium mb-2">
          <span className="material-icons text-sm mr-1">school</span>
          <span>{lesson.grade}-sinf</span>
        </div>
        <div className="flex items-center text-sm text-neutral-medium">
          <span className="material-icons text-sm mr-1">person</span>
          <span>{teacherName}</span>
        </div>
        <div className="mt-4">
          <p className="text-sm text-neutral-dark line-clamp-3">
            {lesson.content.substring(0, 150)}...
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-primary hover:bg-primary-dark text-white"
          onClick={() => onView(lesson)}
        >
          <span className="material-icons mr-2 text-sm">visibility</span>
          Darslikni ko'rish
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentLessonsPage;
