import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Tag,
  ChevronLeft,
  Eye,
  Heart,
  CheckCircle2
} from 'lucide-react';

const StudentViewLesson: React.FC = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const lessonId = params.id;

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['/api/lessons', lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch lesson');
      return response.json();
    },
    enabled: !!lessonId,
  });

  const dashboardSections = [
    { id: 'dashboard', title: 'Bosh sahifa', href: '/dashboard/student', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tests', title: 'Testlar', href: '/student/tests', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'lessons', title: 'Darsliklar', href: '/student/lessons', icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="student" 
        sections={dashboardSections}
        currentPage="Darslik yuklanyapti..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ResponsiveDashboard>
    );
  }

  if (!lesson) {
    return (
      <ResponsiveDashboard 
        userRole="student" 
        sections={dashboardSections}
        currentPage="Darslik topilmadi"
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Darslik topilmadi</p>
          <Button onClick={() => navigate('/student/lessons')} className="mt-4">
            Darsliklar ro'yxatiga qaytish
          </Button>
        </div>
      </ResponsiveDashboard>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ResponsiveDashboard 
      userRole="student" 
      sections={dashboardSections}
      currentPage={lesson.title}
    >
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/student/lessons')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{lesson.title}</h1>
            {lesson.topic && (
              <p className="text-gray-600 mt-1">{lesson.topic}</p>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {lesson.coverImage && (
          <Card>
            <CardContent className="p-0">
              <img 
                src={lesson.coverImage} 
                alt={lesson.title}
                className="w-full h-64 lg:h-96 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Lesson Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500">Sinf</p>
            <p className="font-medium">{lesson.grade}-sinf</p>
          </div>
          
          {lesson.difficulty && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500 mb-1">Qiyinlik</p>
              <Badge className={getDifficultyColor(lesson.difficulty)}>
                {lesson.difficulty === 'easy' ? 'Oson' : 
                 lesson.difficulty === 'medium' ? "O'rtacha" : 'Qiyin'}
              </Badge>
            </div>
          )}

          {lesson.estimatedTime && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500 mb-1">Vaqt</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{lesson.estimatedTime} min</span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500 mb-1">Ko'rishlar</p>
            <div className="flex items-center justify-center gap-1">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{lesson.viewCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {lesson.description && (
          <Card>
            <CardHeader>
              <CardTitle>Darslik haqida</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{lesson.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Learning Objectives */}
        {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Bu darslikda nimalarni o'rganasiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {lesson.learningObjectives.map((objective: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Darslik matni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{lesson.content}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        {lesson.keywords && lesson.keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Kalit so'zlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lesson.keywords.map((keyword: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Actions */}
        <Card className="bg-gray-50">
          <CardContent className="py-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">Darslikni tugatdingizmi?</h3>
              <p className="text-gray-600 mb-4">
                Agar darslikni to'liq o'qib chiqqan bo'lsangiz, tugmani bosing
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Darslikni tugatdim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveDashboard>
  );
};

export default StudentViewLesson;