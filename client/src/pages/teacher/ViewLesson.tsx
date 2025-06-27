import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
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
  Edit,
  Trash2,
  Eye,
  Heart,
  FileText
} from 'lucide-react';

const ViewLesson: React.FC = () => {
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
    { id: 'dashboard', title: 'Bosh sahifa', href: '/dashboard/teacher', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tests', title: 'Testlar', href: '/teacher/tests', icon: <FileText className="w-4 h-4" /> },
    { id: 'lessons', title: 'Darsliklar', href: '/teacher/lessons', icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <ResponsiveDashboard 
        userRole="teacher" 
        sections={dashboardSections}
        currentPage="Darslik ko'rish"
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
        userRole="teacher" 
        sections={dashboardSections}
        currentPage="Darslik topilmadi"
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Darslik topilmadi</p>
          <Button onClick={() => navigate('/teacher/lessons')} className="mt-4">
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
      userRole="teacher" 
      sections={dashboardSections}
      currentPage={lesson.title}
    >
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/teacher/lessons')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{lesson.title}</h1>
              {lesson.topic && (
                <p className="text-gray-600 mt-1">{lesson.topic}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/teacher/lessons/edit/${lesson.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Tahrirlash
            </Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              O'chirish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Description */}
            {lesson.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Tavsif</CardTitle>
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
                    O'quv maqsadlari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {lesson.learningObjectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Darslik matni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{lesson.content}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ma'lumotlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Sinf</p>
                  <p className="font-medium">{lesson.grade}-sinf</p>
                </div>
                
                {lesson.difficulty && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Qiyinlik darajasi</p>
                    <Badge className={getDifficultyColor(lesson.difficulty)}>
                      {lesson.difficulty === 'easy' ? 'Oson' : 
                       lesson.difficulty === 'medium' ? "O'rtacha" : 'Qiyin'}
                    </Badge>
                  </div>
                )}

                {lesson.estimatedTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{lesson.estimatedTime} daqiqa</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{lesson.viewCount || 0} marta ko'rildi</span>
                </div>

                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{lesson.likeCount || 0} yoqtirish</span>
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
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Holat</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={
                  lesson.status === 'active' ? 'bg-green-100 text-green-800' :
                  lesson.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {lesson.status === 'active' ? 'Faol' :
                   lesson.status === 'draft' ? 'Qoralama' : 'Arxivlangan'}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Yaratilgan: {new Date(lesson.createdAt).toLocaleDateString('uz-UZ')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsiveDashboard>
  );
};

export default ViewLesson;